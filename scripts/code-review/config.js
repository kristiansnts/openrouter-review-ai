const REVIEW_CONFIG = {
  emojis: {
    'unused-comment': '💬❌',
    'hardcoded-value': '🏗️❌',
    'meaningless-name': '📖❓',
    'duplicated-code': '🛡️❌',
    'naming-convention': '⚡❌',
    'nested-conditionals': '💡❌',
    'coupling-cohesion': '✨❌',
    'separation-of-concerns': '🔒❌'
  },
  concurrencyLimit: 3,
  supportedExtensions: '\.(js|jsx|ts|tsx|py|go|java|rb|php|cs)$',
  maxFileSize: 500 * 1024, // 500KB
  reviewPrompt: `
    Review the code changes and provide specific based on the programming language, actionable feedback. Focus on:
    1. Unused Comment and Imports (check if the comment is used for documentation standarts like phpdoc or jsdoc)
    2. Avoid hardcoding values
    3. Use Meaningful Variable and Function Names
    4. Write Short Functions That Only Do One Thing
    5. Follow the DRY (Don't Repeat Yourself) Principle and Avoid Duplicating Code or Logic
    6. Use Consistent Naming Conventions
    7. Follow Established Code-Writing Standards (eg. use camelCase for Java, snake_case for Python, etc.)
    8. Encapsulate Nested Conditionals into Functions
    9. High Coupling and Low Cohesion
    10. Separation of Concerns
    
    Format each issue as:
    - Type: (unused-comment|hardcoded-value|meaningless-name|duplicated-code|naming-convention|nested-conditionals|coupling-cohesion|separation-of-concerns)
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
