# Changelog

All notable changes to Team Pulse will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-11-29

### Added
- Initial production release of Team Pulse
- GitLab integration for code metrics and merge request tracking
- Jira integration for sprint management and issue tracking
- Optional Firebase integration for mobile app health metrics
- Developer performance analytics with comprehensive metrics
- Sprint burndown charts and velocity tracking
- Flexible filtering by project type (mobile, web, all)
- Historical data analysis with custom date ranges
- Real-time dashboard with responsive React frontend
- RESTful API backend built with Express.js
- Docker deployment support with docker-compose
- Health check endpoint for monitoring
- Debug endpoints for troubleshooting
- Configuration-driven project and board management
- Automated installation script
- Comprehensive documentation and setup guides

### Features
- **Sprint Management**: Track active sprints, burndown charts, story points
- **GitLab Metrics**: Monitor merge requests, commits, code activity
- **Jira Metrics**: Sprint progress, issue tracking, team velocity
- **Firebase Metrics** (Optional): Mobile app crash analytics, performance monitoring
- **Developer Analytics**: Individual contributor performance tracking
- **Code Quality**: SonarQube-style metrics integration
- **Multi-Project Support**: Filter and analyze by project category
- **Historical Analysis**: Custom date range reporting

### Infrastructure
- Express.js backend with CORS support
- React + TypeScript frontend with Vite
- Firebase Admin SDK integration
- Axios-based API clients
- Environment-based configuration
- Docker containerization
- Health monitoring endpoints

### Known Limitations
- No automated test suite (manual testing recommended)
- Test coverage planned for v1.1.0
- See TESTING-STATUS.md for details

### Documentation
- Comprehensive README with quick start guide
- Installation script with interactive setup
- Configuration templates and examples
- Troubleshooting guide
- API endpoint documentation
- Architecture diagrams

## [Unreleased]

### Planned
- GitHub integration support
- Azure DevOps integration
- Export dashboard data to CSV/PDF
- Custom metric definitions
- Team comparison views
- Automated email reports
- Dashboard templates and presets
- Advanced filtering and search
- Performance optimizations
- Mobile app version

---

## Version History

### Version Numbering
Team Pulse follows semantic versioning (MAJOR.MINOR.PATCH):
- **MAJOR**: Breaking changes to API or configuration
- **MINOR**: New features, backward compatible
- **PATCH**: Bug fixes, backward compatible

### Migration Notes
For breaking changes and migration guides, see [UPGRADING.md](UPGRADING.md).

### Support
- **Current Version**: 1.0.0
- **Minimum Node.js**: 16.x
- **Minimum npm**: 8.x

---

[1.0.0]: https://github.com/CrashBytes/team-pulse/releases/tag/v1.0.0
