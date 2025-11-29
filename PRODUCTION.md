# Production Deployment Guide

This guide covers deploying Team Pulse to production environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Deployment Options](#deployment-options)
- [Environment Configuration](#environment-configuration)
- [Security Hardening](#security-hardening)
- [Monitoring and Logging](#monitoring-and-logging)
- [Backup and Recovery](#backup-and-recovery)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- Node.js 16.x or higher
- npm or yarn
- Valid API credentials for Jira and GitLab
- SSL certificate for HTTPS (production)
- Reverse proxy (nginx, Apache, or similar)
- Process manager (PM2 recommended)

## Deployment Options

### Option 1: Traditional VM/VPS Deployment

#### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install build tools
sudo apt-get install -y build-essential

# Install PM2 globally
sudo npm install -g pm2
```

#### 2. Application Deployment

```bash
# Clone repository
git clone https://github.com/CrashBytes/team-pulse.git
cd team-pulse

# Install dependencies
npm run install:all

# Configure environment
cp backend/.env.template backend/.env
cp config.example.json config.json

# Edit configuration files
nano backend/.env
nano config.json

# Build frontend
cd frontend && npm run build && cd ..

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### 3. PM2 Configuration

Create `ecosystem.config.js`:

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
    },
    error_file: './logs/backend-error.log',
    out_file: './logs/backend-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
};
```

### Option 2: Docker Deployment

#### 1. Build and Run

```bash
# Clone repository
git clone https://github.com/CrashBytes/team-pulse.git
cd team-pulse

# Configure environment
cp backend/.env.template backend/.env
cp config.example.json config.json

# Edit configuration
nano backend/.env
nano config.json

# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

#### 2. Production Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    restart: always
    ports:
      - "5001:5001"
    env_file:
      - ./backend/.env
    volumes:
      - ./config.json:/app/config.json:ro
      - ./logs:/app/logs
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - team-pulse-network

  frontend:
    build: ./frontend
    restart: always
    depends_on:
      - backend
    networks:
      - team-pulse-network

  nginx:
    image: nginx:alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
      - ./frontend/dist:/usr/share/nginx/html:ro
    depends_on:
      - backend
      - frontend
    networks:
      - team-pulse-network

networks:
  team-pulse-network:
    driver: bridge
```

### Option 3: Platform-as-a-Service (Heroku, Render, etc.)

#### Heroku Deployment

```bash
# Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login to Heroku
heroku login

# Create app
heroku create team-pulse-production

# Set environment variables
heroku config:set JIRA_HOST=https://your-company.atlassian.net
heroku config:set JIRA_EMAIL=your-email@company.com
heroku config:set JIRA_TOKEN=your-token
heroku config:set GITLAB_URL=https://gitlab.com
heroku config:set GITLAB_TOKEN=your-token

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

## Environment Configuration

### Production Environment Variables

```bash
# Backend (.env)
NODE_ENV=production
PORT=5001

# Jira Configuration
JIRA_HOST=https://your-company.atlassian.net
JIRA_EMAIL=your-email@company.com
JIRA_TOKEN=your-production-token

# GitLab Configuration
GITLAB_URL=https://gitlab.com
GITLAB_TOKEN=your-production-token

# Firebase (Optional)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
```

### Project Configuration (config.json)

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

## Security Hardening

### 1. SSL/TLS Configuration

```nginx
# nginx.conf
server {
    listen 443 ssl http2;
    server_name team-pulse.yourdomain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:5001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health {
        proxy_pass http://backend:5001/health;
    }
}
```

### 2. File Permissions

```bash
# Set secure permissions
chmod 600 backend/.env
chmod 600 config.json
chmod 700 logs/
```

### 3. Firewall Rules

```bash
# Allow only necessary ports
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

### 4. Rate Limiting

Add to `backend/src/index.js`:

```javascript
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use('/api/', apiLimiter);
```

## Monitoring and Logging

### 1. Application Monitoring

```bash
# PM2 monitoring
pm2 monit

# PM2 logs
pm2 logs team-pulse-backend

# PM2 dashboard (optional)
pm2 install pm2-server-monit
```

### 2. Health Check Endpoint

```bash
# Check application health
curl https://team-pulse.yourdomain.com/health

# Expected response:
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
    "projects": 5,
    "boards": 3
  }
}
```

### 3. Log Rotation

Create `/etc/logrotate.d/team-pulse`:

```
/path/to/team-pulse/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 nodejs nodejs
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

## Backup and Recovery

### Configuration Backup

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups/team-pulse"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup configuration
cp backend/.env $BACKUP_DIR/.env_$DATE
cp config.json $BACKUP_DIR/config_$DATE.json

# Create archive
tar -czf $BACKUP_DIR/team-pulse_backup_$DATE.tar.gz \
    backend/.env \
    config.json

# Keep only last 30 days of backups
find $BACKUP_DIR -name "team-pulse_backup_*.tar.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_DIR/team-pulse_backup_$DATE.tar.gz"
```

### Restore Process

```bash
# Extract backup
tar -xzf team-pulse_backup_YYYYMMDD_HHMMSS.tar.gz

# Restore configuration
cp .env backend/.env
cp config.json .

# Restart application
pm2 restart team-pulse-backend
```

## Troubleshooting

### Common Issues

#### 1. Application won't start

```bash
# Check logs
pm2 logs team-pulse-backend

# Verify environment variables
cat backend/.env | grep -v TOKEN

# Check configuration
cat config.json

# Test manually
cd backend && node src/index.js
```

#### 2. API errors

```bash
# Check health endpoint
curl http://localhost:5001/health

# Verify API credentials
# Jira
curl -u email:token https://your-company.atlassian.net/rest/api/3/myself

# GitLab
curl --header "Authorization: Bearer $GITLAB_TOKEN" \
     https://gitlab.com/api/v4/user
```

#### 3. High memory usage

```bash
# Check memory
pm2 list
pm2 monit

# Restart application
pm2 restart team-pulse-backend

# Increase memory limit if needed
pm2 restart team-pulse-backend --max-memory-restart 500M
```

#### 4. Slow response times

```bash
# Check system resources
htop

# Check logs for slow queries
grep "Fetching" logs/backend-out.log

# Optimize date ranges in queries
# Reduce maxResults in API calls
```

### Debug Mode

```bash
# Enable debug logging
export DEBUG=true
pm2 restart team-pulse-backend

# View debug endpoints
curl http://localhost:5001/api/debug/boards
curl http://localhost:5001/api/debug/sprints/BOARD_ID
```

## Performance Optimization

### 1. Caching

Add Redis for caching API responses:

```bash
npm install redis

# Add to backend/src/cache.js
const redis = require('redis');
const client = redis.createClient();

async function getCached(key) {
  return await client.get(key);
}

async function setCache(key, value, ttl = 300) {
  await client.setEx(key, ttl, JSON.stringify(value));
}
```

### 2. Database Indexing

If using PostgreSQL for analytics:

```sql
CREATE INDEX idx_sprint_date ON sprints(start_date, end_date);
CREATE INDEX idx_issue_assignee ON issues(assignee_id);
```

### 3. Frontend Optimization

```bash
# Build with production optimizations
cd frontend
npm run build

# Serve with gzip compression (nginx)
gzip on;
gzip_types text/plain text/css application/json application/javascript;
```

## Scaling

### Horizontal Scaling

```bash
# Run multiple backend instances
pm2 scale team-pulse-backend 4

# Or in ecosystem.config.js
instances: 'max' // Use all CPU cores
```

### Load Balancing (nginx)

```nginx
upstream backend {
    least_conn;
    server backend1:5001;
    server backend2:5001;
    server backend3:5001;
}

server {
    location /api {
        proxy_pass http://backend;
    }
}
```

## Updates and Maintenance

### Update Process

```bash
# Backup current version
./backup.sh

# Pull latest code
git pull origin main

# Install dependencies
npm run install:all

# Build frontend
cd frontend && npm run build && cd ..

# Restart application
pm2 restart team-pulse-backend

# Verify health
curl http://localhost:5001/health
```

### Scheduled Maintenance

```bash
# Add to crontab
0 2 * * 0 /path/to/team-pulse/maintenance.sh
```

## Support

For production issues:
- Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- Review logs: `pm2 logs`
- Open GitHub issue with logs and configuration (sanitized)
- Email: support@crashbytes.com

---

**Production deployment requires careful planning. Test thoroughly in staging first!**
