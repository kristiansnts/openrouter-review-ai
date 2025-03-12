const REVIEW_CONFIG = {
  emojis: {
    'type-safety': '🔒',
    architecture: '🏗️',
    readability: '📖',
    security: '🛡️',
    performance: '⚡',
    suggestion: '💡',
    'good-practice': '✨',
    blocking: '🚫',
    'ai-suggestion': '🤖',
    'ai-issue': '⚠️',
    'ai-praise': '👏'
  },
  concurrencyLimit: 3,
  supportedExtensions: '\.(js|jsx|ts|tsx|py|go|java|rb|php|cs)$',
  maxFileSize: 500 * 1024, // 500KB
  reviewPrompt: `
    Review the code changes and provide specific, actionable feedback. Focus on:
    1. Type safety and potential runtime issues
    2. Architecture and design patterns
    3. Code readability and maintainability
    4. Security vulnerabilities
    5. Performance implications
    
    Format each issue as:
    - Type: (type-safety|architecture|readability|security|performance|suggestion|good-practice)
    - Severity: (high|medium|low)
    - Line: <line_number>
    - Message: <detailed_explanation>
    
    Combine multiple issues on the same line into a single comment.
    Be specific and provide examples where possible.
  `
};

module.exports = {
  REVIEW_CONFIG
};
