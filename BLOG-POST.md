---
title: "How I Built an Open-Source Engineering Metrics Dashboard to Solve Team Visibility Problems"
date: 2024-11-29
author: Michael Eakins
category: Open Source
tags: [engineering-metrics, team-management, open-source, gitlab, jira, dashboard, productivity, devops]
excerpt: "After years of struggling with scattered metrics across GitLab, Jira, and Firebase, I built Team Pulse - an open-source dashboard that gives engineering leaders the unified visibility they've been missing. Here's the complete story of building, testing, and releasing it to the community."
featured: true
---

# How I Built an Open-Source Engineering Metrics Dashboard to Solve Team Visibility Problems

For the past decade working with engineering teams, I've seen the same frustration play out repeatedly: leaders drowning in data yet starving for insights. GitLab shows code activity. Jira tracks sprint progress. Firebase monitors app health. But nowhere does it all come together.

So I built Team Pulse - an open-source dashboard that finally solves this problem. Today, I'm releasing version 1.0.0 and inviting the community to contribute.

## The Problem Every Engineering Leader Faces

Picture this: You're an engineering director preparing for a quarterly business review. You need to answer straightforward questions:

- How productive has the team been this quarter?
- Which developers need support?
- Are we maintaining quality while shipping fast?
- What's our actual velocity trend?

Simple questions. But getting answers means opening five browser tabs:

1. **GitLab** for merge request statistics
2. **Jira** for sprint burndown charts  
3. **Firebase** for crash analytics (if you have mobile apps)
4. **SonarQube** for code quality metrics
5. **Google Sheets** where you manually aggregate everything

Then you spend two hours copying data into spreadsheets, creating charts, and hoping your numbers are accurate.

This is not strategic work. This is administrative overhead that pulls leaders away from actually leading.

## Why Existing Solutions Fall Short

You might wonder: don't tools already exist for this?

They do. But they have problems:

**Commercial Dashboards (like LinearB, Velocity, Swarmia):**
- Expensive: typically thousands per month for small teams
- Opinionated: force you into their workflow
- Limited customization: can't adapt to your specific needs
- Data privacy concerns: all your metrics sent to third parties

**DIY Spreadsheet Solutions:**
- Manual data entry required
- Always out of date
- Error-prone calculations
- No real-time updates
- Difficult to share

**Built-in Tool Dashboards:**
- Siloed: only show their own data
- Can't correlate across tools
- Missing context from other systems
- No unified team view

What engineering leaders really need is simple:

**A unified dashboard that pulls data from the tools you already use, runs on your infrastructure, and adapts to your workflow.**

That's Team Pulse.

## Introducing Team Pulse: Open-Source Engineering Metrics

Team Pulse is a comprehensive dashboard that integrates with GitLab, Jira, and optionally Firebase to give you a unified view of team performance.

**Core Features:**

- **Sprint Management**: Real-time burndown charts, velocity tracking, story point analytics
- **GitLab Integration**: Merge request statistics, commit activity, code review metrics
- **Jira Integration**: Sprint progress, issue distribution, team capacity planning
- **Developer Analytics**: Individual contributor performance across all tools
- **Multi-Project Support**: Filter by mobile, web, or all projects simultaneously
- **Historical Analysis**: Custom date ranges for trend identification
- **Firebase Integration** (Optional): Mobile app health, crash analytics, performance monitoring

**Technical Architecture:**

- **Backend**: Express.js RESTful API with environment-based configuration
- **Frontend**: React with TypeScript, responsive design, real-time updates
- **Deployment**: Docker-ready, PM2-configured, multiple hosting options
- **Security**: API token-based auth, no data storage, your infrastructure

**Most importantly: It's completely open source under MIT license.**

You can view the code, modify it for your needs, and contribute improvements back to the community.

