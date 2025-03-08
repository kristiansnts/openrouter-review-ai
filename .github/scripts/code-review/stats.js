class ReviewStats {
  constructor() {
    this.stats = {
      typeSafetyIssues: 0,
      architectureIssues: 0,
      readabilityIssues: 0,
      securityIssues: 0,
      performanceIssues: 0,
      suggestions: 0,
      goodPatterns: 0,
      blockingIssues: 0,
      aiSuggestions: 0,
      aiIssues: 0,
      aiPraises: 0
    };
    this.issuesByType = new Map();
    this.highSeverityIssues = [];
  }

  updateStats(type, severity, message, file, line) {
    // Update count based on type
    switch (type) {
      case 'type-safety':
        this.stats.typeSafetyIssues++;
        break;
      case 'architecture':
        this.stats.architectureIssues++;
        break;
      case 'readability':
        this.stats.readabilityIssues++;
        break;
      case 'security':
        this.stats.securityIssues++;
        break;
      case 'performance':
        this.stats.performanceIssues++;
        break;
      case 'suggestion':
        this.stats.suggestions++;
        break;
      case 'good-practice':
        this.stats.goodPatterns++;
        break;
    }

    // Track high severity issues
    if (severity === 'high') {
      this.highSeverityIssues.push({ type, message, file, line });
    }

    // Group issues by type
    if (!this.issuesByType.has(type)) {
      this.issuesByType.set(type, []);
    }
    this.issuesByType.get(type).push({ severity, message, file, line });
  }

  generateSummary() {
    const totalIssues = Object.values(this.stats).reduce((a, b) => a + b, 0);

    let summary = '## 🔍 Code Review Summary\n\n';

    // Overall statistics
    summary += '### 📊 Overall Statistics\n';
    summary += `- Total issues found: ${totalIssues}\n`;
    summary += `- High severity issues: ${this.highSeverityIssues.length}\n`;
    summary += `- Type safety issues: ${this.stats.typeSafetyIssues}\n`;
    summary += `- Architecture issues: ${this.stats.architectureIssues}\n`;
    summary += `- Security concerns: ${this.stats.securityIssues}\n`;
    summary += `- Performance issues: ${this.stats.performanceIssues}\n`;
    summary += `- Readability improvements: ${this.stats.readabilityIssues}\n`;
    summary += `- Suggestions: ${this.stats.suggestions}\n`;
    summary += `- Good patterns identified: ${this.stats.goodPatterns}\n\n`;

    // High severity issues section
    if (this.highSeverityIssues.length > 0) {
      summary += '### ❗ High Priority Issues\n';
      this.highSeverityIssues.forEach((issue) => {
        summary += `- ${issue.type.toUpperCase()}: ${issue.message} (${issue.file}:${
          issue.line
        })\n`;
      });
      summary += '\n';
    }

    // Detailed breakdown by type
    summary += '### 📝 Detailed Breakdown\n';
    for (const [type, issues] of this.issuesByType) {
      if (issues.length > 0) {
        summary += `\n#### ${type.toUpperCase()}\n`;
        const groupedBySeverity = issues.reduce((acc, issue) => {
          if (!acc[issue.severity]) acc[issue.severity] = [];
          acc[issue.severity].push(issue);
          return acc;
        }, {});

        ['high', 'medium', 'low'].forEach((severity) => {
          if (groupedBySeverity[severity]) {
            summary += `\n**${severity.toUpperCase()}**:\n`;
            groupedBySeverity[severity].forEach((issue) => {
              summary += `- ${issue.message} (${issue.file}:${issue.line})\n`;
            });
          }
        });
      }
    }

    return summary;
  }
}

module.exports = {
  ReviewStats
};
