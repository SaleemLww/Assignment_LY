# Docker Deployment Guide
## Teacher Timetable Extraction System

This guide covers Docker deployment for both **development** and **production** environments.

---

## 📦 What's Included

### Docker Files
- `backend/Dockerfile` - Production backend image (multi-stage build)
- `backend/Dockerfile.dev` - Development backend with hot reload
- `frontend/Dockerfile` - Production frontend with Nginx
- `frontend/Dockerfile.dev` - Development frontend with Vite dev server
- `docker-compose.yml` - Production orchestration
- `docker-compose.dev.yml` - Development orchestration

### Services
- **PostgreSQL 15** - Database
- **Redis 7** - Cache & job queue
- **Backend API** - Express.js + TypeScript (Port 5001)
- **Frontend** - React + Vite (Port 3000)

---

## 🚀 Quick Start

### Production Deployment

```bash
# 1. Copy environment template
cp .env.docker.example .env.docker

# 2. Edit .env.docker with your API keys
nano .env.docker

# 3. Build and start all services
docker-compose up -d

# 4. View logs
docker-compose logs -f

# 5. Check status
docker-compose ps

# 6. Access application
# Frontend: http://localhost:3000
# Backend API: http://localhost:5001
# API Docs: http://localhost:5001/api-docs
```

### Development Environment

```bash
# 1. Set environment variables
export OPENAI_API_KEY="your-key"
export GOOGLE_API_KEY="your-key"

# 2. Start development services
docker-compose -f docker-compose.dev.yml up

# 3. Access with hot reload
# Frontend: http://localhost:3000 (auto-reloads on code changes)
# Backend: http://localhost:5001 (nodemon auto-restart)
```

---

## 📋 Prerequisites

### Required
- Docker Engine 20.10+
- Docker Compose 2.0+
- 4GB RAM minimum
- 10GB disk space

### API Keys Required
- OpenAI API key (required)
- Google API key (optional, for enhanced OCR)
- Anthropic API key (optional, for Claude fallback)

---

## 🔧 Configuration

### Environment Variables

Create `.env.docker` file (or use system environment variables):

```bash
# Database
DB_USERNAME=postgres
DB_PASSWORD=your_secure_password
DB_NAME=timetable_db
DB_PORT=5432

# Redis
REDIS_PORT=6379
REDIS_PASSWORD=optional_redis_password

# Application Ports
BACKEND_PORT=5001
FRONTEND_PORT=3000

# AI API Keys
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=...
ANTHROPIC_API_KEY=...

# LangSmith (Optional)
LANGSMITH_API_KEY=...
LANGSMITH_TRACING=true
LANGSMITH_PROJECT=timetable-production
```

### Using .env.docker File

```bash
# Load from file
docker-compose --env-file .env.docker up -d
```

### Port Customization

Change ports in `.env.docker`:
```bash
BACKEND_PORT=8001
FRONTEND_PORT=8000
DB_PORT=5433
REDIS_PORT=6380
```

---

## 🏗️ Build Commands

### Production Build

```bash
# Build all images
docker-compose build

# Build specific service
docker-compose build backend
docker-compose build frontend

# Build without cache
docker-compose build --no-cache

# Build with progress
docker-compose build --progress=plain
```

### Development Build

```bash
# Build dev images
docker-compose -f docker-compose.dev.yml build
```

---

## 🎯 Management Commands

### Start Services

```bash
# Start all services in background
docker-compose up -d

# Start specific service
docker-compose up -d backend

# Start with rebuild
docker-compose up -d --build

# Start and follow logs
docker-compose up
```

### Stop Services

```bash
# Stop all services
docker-compose stop

# Stop specific service
docker-compose stop backend

# Stop and remove containers
docker-compose down

# Stop and remove containers + volumes
docker-compose down -v
```

### View Logs

