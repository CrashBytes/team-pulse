# Team Performance Dashboard

A comprehensive dashboard for visualizing team performance metrics from GitLab, Jira, and optionally Firebase. Built to help engineering teams track velocity, code quality, and individual contributions.

## Features

- **Sprint Management**: Track sprint progress, burndown charts, and story points
- **GitLab Integration**: Monitor merge requests, commits, and code activity
- **Jira Integration**: View sprint metrics, issue tracking, and team velocity
- **Firebase Integration** (Optional): Mobile app health metrics, crash analytics, and performance monitoring
- **Developer Analytics**: Individual contributor metrics and performance tracking
- **Code Quality Metrics**: Track test coverage, bugs, and vulnerabilities
- **Flexible Filtering**: Filter by project type (mobile, web, or all)
- **Date Range Analysis**: Historical data analysis across custom time periods

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Backend   │────▶│   GitLab    │
│   (React)   │     │  (Express)  │     │     API     │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ├────────────▶┌─────────────┐
                           │             │    Jira     │
                           │             │     API     │
                           │             └─────────────┘
                           │
                           └────────────▶┌─────────────┐
                                         │  Firebase   │
                                         │   (Optional)│
                                         └─────────────┘
```

## Prerequisites

- Node.js 16.x or higher
- npm or yarn
- GitLab account with API access
- Jira account with API access
- Firebase project (optional, for mobile app metrics)
- Git

## Quick Start

### Option 1: Automated Installation (Recommended)

```bash
# Clone the repository
git clone <your-repo-url>
cd medashboard

# Run the installation script
chmod +x install.sh
./install.sh
```

The installation script will:
1. Install all dependencies
2. Guide you through configuration
3. Set up your project and board definitions
4. Create environment files

### Option 2: Manual Installation

```bash
# Install dependencies
npm run install:all

# Copy environment template
cp backend/.env.template backend/.env

# Copy configuration template
cp config.example.json config.json

# Edit configuration files (see Configuration section below)
nano backend/.env
nano config.json

# Start the application
npm run dev
```

## Configuration

### 1. Environment Variables (`backend/.env`)

```bash
# Jira Configuration
JIRA_HOST=https://your-company.atlassian.net
JIRA_EMAIL=your-email@company.com
JIRA_TOKEN=your-jira-api-token

# GitLab Configuration
GITLAB_URL=https://gitlab.com  # or your self-hosted GitLab URL
GITLAB_TOKEN=your-gitlab-token

# Firebase Configuration (Optional - for mobile app metrics)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# Server Configuration
PORT=5001
```

### 2. Project Configuration (`config.json`)

Define your projects and boards:

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

### How to Get Configuration Values

#### Jira Setup
1. **JIRA_TOKEN**: 
   - Go to https://id.atlassian.com/manage-profile/security/api-tokens
   - Click "Create API token"
   - Copy the generated token

2. **Board IDs**:
   - Navigate to your Jira board
   - Look at the URL: `https://your-company.atlassian.net/jira/software/c/projects/PROJ/boards/123`
   - The number after `/boards/` is your board ID

#### GitLab Setup
1. **GITLAB_TOKEN**:
   - Go to GitLab → Settings → Access Tokens
   - Create a token with `api` and `read_repository` scopes
   - Copy the generated token

2. **Project IDs**:
   - Go to your GitLab project
   - Settings → General → Project ID

#### Firebase Setup (Optional)
1. Go to Firebase Console → Project Settings → Service Accounts
2. Generate new private key
3. Copy the `project_id`, `private_key`, and `client_email` from the downloaded JSON

## Running the Application

### Development Mode

```bash
# Run both frontend and backend
npm run dev

# Run backend only
npm run dev:backend

# Run frontend only
npm run dev:frontend
```

- Frontend: http://localhost:3000
- Backend: http://localhost:5001

### Production Mode

```bash
# Build frontend
cd frontend && npm run build

# Start backend
cd backend && npm start
```

