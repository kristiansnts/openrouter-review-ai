const http = require('http');
const { REVIEW_CONFIG } = require('./config');
const { minimatch } = require('minimatch');

class OllamaAPI {
  constructor(model = 'codellama') {
    this.baseUrl = 'http://localhost:11434';
    this.model = model;
    this.filePattern = process.env.FILE_PATTERN || '**/*.{ts,tsx}';
  }

  shouldReviewFile(filename) {
    return minimatch(filename, this.filePattern);
  }

  async makeRequest(endpoint, data) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 11434,
        path: endpoint,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const req = http.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          try {
            resolve(JSON.parse(responseData));
          } catch (e) {
            reject(new Error(`Failed to parse Ollama response: ${e.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Ollama API request failed: ${error.message}`));
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
      const response = await this.makeRequest('/api/generate', {
        model: this.model,
        prompt,
        stream: false,
        temperature: 0.1,
        top_k: 10,
        top_p: 0.9
      });

      try {
        const reviews = JSON.parse(response.response);
        return reviews.filter(
          (review) =>
            changedLines.includes(review.line) && review.type && review.severity && review.message
        );
      } catch (error) {
        console.error('Error parsing Ollama review response:', error);
        return [];
      }
    } catch (error) {
      console.error('Error during code review:', error);
      return [];
    }
  }
}

module.exports = {
  OllamaAPI
};