```bash
# All services
docker-compose logs

# Specific service
docker-compose logs backend
docker-compose logs frontend

# Follow logs (real-time)
docker-compose logs -f

# Last 100 lines
docker-compose logs --tail=100

# Logs since timestamp
docker-compose logs --since 2024-10-23T10:00:00
```

### Service Status

```bash
# Check running services
docker-compose ps

# Detailed service info
docker-compose ps -a

# Service health
docker inspect --format='{{.State.Health.Status}}' timetable-backend
```

### Execute Commands in Containers

```bash
# Backend shell
docker-compose exec backend sh

# Run Prisma migrations
docker-compose exec backend npx prisma migrate deploy

# Check backend logs
docker-compose exec backend cat logs/app.log

# Frontend shell
docker-compose exec frontend sh

# Database shell
docker-compose exec postgres psql -U postgres -d timetable_db

# Redis CLI
docker-compose exec redis redis-cli
```

---

## 🗄️ Database Management

### Migrations

```bash
# Run migrations (production)
docker-compose exec backend npx prisma migrate deploy

# Create new migration (development)
docker-compose exec backend npx prisma migrate dev --name your_migration_name

# Reset database (⚠️ destructive)
docker-compose exec backend npx prisma migrate reset

# Generate Prisma Client
docker-compose exec backend npx prisma generate
```

### Database Backup

```bash
# Backup database
docker-compose exec postgres pg_dump -U postgres timetable_db > backup.sql

# Restore database
docker-compose exec -T postgres psql -U postgres -d timetable_db < backup.sql
```

### Database Access

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres -d timetable_db

# View tables
docker-compose exec postgres psql -U postgres -d timetable_db -c "\dt"

# Run query
docker-compose exec postgres psql -U postgres -d timetable_db -c "SELECT * FROM teachers LIMIT 5;"
```

---

## 📊 Monitoring & Health Checks

### Health Check Endpoints

```bash
# Backend health
curl http://localhost:5001/health

# Frontend health
curl http://localhost:3000/health

# Container health status
docker ps --format "table {{.Names}}\t{{.Status}}"
```

### Resource Usage

```bash
# Container stats (real-time)
docker stats

# Specific container
docker stats timetable-backend

# Disk usage
docker system df

# Detailed disk usage
docker system df -v
```

### Logs Analysis

```bash
# Error logs only
docker-compose logs | grep -i error

# Warning logs
docker-compose logs | grep -i warn

# Last 1 hour
docker-compose logs --since 1h

# Export logs
docker-compose logs > application.log
```

---

## 🔒 Production Best Practices

### Security

1. **Change Default Passwords**
```bash
DB_PASSWORD=strong_random_password_here
REDIS_PASSWORD=another_strong_password
```

2. **Use Secrets Management**
```bash
# Use Docker secrets or environment variables
# Never commit .env.docker to version control
echo ".env.docker" >> .gitignore
```

3. **Limit Container Resources**
```yaml
# Add to docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### Performance

1. **Enable BuildKit**
```bash
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1
```

2. **Multi-stage Builds**
   - Already implemented in Dockerfiles
   - Reduces image size by ~60%

3. **Volume Optimization**
```bash
# Use named volumes for better performance
volumes:
  - uploads_data:/app/uploads
  - logs_data:/app/logs
```

### Reliability

1. **Restart Policies**
```yaml
# Already configured
restart: unless-stopped
```

2. **Health Checks**
   - Configured for all services
   - 30s interval, 3 retries

3. **Graceful Shutdown**
   - Using `dumb-init` for signal handling
   - Proper SIGTERM handling

---

## 🧹 Maintenance

### Clean Up

```bash
# Remove stopped containers
docker-compose down

# Remove volumes (⚠️ data loss)
docker-compose down -v

# Remove unused images
docker image prune

# Remove all unused Docker objects
docker system prune -a

# Remove specific image
docker rmi timetable-backend:latest
```

### Update Images

```bash
# Pull latest base images
docker-compose pull

# Rebuild with latest
docker-compose build --pull

# Update and restart
docker-compose up -d --build
```

