const { createEnv, s } = require('@crashbytes/env-shield')
const dotenv = require('dotenv')
const path = require('path')

// Load .env from backend directory
dotenv.config({ path: path.join(__dirname, '../.env') })

const env = createEnv({
  schema: {
    // Server
    PORT: s.port().default(5001),

    // Jira (required)
    JIRA_HOST: s.url(),
    JIRA_EMAIL: s.email(),
    JIRA_TOKEN: s.string().min(1),

    // GitLab (required)
    GITLAB_URL: s.url(),
    GITLAB_TOKEN: s.string().min(1),

    // Firebase (optional)
    FIREBASE_SERVICE_ACCOUNT: s.string().optional(),

    // GitHub (optional)
    GITHUB_TOKEN: s.string().optional(),
    GITHUB_OWNER: s.string().optional(),
    GITHUB_REPO: s.string().optional(),

    // Slack (optional)
    SLACK_TOKEN: s.string().optional(),

    // Snyk (optional)
    SNYK_TOKEN: s.string().optional(),
    SNYK_ORG_ID: s.string().optional(),

    // SonarQube (optional)
    SONARQUBE_URL: s.string().optional(),
    SONARQUBE_TOKEN: s.string().optional(),
    SONARQUBE_PROJECT: s.string().optional(),
  },
})

module.exports = { env }
