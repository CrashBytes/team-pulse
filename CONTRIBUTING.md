# Contributing to Team Pulse

Thank you for your interest in contributing to Team Pulse! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before contributing.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce** the issue
- **Expected behavior** vs actual behavior
- **Screenshots** if applicable
- **Environment details**: OS, Node.js version, npm version
- **Configuration** (sanitize any sensitive data)

### Suggesting Enhancements

Enhancement suggestions are welcome! Please:

1. Check if the enhancement has already been suggested
2. Provide a clear use case for the feature
3. Explain why this enhancement would be useful
4. Include mockups or examples if applicable

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Follow the coding standards** described below
3. **Test your changes** thoroughly
4. **Update documentation** if needed
5. **Write clear commit messages** following our conventions
6. **Submit a pull request** with a comprehensive description

## Development Setup

### Prerequisites

- Node.js 16.x or higher
- npm or yarn
- Git

### Local Development

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/team-pulse.git
cd team-pulse

# Install dependencies
npm run install:all

# Set up configuration
cp backend/.env.template backend/.env
cp config.example.json config.json

# Edit configuration files with your credentials
nano backend/.env
nano config.json

# Start development servers
npm run dev
```

### Project Structure

```
team-pulse/
├── backend/          # Express.js API server
│   ├── src/
│   │   ├── index.js       # Main server file
│   │   ├── services/      # External service integrations
│   │   └── routes/        # API routes (future)
│   └── .env              # Environment configuration
├── frontend/         # React + TypeScript UI
│   └── src/
│       ├── components/    # Reusable components
│       ├── pages/         # Page components
│       └── App.tsx        # Main app
├── config.json       # Project and board definitions
└── docker-compose.yml
```

## Coding Standards

### JavaScript/TypeScript

- Use **ES6+ syntax**
- Follow **2-space indentation**
- Use **meaningful variable names**
- Add **JSDoc comments** for functions
- Prefer **const** over let, avoid var
- Use **async/await** over promises when possible

### React Components

- Use **functional components** with hooks
- Keep components **small and focused**
- Extract **reusable logic** into custom hooks
- Use **TypeScript interfaces** for props
- Follow **component naming conventions**

### API Endpoints

- Use **RESTful conventions**
- Return **consistent error formats**
- Include **proper HTTP status codes**
- Add **comprehensive logging**
- Validate **input parameters**

### Error Handling

```javascript
// Good
try {
  const data = await fetchData();
  return data;
} catch (error) {
  console.error("Detailed error context:", error.message);
  throw new Error("User-friendly error message");
}

// Avoid
fetchData().catch(err => console.log(err));
```

### Logging

```javascript
// Use descriptive logs
console.log(`Fetching sprints for board ${boardId} (${boardName})...`);
console.error(`ERROR: Failed to fetch data for ${resource}:`, error.message);

// Avoid generic logs
console.log("getting data");
```

## Commit Message Guidelines

Follow conventional commits format:

```
type(scope): subject

body (optional)

footer (optional)
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Build process or tooling changes

### Examples

```
feat(gitlab): add support for self-hosted GitLab instances

- Added GITLAB_URL environment variable
- Updated API client to use configurable URL
- Added validation for custom URLs

Closes #42
```

```
fix(dashboard): correct sprint date calculation

Fixed off-by-one error in days remaining calculation
```

## Testing

### Backend Tests

```bash
cd backend
npm test
```

### Frontend Tests

```bash
cd frontend
npm test
```

### Manual Testing

Before submitting a PR, test:

1. **All existing features** still work
2. **New features** work as expected
3. **Error cases** are handled gracefully
4. **Configuration changes** don't break existing setups

## Adding New Integrations

When adding support for new services (GitHub, Azure DevOps, etc.):

1. Create a new service module in `backend/src/services/`
2. Follow the existing service pattern (see `firebaseService.js`)
3. Add configuration to `.env.template`
4. Update `config.example.json` if needed
5. Add documentation to README
6. Include error handling for missing credentials
7. Make the integration **optional** (don't break existing functionality)

### Service Module Template

```javascript
// backend/src/services/newService.js
const axios = require('axios');

class NewService {
  constructor(config) {
    this.apiUrl = config.apiUrl;
    this.apiToken = config.apiToken;
    this.validateConfig();
  }

  validateConfig() {
    if (!this.apiUrl || !this.apiToken) {
      throw new Error('Missing required configuration for NewService');
    }
  }

  async fetchData() {
    try {
      const response = await axios.get(`${this.apiUrl}/endpoint`, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('NewService error:', error.message);
      throw error;
    }
  }
}

module.exports = NewService;
```

## Documentation

When updating functionality:

- Update **README.md** for user-facing changes
- Update **API documentation** for endpoint changes
- Add **code comments** for complex logic
- Update **CHANGELOG.md** following Keep a Changelog format
- Create or update **examples** in documentation

## Release Process

Maintainers handle releases following semantic versioning:

1. Update version in all `package.json` files
2. Update `CHANGELOG.md` with release notes
3. Create git tag: `git tag -a v1.x.x -m "Release v1.x.x"`
4. Push tag: `git push origin v1.x.x`
5. Create GitHub release with changelog

## Questions?

- Open an issue for **questions about contributing**
- Join our **discussions** for general questions
- Check **existing issues** and **pull requests**

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).

---

**Thank you for contributing to Team Pulse!** 🎉