### Backup Strategy

```bash
# Backup volumes
docker run --rm \
  -v timetable_postgres_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/postgres-backup.tar.gz /data

# Backup uploads
tar czf uploads-backup.tar.gz backend/uploads/
```

---

## 🐛 Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs backend

# Check events
docker events --since 10m

# Inspect container
docker inspect timetable-backend

# Check resource limits
docker stats timetable-backend
```

### Database Connection Issues

```bash
# Test database connectivity
docker-compose exec backend node -e "const {PrismaClient} = require('@prisma/client'); const prisma = new PrismaClient(); prisma.\$connect().then(() => console.log('Connected')).catch(console.error);"

# Check database logs
docker-compose logs postgres

# Verify DATABASE_URL
docker-compose exec backend printenv DATABASE_URL
```

### Redis Connection Issues

```bash
# Test Redis
docker-compose exec redis redis-cli ping

# Check Redis logs
docker-compose logs redis

# Test from backend
docker-compose exec backend node -e "const Redis = require('ioredis'); const redis = new Redis({host: 'redis'}); redis.ping().then(console.log);"
```

### Port Already in Use

```bash
# Find process using port
lsof -i :5001
lsof -i :3000

# Kill process
kill -9 <PID>

# Or change port in .env.docker
BACKEND_PORT=5002
FRONTEND_PORT=3001
```

### Out of Disk Space

```bash
# Check space
df -h

# Clean Docker
docker system prune -a --volumes

# Remove old logs
docker-compose exec backend sh -c "rm -rf logs/*.log"
```

### Performance Issues

```bash
# Check resource usage
docker stats

# Increase resources in Docker Desktop
# Settings → Resources → Advanced
# Increase CPUs and Memory

# Check container limits
docker inspect timetable-backend | grep -A 10 Resources
```

---

## 📈 Scaling

### Horizontal Scaling

```bash
# Scale backend workers
docker-compose up -d --scale backend=3

# Load balancer needed for multiple frontends
# Add nginx or traefik as reverse proxy
```

### Vertical Scaling

```yaml
# Increase container resources
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '4.0'
          memory: 4G
```

---

## 🚀 CI/CD Integration

### GitHub Actions Example

```yaml
name: Docker Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build images
        run: docker-compose build
      
      - name: Run tests
        run: docker-compose run backend npm test
      
      - name: Deploy
        run: docker-compose up -d
```

---

## 📚 Additional Resources

### Documentation
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Prisma in Docker](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-docker)

### Image Sizes
- Backend (production): ~250MB
- Frontend (production): ~50MB (with Nginx)
- PostgreSQL: ~230MB
- Redis: ~40MB

### Network Diagram
```
┌──────────────┐
│   Frontend   │ :3000
│   (Nginx)    │
└──────┬───────┘
       │
       ├─────────────────────┐
       │                     │
┌──────▼───────┐      ┌──────▼──────┐
│   Backend    │      │  PostgreSQL │
│   (Node.js)  │ :5001│  (Database) │ :5432
└──────┬───────┘      └─────────────┘
       │
┌──────▼───────┐
│    Redis     │
│   (Queue)    │ :6379
└──────────────┘
```

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] All containers running: `docker-compose ps`
- [ ] Health checks passing: `docker ps`
- [ ] Frontend accessible: http://localhost:3000
- [ ] Backend API accessible: http://localhost:5001/health
- [ ] API docs accessible: http://localhost:5001/api-docs
- [ ] Database connected: Check backend logs
- [ ] Redis connected: Check backend logs
- [ ] File upload works: Test through frontend
- [ ] AI processing works: Upload a timetable image

---

**Last Updated:** October 23, 2025  
**Docker Version:** 20.10+  
**Docker Compose Version:** 2.0+  
**Maintainer:** Saleem Ahmad (saleem.ahmad@rediffmail.com)
