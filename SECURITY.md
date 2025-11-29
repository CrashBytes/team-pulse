# Security Policy

## Supported Versions

We release patches for security vulnerabilities for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

If you discover a security vulnerability, please email us at:

**security@crashbytes.com**

Include the following information:

- Type of vulnerability
- Full paths of source file(s) related to the vulnerability
- Location of the affected source code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the vulnerability, including how an attacker might exploit it

### What to expect

- We will acknowledge receipt of your vulnerability report within 48 hours
- We will provide a detailed response within 7 days, including next steps
- We will keep you informed about the progress toward fixing the vulnerability
- We may ask for additional information or guidance
- We will credit you for the discovery when we announce the fix (unless you prefer to remain anonymous)

## Security Best Practices

When deploying Team Pulse, follow these security guidelines:

### API Tokens and Credentials

- **Never commit** `.env` files to version control
- Store API tokens in **environment variables** only
- Use **least-privilege** API tokens with minimal required permissions
- Rotate tokens **regularly** (recommended: every 90 days)
- Revoke tokens **immediately** if compromised

### Network Security

- Deploy backend behind **reverse proxy** (nginx, Apache)
- Enable **HTTPS** for production deployments
- Configure **CORS** restrictively (don't use wildcards in production)
- Use **firewall rules** to limit backend access
- Consider **VPN** or **IP whitelisting** for sensitive environments

### Configuration Security

```bash
# Set restrictive file permissions
chmod 600 backend/.env
chmod 600 config.json

# Don't expose sensitive information in logs
# Review logs before sharing for troubleshooting
```

### Docker Security

```bash
# Don't run containers as root
# Use docker-compose.yml with security options
services:
  backend:
    user: "node:node"
    read_only: true
    security_opt:
      - no-new-privileges:true
```

### Environment Variables

Required environment variables contain sensitive data:

```bash
# Jira credentials
JIRA_TOKEN=          # API token with read-only access

# GitLab credentials  
GITLAB_TOKEN=        # Personal access token with read_api scope only

# Firebase credentials (optional)
FIREBASE_PRIVATE_KEY= # Service account key
```

**Minimize token permissions:**
- Jira: Read-only access to projects and boards
- GitLab: `read_api` and `read_repository` scopes only
- Firebase: Service account with Analytics and Crashlytics read permissions

### Production Deployment

1. **Use environment-specific configurations**
   ```bash
   # Separate .env files for each environment
   .env.development
   .env.staging
   .env.production
   ```

2. **Enable health checks**
   ```bash
   # Monitor the health endpoint
   GET /health
   ```

3. **Implement rate limiting**
   ```javascript
   // Add to backend if exposing publicly
   const rateLimit = require('express-rate-limit');
   
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100 // limit each IP to 100 requests per windowMs
   });
   
   app.use(limiter);
   ```

4. **Regular security updates**
   ```bash
   # Check for vulnerable dependencies
   npm audit
   
   # Update dependencies
   npm update
   
   # Fix vulnerabilities
   npm audit fix
   ```

### Data Privacy

Team Pulse processes the following data:

- **Jira**: Issue metadata, assignees, story points, sprint information
- **GitLab**: Commit metadata, merge request data, contributor information
- **Firebase** (optional): Crash analytics, performance metrics

**Data handling:**
- Data is **not stored** permanently (real-time aggregation only)
- Sensitive data stays in **memory** during API requests
- No data is sent to **third-party services**
- Configure what data to expose in dashboard filters

### Audit Logging

For production deployments, consider adding audit logging:

```javascript
// Log all API requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path} ${req.ip}`);
  next();
});
```

## Known Security Considerations

### Current Implementation

1. **Authentication**: The dashboard currently has no built-in authentication
   - Recommended: Deploy behind an authentication proxy (OAuth2, SAML)
   - Consider: Add basic auth for production deployments

2. **CORS Configuration**: Currently allows multiple localhost origins
   - Production: Configure specific allowed origins only
   - Update: `backend/src/index.js` CORS settings

3. **Error Messages**: Debug endpoints expose internal information
   - Production: Disable or restrict `/api/debug/*` endpoints
   - Consider: Environment-based endpoint enabling

### Dependency Security

We regularly scan dependencies for vulnerabilities:

```bash
# Run security audit
npm audit

# Review and update
npm audit fix
```

Known dependencies with security considerations:
- Monitor GitHub security advisories for updates
- Subscribe to npm security notifications
- Review CHANGELOG for security-related updates

## Security Disclosure Policy

When we receive a security report:

1. **Confirmation**: We confirm the vulnerability
2. **Investigation**: We determine the impact and affected versions
3. **Fix Development**: We develop and test a fix
4. **Security Advisory**: We publish a security advisory (GitHub Security Advisory)
5. **Release**: We release a patched version
6. **Communication**: We notify users through:
   - GitHub release notes
   - Security advisory
   - CHANGELOG update
   - Email to known deployments (if applicable)

## Third-Party Security

Team Pulse integrates with:

- **Jira** (Atlassian): Review their [security practices](https://www.atlassian.com/trust/security)
- **GitLab**: Review their [security documentation](https://about.gitlab.com/security/)
- **Firebase** (Google): Review their [security guidelines](https://firebase.google.com/support/privacy)

Ensure you follow each service's security best practices when generating API tokens.

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [React Security Best Practices](https://snyk.io/blog/10-react-security-best-practices/)

## Contact

For security concerns: **security@crashbytes.com**

For general questions: Open a GitHub issue

---

**Security is a shared responsibility. Thank you for helping keep Team Pulse safe!**
