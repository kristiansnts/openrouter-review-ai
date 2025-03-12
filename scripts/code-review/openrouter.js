const https = require('https');
const { REVIEW_CONFIG } = require('./config');
const { minimatch } = require('minimatch');

class OpenRouterAPI {
  constructor(model = 'deepseek/deepseek-r1-distill-llama-70b:free') {
    this.baseUrl = 'https://openrouter.ai/api/v1';
    this.model = process.env.MODEL || model;
    this.filePattern = process.env.FILE_PATTERN || '**/*.{js,jsx,ts,tsx,py,php}';
    this.apiKey = process.env.OPENROUTER_API_KEY;
    
    if (!this.apiKey) {
      throw new Error('OPENROUTER_API_KEY environment variable is required');
    }
  }

  shouldReviewFile(filename) {
    return minimatch(filename, this.filePattern);
  }

  async makeRequest(endpoint, data) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'openrouter.ai',
        port: 443,
        path: `/api/v1${endpoint}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': process.env.GITHUB_REPOSITORY || 'https://github.com',
          'X-Title': 'GitHub Code Review'
        }
      };

      const req = https.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          try {
            resolve(JSON.parse(responseData));
          } catch (e) {
            reject(new Error(`Failed to parse OpenRouter response: ${e.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`OpenRouter API request failed: ${error.message}`));
      });

      req.write(JSON.stringify(data));
      req.end();
    });
  }

  async reviewCode(content, filename, changedLines) {
    if (!this.shouldReviewFile(filename)) {
      return [];
    }

    const prompt = `You are an expert code reviewer. Review the following code changes and provide specific, actionable feedback. Focus on:
1. Type safety and potential runtime issues
2. Architecture and design patterns
3. Code readability and maintainability
4. Security vulnerabilities (IMPORTANT: for security issues like 'eval', use the EXACT line where the dangerous function is called)
5. Performance implications

The code below shows:
- Each line starts with its EXACT line number followed by a colon
- Changed lines are marked with [CHANGED]
- You MUST use the EXACT line number shown at the start of the line in your response
- DO NOT use a line number unless you see it explicitly at the start of a line
- For security issues, use the line number where the actual dangerous code appears
- For other multi-line issues, use the first line number where the issue appears
- Context lines are shown without markers

IMPORTANT NOTES:
- For security issues (like eval, Function constructor, etc.), always use the line number where the dangerous function is actually called
- For performance issues (like nested loops), use the line number of the outer function or loop
- Double-check that your line numbers match exactly with where the issue occurs

Code to review from ${filename}:

${content}

Response format (use EXACT line numbers from the start of lines):
[
  {
    "line": <number_from_start_of_line>,
    "type": "type-safety" | "architecture" | "readability" | "security" | "performance" | "suggestion" | "good-practice",
    "severity": "high" | "medium" | "low",
    "message": "<specific_issue_and_recommendation>"
  }
]

Rules:
1. Only comment on [CHANGED] lines
2. Use EXACT line numbers shown at start of lines
3. Each line number must match one of: ${JSON.stringify(changedLines)}
4. Consider context when making suggestions
5. Be specific and actionable in recommendations
6. For security issues, use the exact line where dangerous code appears
7. For other multi-line issues, use the first line number where the issue appears

If no issues found, return: []`;

    try {
      const response = await this.makeRequest('/chat/completions', {
        model: this.model,
        messages: [
          { role: "system", content: "You are an expert code reviewer providing detailed, actionable feedback in JSON format." },
          { role: "user", content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 2048,
        top_p: 0.9
      });

      try {
        // Extract the content from the OpenRouter response
        const content = response.choices[0].message.content;
        // Find the JSON array in the response
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        
        if (jsonMatch) {
          const reviews = JSON.parse(jsonMatch[0]);
          return reviews.filter(
            (review) =>
              changedLines.includes(review.line) && review.type && review.severity && review.message
          );
        } else {
          console.error('No valid JSON found in response');
          return [];
        }
      } catch (error) {
        console.error('Error parsing OpenRouter review response:', error);
        return [];
      }
    } catch (error) {
      console.error('Error during code review:', error);
      return [];
    }
  }
}

module.exports = {
  OpenRouterAPI
};
