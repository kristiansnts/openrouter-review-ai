# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Which versions are eligible for receiving such patches depends on the CVSS v3.0 Rating:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

Please report (suspected) security vulnerabilities to **[security@carofi.app](mailto:security@carofi.app)**. You will receive a response from us within 48 hours. If the issue is confirmed, we will release a patch as soon as possible depending on complexity but historically within a few days.

## Security Considerations

This action runs entirely within your GitHub Actions environment:

1. **Local Execution**: The Ollama model runs locally within the action, ensuring your code stays private.
2. **No External Services**: No code is sent to external services for analysis.
3. **GitHub Token**: The action requires a GitHub token with `pull-requests: write` permission to post review comments.
4. **Dependencies**: We regularly update dependencies to patch security vulnerabilities.

## Best Practices

When using this action:

1. Always pin to a specific version (e.g., `@v1`) rather than using `@main`
2. Review the permissions required by the action
3. Use the minimum required permissions in your workflow
4. Keep your GitHub Actions runner updated
5. Monitor our security advisories and update when patches are released

## Disclosure Policy

When we receive a security bug report, we will:

1. Confirm the problem and determine the affected versions.
2. Audit code to find any potential similar problems.
3. Prepare fixes for all supported versions.
4. Release new versions of the action.
5. Notify users via our security advisories.