## Docker Deployment (Optional)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Project Structure

```
medashboard/
├── backend/
│   ├── src/
│   │   ├── index.js          # Main server file
│   │   ├── services/         # External service integrations
│   │   └── routes/           # API routes
│   ├── .env                  # Environment variables (create from .env.template)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/            # Page components
│   │   ├── App.tsx           # Main app component
│   │   └── main.tsx          # Entry point
│   └── package.json
├── config.json               # Project and board definitions (create from config.example.json)
├── docker-compose.yml        # Docker configuration
├── install.sh                # Installation script
└── README.md                 # This file
```

## API Endpoints

### Dashboard Data
```
GET /api/dashboard/overview
Query Parameters:
  - sprintId: (optional) Specific sprint ID
  - filter: (optional) 'mobile', 'web', or 'all' (default)
  - startDate: (optional) ISO date string
  - endDate: (optional) ISO date string
```

### Health Check
```
GET /health
Returns system health status
```

### Debug Endpoints
```
GET /api/debug/boards
GET /api/debug/sprints/:boardId
```

## Features by Category

### Sprint Management
- Active sprint tracking
- Burndown charts
- Story point velocity
- Issue completion rates

### GitLab Metrics
- Merge request statistics
- Commit activity
- Code review metrics
- Project-level insights

### Jira Metrics
- Sprint progress
- Issue distribution
- Team velocity trends
- Individual contribution tracking

### Firebase Metrics (Mobile Apps Only)
- Crash-free rate
- App performance metrics
- Active user analytics
- Mobile-specific health scores

## Filtering and Date Ranges

The dashboard supports flexible filtering:

- **Project Type Filter**: View metrics for mobile, web, or all projects
- **Sprint Selection**: Focus on specific sprints
- **Date Range Analysis**: Analyze metrics across custom time periods
- **GitLab date filtering**: Historical code activity analysis

## Customization

### Adding New Project Categories

Edit `config.json` and add projects with custom categories:

```json
{
  "projects": {
    "789": {
      "name": "backend-api",
      "category": "backend",
      "display": "Backend API"
    }
  }
}
```

Update the backend to handle new categories in the filtering logic.

### Extending Metrics

1. Add new service integrations in `backend/src/services/`
2. Update the dashboard endpoint in `backend/src/index.js`
3. Create new frontend components in `frontend/src/components/`

## Troubleshooting

### Common Issues

1. **"Firebase service error"**
   - Firebase is optional. This error can be safely ignored if you're not using Firebase.
   - Ensure your Firebase credentials are correct if you need mobile app metrics.

2. **"Failed to fetch dashboard data"**
   - Check that JIRA_TOKEN and GITLAB_TOKEN are valid
   - Verify board IDs and project IDs in config.json
   - Check backend logs for specific errors

3. **No sprints showing**
   - Verify board IDs are correct
   - Ensure boards have active or future sprints
   - Check Jira permissions for your API token

4. **CORS errors**
   - Ensure frontend and backend ports match configuration
   - Check CORS settings in `backend/src/index.js`

### Debug Mode

Enable detailed logging:

```bash
# In backend/.env
DEBUG=true
```

View debug endpoints:
- http://localhost:5001/api/debug/boards
- http://localhost:5001/api/debug/sprints/BOARD_ID

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Security Notes

- Never commit `.env` files
- Keep API tokens secure
- Use environment variables for all sensitive data
- Review and limit API token permissions

## License

MIT License - feel free to use this in your own projects

## Support

For issues and questions:
- Create an issue in the repository
- Check existing issues for solutions
- Review the troubleshooting section

## Roadmap

- [ ] Add more integrations (GitHub, Azure DevOps)
- [ ] Export dashboard data
- [ ] Custom metric definitions
- [ ] Team comparison views
- [ ] Automated reports
- [ ] Dashboard templates

---

**Made with ❤️ for engineering teams**
