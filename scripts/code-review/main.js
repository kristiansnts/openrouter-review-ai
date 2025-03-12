const { ReviewStats } = require('./stats');
const { GitHubAPI } = require('./github');
const { OpenRouterAPI } = require('./openrouter');
const { REVIEW_CONFIG } = require('./config');
const parseDiff = require('parse-diff');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { minimatch } = require('minimatch');
const filePattern = process.env.FILE_PATTERN;

// Cache for existing comments
let existingCommentsCache = null;

// Function to get existing comments with caching
async function getExistingComments(github, owner, repo, prNumber) {
  if (!existingCommentsCache) {
    existingCommentsCache = await github.getExistingComments(owner, repo, prNumber);
  }
  return existingCommentsCache;
}

// Function to check if a similar comment already exists
function findExistingComment(existingComments, newComment) {
  return existingComments.find(
    (existing) =>
      existing.path === newComment.path &&
      existing.line === newComment.line &&
      existing.body.includes(newComment.message.substring(0, 50)) // Compare first 50 chars to avoid minor differences
  );
}

// Function to merge comments on the same line
function mergeComments(comments) {
  const mergedComments = new Map();

  for (const comment of comments) {
    const key = `${comment.path}:${comment.line}`;
    if (!mergedComments.has(key)) {
      mergedComments.set(key, {
        ...comment,
        body: `${REVIEW_CONFIG.emojis[comment.type] || '💭'} **${comment.type.toUpperCase()}** (${
          comment.severity
        })\n\n${comment.message}`
      });
    } else {
      const existing = mergedComments.get(key);
      existing.body += `\n\n${
        REVIEW_CONFIG.emojis[comment.type] || '💭'
      } **${comment.type.toUpperCase()}** (${comment.severity})\n\n${comment.message}`;
    }
  }

  return Array.from(mergedComments.values());
}

// Function to get changed lines from a chunk with proper line numbers and context
function getChangedLines(chunk) {
  const changedLines = new Map();
  const addedLineNumbers = new Set();
  let position = chunk.newStart;

  // First pass: collect all lines with their proper numbers and mark added lines
  chunk.changes.forEach((change) => {
    if (change.type === 'add' || change.type === 'normal') {
      const lineNum = change.ln || change.ln2;
      if (lineNum) {
        changedLines.set(lineNum, {
          content: change.content,
          type: change.type,
          position: lineNum // Use actual line number as position
        });
        if (change.type === 'add') {
          addedLineNumbers.add(lineNum);
        }
      }
    }
  });

  // Include context lines
  const contextLines = new Map();
  Array.from(addedLineNumbers).forEach((lineNum) => {
    // Include 3 lines before and after each changed line
    for (let i = Math.max(1, lineNum - 3); i <= lineNum + 3; i++) {
      if (changedLines.has(i)) {
        contextLines.set(i, changedLines.get(i));
      }
    }
  });

  return {
    context: contextLines,
    addedLines: Array.from(addedLineNumbers)
  };
}

async function processChunk(chunk, file, github, openrouter, stats) {
  const { context, addedLines } = getChangedLines(chunk);
  if (addedLines.length === 0) return;

  // Create a string with line numbers, content, and markers for changed lines
  const contentWithLines = Array.from(context.entries())
    .sort(([a], [b]) => a - b)
    .map(([lineNum, { content, type }]) => {
      const isChanged = type === 'add';
      return `${lineNum}:${isChanged ? ' [CHANGED] ' : ' '}${content.trim()}`;
    })
    .join('\n');

  console.log(`Reviewing ${file.to} with context:\n${contentWithLines}`);
  console.log('Changed lines:', addedLines);

  const reviews = await openrouter.reviewCode(contentWithLines, file.to, addedLines);
  console.log('Received reviews:', JSON.stringify(reviews, null, 2));

  const commentsToPost = [];
  for (const review of reviews) {
    if (!review.line || !addedLines.includes(review.line)) {
      console.log(`Skipping review for invalid line number: ${review.line}`);
      continue;
    }

    const lineData = context.get(review.line);
    if (!lineData) {
      console.log(`No context found for line ${review.line}`);
      continue;
    }

    stats.updateStats(review.type, review.severity, review.message, file.to, review.line);
    commentsToPost.push({
      ...review,
      path: file.to,
      line: review.line, // Use the actual line number
      message: review.message
    });
  }

  const mergedComments = mergeComments(commentsToPost);
  const existingComments = await getExistingComments(
    github,
    process.env.GITHUB_REPOSITORY_OWNER,
    process.env.GITHUB_REPOSITORY.split('/')[1],
    process.env.PR_NUMBER
  );

  for (const comment of mergedComments) {
    try {
      const existingComment = findExistingComment(existingComments, comment);
      if (existingComment) {
        console.log(
          `Skipping duplicate comment for ${comment.path}:${comment.line} as it already exists`
        );
        continue;
      }

      console.log(`Creating comment for ${comment.path} at line ${comment.line}:`);
      console.log(`Content at line: ${context.get(comment.line).content}`);

      await github.createReviewComment(
        process.env.GITHUB_REPOSITORY_OWNER,
        process.env.GITHUB_REPOSITORY.split('/')[1],
        process.env.PR_NUMBER,
        process.env.GITHUB_SHA,
        comment.path,
        comment.line,
        comment.body
      );
    } catch (error) {
      console.error(
        `Failed to create review comment for ${comment.path}:${comment.line}:`,
        error.message
      );
    }
  }
}

async function main() {
  try {
    const github = new GitHubAPI(process.env.GITHUB_TOKEN);
    const openrouter = new OpenRouterAPI();
    const stats = new ReviewStats();

    // Use the GitHub event's base branch or fall back to 'main'
    const baseBranch = process.env.BASE_BRANCH || 'origin/main';
    
    // Fetch the base branch to ensure it exists
    try {
      execSync('git fetch --no-tags --prune --depth=1 origin +refs/heads/*:refs/remotes/origin/*');
      console.log('Fetched remote branches');
    } catch (fetchError) {
      console.warn('Warning: Failed to fetch branches:', fetchError.message);
    }
    
    // Get the diff between the base branch and current HEAD
    let diffOutput;
    try {
      diffOutput = execSync(`git diff ${baseBranch} HEAD`).toString();
    } catch (diffError) {
      console.warn(`Failed to diff against ${baseBranch}, falling back to comparing with HEAD~1`);
      diffOutput = execSync('git diff HEAD~1 HEAD').toString();
    }
    
    const files = parseDiff(diffOutput);

    const filesToReview = files.filter((file) => file.to && minimatch(file.to, filePattern));

    console.log(`Found ${files.length} changed files`);
    console.log(`Reviewing ${filesToReview.length} TypeScript files`);

    const chunks = filesToReview.flatMap((file) => file.chunks.map((chunk) => ({ chunk, file })));

    for (let i = 0; i < chunks.length; i += REVIEW_CONFIG.concurrencyLimit) {
      const batch = chunks.slice(i, i + REVIEW_CONFIG.concurrencyLimit);
      await Promise.all(
        batch.map(({ chunk, file }) => processChunk(chunk, file, github, openrouter, stats))
      );
    }

    const summary = stats.generateSummary();
    await github.postComment(
      process.env.GITHUB_REPOSITORY_OWNER,
      process.env.GITHUB_REPOSITORY.split('/')[1],
      process.env.PR_NUMBER,
      summary
    );

    console.log('Code review completed successfully');
  } catch (error) {
    console.error('Error in code review process:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Error in main:', error);
    process.exit(1);
  });
}