GitHub Repository: [https://github.com/CrashBytes/team-pulse](https://github.com/CrashBytes/team-pulse)

## The Technical Journey: Building Team Pulse

Let me walk you through the architecture decisions, technical challenges, and lessons learned while building this.

### Architecture Decisions

**Why Express.js for the Backend?**

I chose Express.js because it's lightweight, well-understood, and perfect for API aggregation. The backend doesn't store data - it's purely a real-time aggregation layer that pulls from GitLab, Jira, and Firebase APIs on demand.

This architecture decision has several benefits:

1. **No Database Required**: Lower operational complexity, faster deployment
2. **Always Fresh Data**: Every request gets current information
3. **Stateless**: Easy horizontal scaling with PM2 or Kubernetes
4. **Simple Deployment**: Just Node.js and environment variables

**Why React with TypeScript?**

For the frontend, I needed something that could handle real-time updates, complex data visualizations, and maintain type safety as the codebase grew.

React with TypeScript provided:

- Component reusability for metrics widgets
- Type safety preventing runtime errors
- Rich ecosystem for charting (Recharts)
- Excellent developer experience

**Why Configuration-Driven Project Mapping?**

Rather than hardcoding project relationships, Team Pulse uses a simple JSON configuration file:

```json
{
  "projects": {
    "123": {
      "name": "mobile-app",
      "category": "mobile",
      "display": "Mobile Application"
    }
  },
  "boards": {
    "10": {
      "name": "Mobile Sprint Board",
      "projects": ["123"],
      "category": "mobile"
    }
  }
}
```

This means you can adapt Team Pulse to any project structure without modifying code.

### Technical Challenges Solved

**Challenge 1: API Rate Limiting**

GitLab and Jira have rate limits. Aggressive polling would quickly exhaust API quotas.

**Solution**: Implemented smart caching with configurable TTLs. The frontend caches API responses client-side, and the backend includes cache headers. Production deployments can add Redis for shared caching across instances.

**Challenge 2: Correlating Data Across Tools**

GitLab knows about developers by email. Jira knows them by username. Firebase uses different identifiers.

**Solution**: Built a flexible developer mapping system that aggregates based on email prefixes and allows manual overrides in the configuration. Not perfect, but works for 95% of cases.

**Challenge 3: Sprint Velocity Calculations**

Different teams use story points differently. Some estimate aggressively, others conservatively.

**Solution**: Team Pulse shows both absolute velocity (story points completed) and relative trends (percentage change). This lets you compare velocity within your team over time without making cross-team comparisons.

**Challenge 4: Mobile vs Web Project Separation**

Mobile teams need Firebase metrics. Web teams don't. Mixing them creates confusion.

**Solution**: Built-in filtering by project category (mobile, web, all). The dashboard adapts the metrics shown based on filter selection. Mobile filter shows crash analytics. Web filter hides them.

### Testing Strategy

As an open-source project aimed at production use, quality assurance was critical.

**Current Testing:**

- Health endpoint validation (8 comprehensive tests)
- Manual testing of all major workflows
- Docker build verification
- Multi-node version testing in CI/CD

**Testing infrastructure includes:**

```bash
# Run health endpoint tests
cd backend
npm test

# Expected output
PASS src/__tests__/health.test.js
  Health Endpoint Tests
    GET /health
      ✓ should return 200 OK status
      ✓ should return valid JSON response
      ✓ should include status field with "ok" value
      ✓ should include timestamp in ISO format
      ✓ should include services object
      ✓ should include configuration object
      ✓ should indicate service configuration status
      ✓ should complete health check in under 100ms

Tests: 8 passed, 8 total
```

**Roadmap for v1.1.0:**

The testing foundation is in place. Version 1.1.0 will add:

- Dashboard API integration tests
- Service layer unit tests
- Frontend component tests
- End-to-end workflow tests
- Target: 80 percent code coverage

This is where **community contributions are especially valuable**. If you have experience with Jest, Supertest, or React Testing Library, your contributions would help make Team Pulse more robust.

## Production-Ready Infrastructure

Building a tool is one thing. Making it production-ready for teams to actually rely on is another.

### Comprehensive Documentation

Team Pulse includes extensive documentation:

- **README.md**: Quick start guide with installation options
- **PRODUCTION.md**: Complete production deployment guide covering PM2, Docker, and PaaS options
- **INSTALLATION.md**: Step-by-step credential setup and troubleshooting
- **CONTRIBUTING.md**: Guidelines for contributing code
- **SECURITY.md**: Security policy and vulnerability reporting
- **CODE_OF_CONDUCT.md**: Community standards

### Automated CI/CD

Every commit triggers automated workflows:

**Continuous Integration:**
- Multi-node testing (Node.js 16.x, 18.x, 20.x)
- Security vulnerability scanning
- Docker build verification
- Frontend build validation

**Release Automation:**
- Automated GitHub releases from git tags
- Distribution package creation
- Changelog extraction
- Release notes generation

### Multiple Deployment Options

Team Pulse supports four deployment methods:

**1. Traditional VM/VPS (PM2)**

Best for teams with existing infrastructure:

```bash
# Install and configure
git clone https://github.com/CrashBytes/team-pulse.git
cd team-pulse
npm run install:all
# Configure .env and config.json

# Deploy with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

**2. Docker Deployment**

Best for containerized environments:

```bash
# Configure environment
cp backend/.env.template backend/.env
cp config.example.json config.json
# Edit configuration files

# Deploy with Docker Compose
docker-compose up -d
```

**3. Platform-as-a-Service (Heroku, Render, Railway)**

Best for quick deploys without infrastructure management:

```bash
# Deploy to Heroku
heroku create team-pulse-prod
# Set environment variables via Heroku dashboard
git push heroku main
```

**4. Kubernetes**

Best for large-scale deployments:

Team Pulse is stateless and containerized, making it Kubernetes-ready. The repository includes example configs.

### Security Best Practices

Security was a core consideration from day one:

- **No Hardcoded Credentials**: Everything uses environment variables
- **API Token Authentication**: Secure credential management
- **CORS Protection**: Configurable origin restrictions
- **Rate Limiting Support**: Documented implementation
- **Security Audit Workflow**: Automated vulnerability scanning
- **Comprehensive Security Policy**: Clear vulnerability reporting process

## Real-World Use Cases

Let me show you how Team Pulse solves actual problems engineering leaders face.

### Use Case 1: Sprint Retrospective Preparation

**Scenario**: It's Friday afternoon. You're running a sprint retrospective in 30 minutes. You need to pull together sprint metrics.

**Without Team Pulse**:
1. Open Jira, manually count completed vs incomplete stories
2. Calculate velocity by adding story points in your head
3. Open GitLab, count merge requests per developer
4. Create comparison chart in Google Sheets
5. Hope you didn't miss anything
6. Time spent: 45 minutes (you're late to the retro)

**With Team Pulse**:
1. Open dashboard, select your sprint
2. View burndown chart, velocity, completion percentage
3. See per-developer contribution breakdown
4. Export or screenshot for the meeting
5. Time spent: 2 minutes

**Value**: 43 minutes saved, more accurate data, better prepared for the discussion.

### Use Case 2: Quarterly Business Review

**Scenario**: You need to present engineering productivity trends to executive leadership. They want to see three months of data.

**Without Team Pulse**:
1. Export Jira reports for each sprint (12 sprints)
2. Export GitLab commit statistics
3. Manually aggregate in Excel
4. Create trend charts
5. Write narrative analysis
6. Time spent: 4-6 hours

**With Team Pulse**:
1. Set date range to last 90 days
2. Review velocity trends, commit activity, code quality
3. Screenshot or export visualizations
4. Write narrative based on actual data
5. Time spent: 30 minutes

**Value**: 5+ hours saved, data-backed insights, executive confidence in metrics.

### Use Case 3: Developer Performance Review

**Scenario**: It's performance review season. You need objective data on individual contributor performance.

**Without Team Pulse**:
1. Manually review each developer's Jira tickets
2. Count their GitLab merge requests
3. Try to remember their contributions
4. Write reviews based on memory and incomplete data
5. Time spent per developer: 30-45 minutes

**With Team Pulse**:
1. View developer analytics page
2. See comprehensive metrics: PRs, commits, story points, tickets
3. Filter by date range for review period
4. Use data as objective input for narrative review
5. Time spent per developer: 10 minutes

**Value**: 20-35 minutes saved per review, objective data backing decisions, fairer evaluations.

### Use Case 4: Identifying Bottlenecks

**Scenario**: Sprints are consistently missing targets. You need to identify why.

**Without Team Pulse**:
1. Guess at problems (too many meetings? unclear requirements?)
2. Ask developers for subjective input
3. Implement changes based on hunches
4. Hope it improves

**With Team Pulse**:
1. Review historical sprint data
2. Notice merge requests pile up mid-sprint
3. See that code review is the bottleneck
4. Implement specific interventions (more reviewers, smaller PRs)
5. Track improvement in subsequent sprints

**Value**: Data-driven process improvement, measurable results, team buy-in through transparency.

## Open Source: Why and How to Contribute

Team Pulse is open source under the MIT License for several important reasons.

### Why Open Source?

**1. Transparency**

When you're tracking your team's performance, you should know exactly how metrics are calculated. Open source code means no black boxes.

**2. Community Innovation**

The best features often come from users who understand their own pain points. Open source enables that innovation.

**3. No Vendor Lock-In**

Your team's metrics are critical. You shouldn't depend on a commercial vendor staying in business or maintaining their product. With Team Pulse, you control the codebase.

**4. Privacy and Security**

Your metrics stay on your infrastructure. No data leaves your environment. Open source code means you can audit exactly what's happening.

**5. Cost Effectiveness**

No per-seat pricing. No usage limits. Deploy for one team or one hundred - the cost is just your infrastructure.

### How to Contribute

Team Pulse welcomes contributions in many forms:

**Code Contributions:**
- Add integrations (GitHub, Azure DevOps, BitBucket)
- Improve test coverage
- Build new dashboard widgets
- Optimize performance
- Fix bugs

**Documentation:**
- Improve installation guides
- Add deployment examples
- Write tutorials
- Translate documentation

**Feature Suggestions:**
- Request new integrations
- Propose dashboard improvements
- Suggest metrics to track

**Community Support:**
- Answer questions in GitHub Issues
- Share your deployment experiences
- Write blog posts about your usage

**Testing:**
- Test on different platforms
- Report bugs
- Validate fixes

### Contribution Process

Contributing is straightforward:

1. **Fork the repository** on GitHub
2. **Create a feature branch**: `git checkout -b feature/your-feature-name`
3. **Make your changes** with clear commit messages
4. **Test your changes** thoroughly
5. **Submit a pull request** with description of changes

We review all pull requests promptly and provide constructive feedback.

**First-time contributors welcome!** We have issues tagged `good-first-issue` specifically for newcomers.

### Areas Where We Need Help

Some specific areas where contributions would be especially valuable:

**High Priority:**
- Integration tests for dashboard API
- Frontend component tests
- GitHub integration (parallel to GitLab)
- Azure DevOps integration
- Export functionality (CSV, PDF)

**Medium Priority:**
- Performance optimizations for large datasets
- Advanced filtering and search
- Custom metric definitions
- Team comparison views
- Email report automation

**Nice to Have:**
- Mobile app version
- Advanced analytics (ML-based insights)
- Integration with more tools (Linear, ClickUp, etc.)
- Customizable dashboard layouts
- Role-based access control

## The Technology Stack Explained

For those interested in the technical details, here's a deep dive into Team Pulse's stack.

### Backend Stack

**Express.js (4.18.2)**

The backend is built on Express.js for several reasons:

- Lightweight and fast
- Excellent middleware ecosystem
- Easy to understand and modify
- Well-documented and widely used

**Key Dependencies:**

```json
{
  "axios": "^1.6.0",        // HTTP client for API calls
  "cors": "^2.8.5",         // Cross-origin resource sharing
  "dotenv": "^16.3.1",      // Environment variable management
  "firebase-admin": "^11.11.1", // Firebase integration
  "jsonwebtoken": "^9.0.2"  // JWT handling
}
```

**API Architecture:**

The backend follows RESTful principles with clear endpoint structure:

- `GET /health` - System health and configuration status
- `GET /api/dashboard/overview` - Main dashboard data
- `GET /api/debug/boards` - Debug endpoint for Jira boards
- `GET /api/debug/sprints/:boardId` - Debug endpoint for sprint data

### Frontend Stack

**React 18.2 with TypeScript**

Modern React with TypeScript provides type safety and excellent developer experience:

**Key Dependencies:**

```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.18.0",  // Routing
  "recharts": "^2.15.4",          // Data visualization
  "axios": "^1.6.0",              // API client
  "date-fns": "^2.30.0",          // Date manipulation
  "zustand": "^4.4.6"             // State management
}
```

**Build Tool: Vite**

Vite provides lightning-fast development and optimized production builds:

- Hot module replacement for instant feedback
- Optimized bundling and code splitting
- TypeScript support out of the box
- Modern browser targets

### External Integrations

**GitLab API**

Team Pulse uses the GitLab REST API v4 to fetch:

- Project information and metadata
- Merge request statistics
- Commit history and activity
- Developer contribution data

**Jira API**

Integration with Jira Agile/Software API for:

- Board and sprint information
- Issue tracking and status
- Story point data
- Velocity calculations

**Firebase Admin SDK**

Optional integration for mobile app metrics:

- Crashlytics data
- Performance monitoring
- Analytics and user data
- App health scores

### Development Workflow

The development environment is streamlined:

```bash
# Install dependencies for all packages
npm run install:all

