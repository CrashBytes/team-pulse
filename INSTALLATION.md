# Installation Guide - Team Pulse

## 🚀 Quick Installation

Team Pulse provides an automated installation script that sets up everything for you.

### Prerequisites

Before running the installer, ensure you have:

- **Node.js** 16.x or higher ([Download](https://nodejs.org))
- **npm** (comes with Node.js)
- **Git** (for cloning the repository)

### Automated Installation (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/CrashBytes/team-pulse.git
cd team-pulse

# 2. Run the installation script
chmod +x install.sh
./install.sh
```

### What the Installer Does

The `install.sh` script automatically:

1. ✅ **Checks prerequisites** - Verifies Node.js 16+ and npm are installed
2. ✅ **Installs dependencies** - Runs `npm run install:all` for all packages
3. ✅ **Creates config files** - Copies `.env.template` and `config.example.json`
4. ✅ **Interactive setup** (optional) - Guides you through credential configuration
5. ✅ **Shows next steps** - Clear instructions on what to do next

### Interactive Configuration

The installer offers an **optional** interactive configuration:

```
Would you like to configure your credentials now? (y/n)
```

If you choose **yes (y)**, it will prompt you for:

**Jira Configuration:**
- Jira Host (e.g., `https://your-company.atlassian.net`)
- Jira Email
- Jira API Token

**GitLab Configuration:**
- GitLab URL (e.g., `https://gitlab.com`)
- GitLab Personal Access Token

**Firebase Configuration (Optional):**
- Firebase Project ID
- Firebase Private Key
- Firebase Client Email

**Server Configuration:**
- Backend Port (default: 5001)

If you choose **no (n)**, you can manually edit the files later.

---

## 📝 Manual Installation

If you prefer to set things up manually:

### 1. Clone and Install

```bash
git clone https://github.com/CrashBytes/team-pulse.git
cd team-pulse
npm run install:all
```

### 2. Configure Backend Environment

```bash
cp backend/.env.template backend/.env
nano backend/.env  # or use your preferred editor
```

Required configuration in `backend/.env`:

```bash
# Jira Configuration
JIRA_HOST=https://your-company.atlassian.net
JIRA_EMAIL=your-email@company.com
JIRA_TOKEN=your-jira-api-token

# GitLab Configuration
GITLAB_URL=https://gitlab.com
GITLAB_TOKEN=your-gitlab-token

# Firebase Configuration (Optional)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# Server Configuration
PORT=5001
```

### 3. Configure Projects and Boards

```bash
cp config.example.json config.json
nano config.json
```

Example `config.json`:

```json
{
  "projects": {
    "123": {
      "name": "mobile-app",
      "category": "mobile",
      "display": "Mobile App"
    },
    "456": {
      "name": "web-frontend",
      "category": "web",
      "display": "Web Frontend"
    }
  },
  "boards": {
    "10": {
      "name": "Mobile Sprint Board",
      "projects": ["123"],
      "category": "mobile"
    },
    "20": {
      "name": "Web Sprint Board",
      "projects": ["456"],
      "category": "web"
    }
  }
}
```

### 4. Start the Application

```bash
npm run dev
```

Access the application:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5001
- **Health Check**: http://localhost:5001/health

---

## 🔑 Getting API Credentials

### Jira API Token

1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Click **"Create API token"**
3. Give it a name (e.g., "Team Pulse")
4. Copy the generated token
5. Use this as `JIRA_TOKEN` in `.env`

### GitLab Personal Access Token

1. Go to GitLab → Settings → Access Tokens
2. Create a token with scopes: `api`, `read_repository`
3. Copy the generated token
4. Use this as `GITLAB_TOKEN` in `.env`

### Firebase Service Account (Optional)

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click **"Generate new private key"**
3. Download the JSON file
4. Extract these values:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `private_key` → `FIREBASE_PRIVATE_KEY`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`

### Finding Project and Board IDs

**Jira Board IDs:**
1. Navigate to your Jira board
2. Look at the URL: `https://your-company.atlassian.net/jira/software/c/projects/PROJ/boards/123`
3. The number after `/boards/` is your board ID (e.g., `123`)

**GitLab Project IDs:**
1. Go to your GitLab project
2. Settings → General → Project ID
3. Use this ID in `config.json`

---

## 🐳 Docker Installation

If you prefer Docker:

```bash
git clone https://github.com/CrashBytes/team-pulse.git
cd team-pulse

# Configure environment
cp backend/.env.template backend/.env
cp config.example.json config.json
# Edit both files with your credentials

# Start with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## ✅ Verify Installation

After installation, verify everything is working:

### 1. Check Health Endpoint

```bash
curl http://localhost:5001/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-11-29T12:00:00.000Z",
  "services": {
    "firebase": "configured",
    "gitlab": "configured",
    "jira": "configured",
    "config": "loaded"
  },
  "configuration": {
    "projects": 3,
    "boards": 2
  }
}
```

### 2. Access Frontend

Open your browser to http://localhost:3000

You should see the Team Pulse dashboard.

### 3. Run Tests

```bash
cd backend
npm test
```

All health endpoint tests should pass.

---

## 🔧 Troubleshooting

### "Node.js is not installed"
- Install Node.js 16.x or higher from https://nodejs.org

### "Failed to install dependencies"
- Check your internet connection
- Try: `npm cache clean --force`
- Then: `npm run install:all`

### "Missing required Jira/GitLab configuration"
- Verify `backend/.env` exists and has valid credentials
- Check that `JIRA_TOKEN` and `GITLAB_TOKEN` are set

### "No projects/boards configured"
- Verify `config.json` exists
- Check the JSON is valid
- Ensure project and board IDs are correct

### Backend won't start
- Check if port 5001 is already in use
- Change `PORT` in `backend/.env`
- Verify all environment variables are set

---

## 📚 Next Steps

After installation:

1. **Configure your projects** - Add your GitLab project IDs to `config.json`
2. **Configure your boards** - Add your Jira board IDs to `config.json`
3. **Test the connection** - Visit the health endpoint
4. **Explore the dashboard** - Access http://localhost:3000
5. **Read the docs** - See [PRODUCTION.md](PRODUCTION.md) for deployment

---

## 🆘 Need Help?

- **Documentation**: See [README.md](README.md)
- **Issues**: https://github.com/CrashBytes/team-pulse/issues
- **Security**: See [SECURITY.md](SECURITY.md)
- **Contributing**: See [CONTRIBUTING.md](CONTRIBUTING.md)

---

**Installation complete!** 🎉

Ready to deploy to production? See [PRODUCTION.md](PRODUCTION.md)
