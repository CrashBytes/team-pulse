---
name: Bug Report
about: Create a report to help us improve Team Pulse
title: '[BUG] '
labels: bug
assignees: ''
---

## Bug Description

<!-- A clear and concise description of what the bug is -->

## Steps to Reproduce

1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## Expected Behavior

<!-- What you expected to happen -->

## Actual Behavior

<!-- What actually happened -->

## Screenshots

<!-- If applicable, add screenshots to help explain your problem -->

## Environment

- **Team Pulse Version**: [e.g. 1.0.0]
- **Node.js Version**: [e.g. 18.17.0]
- **npm Version**: [e.g. 9.8.1]
- **Operating System**: [e.g. Ubuntu 22.04, macOS 13.5, Windows 11]
- **Browser** (if frontend issue): [e.g. Chrome 116, Firefox 117]

## Configuration

<!-- Sanitize any sensitive information -->

### Environment Variables (sanitized)

```
JIRA_HOST=https://your-company.atlassian.net
GITLAB_URL=https://gitlab.com
```

### config.json Structure

```json
{
  "projects": {
    "123": {
      "name": "example-project",
      "category": "mobile"
    }
  },
  "boards": {
    "10": {
      "name": "Example Board",
      "projects": ["123"],
      "category": "mobile"
    }
  }
}
```

## Logs

<!-- Include relevant error messages or logs -->

```
Paste logs here (sanitize any sensitive data)
```

## Additional Context

<!-- Add any other context about the problem here -->

## Possible Solution

<!-- If you have suggestions on how to fix the bug -->

## Related Issues

<!-- Link to related issues if any -->