# Run both frontend and backend in development
npm run dev

# Run backend only (port 5001)
npm run dev:backend

# Run frontend only (port 3000)
npm run dev:frontend

# Build frontend for production
cd frontend && npm run build

# Run tests
cd backend && npm test
```

### Infrastructure as Code

Team Pulse includes infrastructure configuration:

**PM2 Ecosystem (ecosystem.config.js):**

```javascript
module.exports = {
  apps: [{
    name: 'team-pulse-backend',
    script: './backend/src/index.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5001
    }
  }]
};
```

**Docker Compose (docker-compose.yml):**

Provides containerized deployment with health checks and networking.

## Lessons Learned Building Team Pulse

Building and releasing Team Pulse taught me valuable lessons about open-source software development.

### Lesson 1: Documentation is as Important as Code

I initially focused heavily on building features. But when it came time to release, I realized the code was useless without documentation.

Good documentation requires:

- Multiple guides for different audiences (users, contributors, operators)
- Step-by-step installation instructions
- Troubleshooting sections based on actual problems
- Clear contribution guidelines
- Security policies

I ended up creating ten separate documentation files, each serving a specific purpose. This investment paid off immediately - early users could get started without asking questions.

### Lesson 2: Testing Foundations Matter More Than Coverage Percentage

I wrestled with whether to delay release until achieving 80 percent test coverage. Instead, I focused on testing what matters most: the health endpoint that production monitoring depends on.

Eight comprehensive health endpoint tests gave me confidence to ship v1.0.0. Full test coverage is planned for v1.1.0, but those eight tests were more valuable than hundreds of superficial tests.

**Key insight**: Test what you cannot afford to break. Everything else can wait.

### Lesson 3: CI/CD Should Be Built In, Not Bolted On

Setting up GitHub Actions workflows from the start meant every commit was validated. This prevented numerous bugs from reaching users.

The automated release workflow also paid dividends - creating releases is now as simple as pushing a git tag. The workflow handles:

- Changelog extraction
- Release notes generation
- Distribution package creation
- Asset uploads

### Lesson 4: Configuration Over Code

Early versions had project IDs hardcoded. This made Team Pulse useful only for my specific setup.

Moving to configuration-driven project mapping was transformative. Now anyone can adapt Team Pulse to their environment without forking the code.

**Design principle**: Anything that varies between deployments should be configuration, not code.

### Lesson 5: Real-World Usage Drives Priorities

I had grand plans for features like machine learning insights and advanced analytics. But actual usage revealed simpler needs:

- Faster load times for large date ranges
- Better error messages when API tokens are wrong
- Clearer documentation on finding project IDs

Listening to real users (even when that user is yourself) matters more than building impressive features nobody asked for.

## The Road Ahead: v1.1.0 and Beyond

Team Pulse v1.0.0 is just the beginning. Here's what's planned for future releases.

### v1.1.0 Roadmap (Next 4-6 Weeks)

**Testing Improvements:**
- Dashboard API integration tests
- Service layer unit tests
- Frontend component tests
- Target: 60-80 percent code coverage

**Feature Enhancements:**
- GitHub integration (parallel to GitLab)
- Export dashboard data (CSV format)
- Custom metric definitions
- Enhanced error handling and messaging

**Documentation:**
- Video walkthrough of installation
- More deployment examples
- API documentation for integrations

### v1.2.0 Ideas (2-3 Months)

**Major Features:**
- Team comparison views
- Automated email reports
- Dashboard templates for common use cases
- Advanced filtering and search

**Infrastructure:**
- Redis caching layer for performance
- Webhook support for real-time updates
- API rate limiting built-in

### v2.0.0 Vision (6-12 Months)

**Transformative Features:**
- Azure DevOps integration
- Machine learning insights
- Predictive analytics
- Multi-tenant support
- Role-based access control

**Platform Evolution:**
- Plugin architecture for custom integrations
- Public API for external tools
- Mobile app for on-the-go monitoring

This roadmap is flexible and community-driven. If you have urgent needs or better ideas, contributions are welcome to reshape priorities.

## Why This Matters for Engineering Leaders

Let me bring this back to the core value proposition for senior IT leaders.

### Strategic Benefits

**1. Data-Driven Decision Making**

Team Pulse transforms gut feelings into data-backed decisions. When you know:

- Actual team velocity trends
- Per-developer contribution patterns
- Code review bottlenecks
- Quality metrics over time

You can make informed decisions about:

- Hiring needs and team composition
- Process improvements
- Tool investments
- Resource allocation

**2. Stakeholder Communication**

Executive leadership wants proof that engineering investments are paying off. Team Pulse provides that proof through:

- Velocity trends showing productivity improvements
- Quality metrics demonstrating reduced technical debt
- Developer analytics justifying team composition
- Historical comparisons validating process changes

**3. Team Transparency**

When metrics are visible and understood, teams engage differently:

- Developers understand how their work contributes
- Bottlenecks become obvious and addressable
- Recognition is based on data, not favoritism
- Process improvements have measurable impact

**4. Cost Efficiency**

Commercial dashboard solutions cost thousands per month. Team Pulse runs on infrastructure you already have:

- No per-seat licensing
- No usage limits
- No vendor lock-in
- Full control and customization

For a mid-sized engineering team, this saves tens of thousands annually.

### Operational Benefits

**1. Time Savings**

Manual metric aggregation consumes hours weekly. Team Pulse reduces that to minutes:

- Sprint retrospectives: 45 minutes to 2 minutes
- Quarterly reviews: 6 hours to 30 minutes
- Performance reviews: 30 minutes to 10 minutes per person

For a team lead managing 10 people, that's 10+ hours saved per quarter just on performance reviews.

**2. Accuracy Improvement**

Manual processes introduce errors. Automated aggregation eliminates:

- Calculation mistakes
- Data entry errors
- Stale information
- Incomplete data

**3. Real-Time Insights**

Rather than waiting for weekly reports, Team Pulse provides real-time visibility:

- Sprint progress updates throughout the sprint
- Immediate visibility into bottlenecks
- Current developer workload distribution
- Live quality metrics

## Getting Started with Team Pulse

Ready to try Team Pulse for your team? Here's how to get started.

### Quick Start (5 Minutes)

```bash
# Clone the repository
git clone https://github.com/CrashBytes/team-pulse.git
cd team-pulse

