const https = require('https');

class GitHubAPI {
  constructor(token) {
    this.token = token;
    this.baseUrl = 'api.github.com';
  }

  async makeRequest(method, path, data = null, headers = null) {
    return new Promise((resolve, reject) => {
      const requestHeaders = {
        Authorization: `Bearer ${this.token}`,
        'User-Agent': 'OpenRouter-Code-Review-Bot',
        Accept: 'application/vnd.github.v3+json'
      };
      
      if (headers) {
        Object.assign(requestHeaders, headers);
      }

      const options = {
        hostname: this.baseUrl,
        path,
        method,
        headers: requestHeaders
      };

      if (data) {
        options.headers['Content-Type'] = 'application/json';
      }

      const req = https.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const parsed = JSON.parse(responseData);
              resolve(parsed);
            } catch (e) {
              reject(new Error(`Failed to parse GitHub API response: ${e.message}`));
            }
          } else {
            reject(new Error(`GitHub API request failed: ${res.statusCode} - ${responseData}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      if (data) {
        req.write(JSON.stringify(data));
      }

      req.end();
    });
  }

  async getPullRequest(owner, repo, prNumber) {
    const path = `/repos/${owner}/${repo}/pulls/${prNumber}`;
    return this.makeRequest('GET', path);
  }

  async createReviewComment(owner, repo, prNumber, commitId, path, line, body) {
    try {
      const pr = await this.getPullRequest(owner, repo, prNumber);
      const headSha = pr.head.sha;

      const reviewPath = `/repos/${owner}/${repo}/pulls/${prNumber}/comments`;
      return await this.makeRequest('POST', reviewPath, {
        body,
        commit_id: headSha,
        path,
        position: line,
        line: line,
        side: 'RIGHT'
      });
    } catch (error) {
      if (error.statusCode === 422 || (error.response && error.response.statusCode === 422)) {
        console.log('Invalid position parameter detected, retrying with modified payload...');
        const reviewPath = `/repos/${owner}/${repo}/pulls/${prNumber}/comments`;
        return await this.makeRequest('POST', reviewPath, {
          body,
          commit_id: headSha,
          path,
          line: line,
          side: 'RIGHT'
        });
      }
      console.error('Error creating review comment:', error);
      throw error;
    }
  }

  async postComment(owner, repo, prNumber, body) {
    const path = `/repos/${owner}/${repo}/issues/${prNumber}/comments`;
    return this.makeRequest('POST', path, { body });
  }

  async createReview(owner, repo, prNumber, comments, body) {
    const path = `/repos/${owner}/${repo}/pulls/${prNumber}/reviews`;
    return this.makeRequest('POST', path, {
      body,
      event: 'COMMENT',
      comments
    });
  }

  async getPullRequestDiff(owner, repo, prNumber) {
    const path = `/repos/${owner}/${repo}/pulls/${prNumber}`;
    const headers = {
      Accept: 'application/vnd.github.v3.diff'
    };
    return this.makeRequest('GET', path, null, headers);
  }

  async updateReviewComment(owner, repo, commentId, body) {
    const path = `/repos/${owner}/${repo}/pulls/comments/${commentId}`;
    return this.makeRequest('PATCH', path, { body });
  }

  async getExistingComments(owner, repo, prNumber) {
    const path = `/repos/${owner}/${repo}/pulls/${prNumber}/comments`;
    return this.makeRequest('GET', path);
  }
}

module.exports = {
  GitHubAPI
};