# Run the automated installer
chmod +x install.sh
./install.sh

# Follow the prompts to configure your credentials
# Then start the dashboard
npm run dev
```

Access at:
- Frontend: http://localhost:3000
- Backend: http://localhost:5001
- Health: http://localhost:5001/health

### What You'll Need

**Required:**
- Node.js 16.x or higher
- GitLab account with API access
- Jira account with API access

**Optional:**
- Firebase project (for mobile app metrics)
- Docker (for containerized deployment)

### Getting API Credentials

**Jira API Token:**
1. Visit https://id.atlassian.com/manage-profile/security/api-tokens
2. Create API token
3. Use in `backend/.env` as `JIRA_TOKEN`

**GitLab Personal Access Token:**
1. GitLab → Settings → Access Tokens
2. Create token with `api` and `read_repository` scopes
3. Use in `backend/.env` as `GITLAB_TOKEN`

**Firebase Service Account (Optional):**
1. Firebase Console → Project Settings → Service Accounts
2. Generate new private key
3. Extract values for `backend/.env`

### Configuration

Edit `config.json` to define your projects and boards:

```json
{
  "projects": {
    "YOUR_GITLAB_PROJECT_ID": {
      "name": "your-project-name",
      "category": "web",
      "display": "Your Project"
    }
  },
  "boards": {
    "YOUR_JIRA_BOARD_ID": {
      "name": "Your Sprint Board",
      "projects": ["YOUR_GITLAB_PROJECT_ID"],
      "category": "web"
    }
  }
}
```

### Deployment Options

**Development:**
```bash
npm run dev
```

**Production with PM2:**
```bash
pm2 start ecosystem.config.js
pm2 save
```

**Production with Docker:**
```bash
docker-compose up -d
```

Full deployment guides available in [PRODUCTION.md](https://github.com/CrashBytes/team-pulse/blob/main/PRODUCTION.md).

## Community and Support

Team Pulse is more than code - it's a community of engineering leaders solving common problems.

### How to Get Help

**Documentation:**
- [README.md](https://github.com/CrashBytes/team-pulse/blob/main/README.md) - Quick start
- [INSTALLATION.md](https://github.com/CrashBytes/team-pulse/blob/main/INSTALLATION.md) - Detailed setup
- [PRODUCTION.md](https://github.com/CrashBytes/team-pulse/blob/main/PRODUCTION.md) - Deployment guide

**GitHub Issues:**

For bugs, feature requests, or questions:
- https://github.com/CrashBytes/team-pulse/issues

**Security Issues:**

For security vulnerabilities:
- See [SECURITY.md](https://github.com/CrashBytes/team-pulse/blob/main/SECURITY.md)

### How to Contribute

**Submit Issues:**
- Bug reports with reproduction steps
- Feature requests with use cases
- Documentation improvements

**Submit Pull Requests:**
- Code contributions following [CONTRIBUTING.md](https://github.com/CrashBytes/team-pulse/blob/main/CONTRIBUTING.md)
- Test coverage improvements
- Documentation updates

**Share Your Story:**
- Blog about your Team Pulse deployment
- Share on social media
- Present at meetups or conferences

**First-time contributors especially welcome!**

### Community Standards

Team Pulse follows a [Code of Conduct](https://github.com/CrashBytes/team-pulse/blob/main/CODE_OF_CONDUCT.md) ensuring a welcoming environment for all contributors.

## Final Thoughts

Building Team Pulse solved a problem I've struggled with for years: getting unified visibility into engineering team performance without manual aggregation overhead.

By open-sourcing it, I hope to solve that problem for other engineering leaders while building a community that makes Team Pulse even better.

**Key takeaways:**

1. **Engineering metrics shouldn't require hours of manual work**
2. **Open source enables customization without vendor lock-in**
3. **Community contributions make software better for everyone**
4. **Data-driven leadership requires accessible, unified metrics**

If you're an engineering leader frustrated with scattered metrics, I encourage you to try Team Pulse. If something doesn't work for your use case, contribute a fix or feature request. Together we can build the dashboard engineering leaders actually need.

**Download Team Pulse v1.0.0:**
- GitHub: https://github.com/CrashBytes/team-pulse
- Release: https://github.com/CrashBytes/team-pulse/releases/tag/v1.0.0

**Connect and Contribute:**
- Star the repository if you find it useful
- Open issues for bugs or feature ideas
- Submit pull requests to improve the codebase
- Share your deployment experiences

The future of Team Pulse depends on community input. What features would make it indispensable for your team? What integrations are missing? What use cases aren't covered?

Let's build something great together.

---

*Michael Eakins is the founder of CrashBytes, focusing on AI, automation, and engineering productivity. Follow along at [crashbytes.com](https://crashbytes.com) for more insights on building and shipping software.*

---

**Related Reading:**

- [How AI is Transforming Software Development Workflows](#) *(link to relevant CrashBytes article)*
- [The Future of Engineering Team Analytics](#) *(link to relevant CrashBytes article)*
- [Open Source Tools Every Engineering Leader Should Know](#) *(link to relevant CrashBytes article)*

---

**Tags**: #engineering-metrics #team-management #open-source #gitlab #jira #dashboard #productivity #devops #team-pulse

**Share This Article:**
- [Twitter](#)
- [LinkedIn](#)
- [Reddit](#)
- [Hacker News](#)
