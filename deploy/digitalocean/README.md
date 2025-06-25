# TEL Cognitive Platform - DigitalOcean Deployment

This directory contains configuration files and scripts for deploying the TEL Cognitive Platform to DigitalOcean.

## Architecture

The deployment consists of:

1. **Main Application (simstudio)** - TEL Cognitive Platform on port 3000
2. **Deep Research Service** - Piren Deep Research on port 3001  
3. **Nginx Reverse Proxy** - Routes traffic and handles SSL
4. **Database** - Managed DigitalOcean PostgreSQL (recommended) or self-hosted

## Prerequisites

1. **DigitalOcean Droplet** (minimum 4GB RAM, 2 vCPUs recommended)
2. **Domain name** pointed to your droplet's IP
3. **Docker and Docker Compose** installed
4. **Environment variables** configured

## Quick Start

1. **Prepare Environment**
   ```bash
   cp ../../.env.deployment.template ../.env.deployment
   # Edit .env.deployment with your actual values
   ```

2. **Deploy**
   ```bash
   ./deploy.sh deploy
   ```

3. **Access your application**
   - Main app: `https://your-domain.com`
   - Deep Research: `https://your-domain.com/research`

## Configuration

### Environment Variables

Key variables to configure in `.env.deployment`:

```bash
# Domain and SSL
DOMAIN_NAME=your-domain.com
SSL_EMAIL=your-email@domain.com
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Database (use DigitalOcean Managed Database recommended)
DATABASE_URL=postgresql://username:password@host:port/database

# Authentication
BETTER_AUTH_SECRET=your-secure-32-char-secret
ENCRYPTION_KEY=your-secure-32-char-key

# AI Providers (at least one required)
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
GOOGLE_API_KEY=your-google-key

# Search Providers (for deep research)
TAVILY_API_KEY=your-tavily-key
FIRECRAWL_API_KEY=your-firecrawl-key
```

### DigitalOcean Managed Database

For production, use DigitalOcean's managed PostgreSQL:

1. Create a PostgreSQL cluster in DigitalOcean
2. Enable pgvector extension
3. Use the connection string in `DATABASE_URL`

### SSL Certificates

SSL certificates are automatically obtained via Let's Encrypt when you set:
- `DOMAIN_NAME` - your domain
- `SSL_EMAIL` - your email for certificate notifications

## Deployment Commands

```bash
# Full deployment (first time)
./deploy.sh deploy

# Update to latest images
./deploy.sh update

# View logs
./deploy.sh logs

# Check status
./deploy.sh status

# Restart services
./deploy.sh restart

# Stop services
./deploy.sh stop

# Clean up unused resources
./deploy.sh cleanup
```

## Monitoring

### Service Health Checks

Both services have health checks configured:
- Main app: `http://localhost:3000/health`
- Deep research: `http://localhost:3001`

### Logs

View logs in real-time:
```bash
docker-compose logs -f
```

View specific service logs:
```bash
docker-compose logs -f simstudio
docker-compose logs -f deep-research
```

## Scaling Considerations

### Resource Requirements

**Minimum (Development/Small Production)**
- 4GB RAM, 2 vCPUs
- 50GB SSD

**Recommended (Production)**
- 8GB RAM, 4 vCPUs  
- 100GB SSD
- DigitalOcean Managed Database

### Load Balancing

For high availability, consider:
1. Multiple droplets behind a DigitalOcean Load Balancer
2. DigitalOcean Managed Database with read replicas
3. Container Registry for image storage

## Security

### Firewall Configuration

The deployment script automatically configures UFW:
- Port 22 (SSH) - Open
- Port 80 (HTTP) - Open (redirects to HTTPS)
- Port 443 (HTTPS) - Open
- Application ports - Localhost only

### Additional Security

1. **Change default SSH port**
2. **Set up SSH key authentication**
3. **Configure fail2ban**
4. **Regular security updates**

## Backup

### Database Backup

If using managed database:
```bash
# DigitalOcean handles automated backups
```

If self-hosting:
```bash
# Backup
docker exec tel-postgres pg_dump -U postgres simstudio > backup.sql

# Restore
cat backup.sql | docker exec -i tel-postgres psql -U postgres -d simstudio
```

### Application Data

```bash
# Backup volumes
docker run --rm -v tel-agents-studio_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz -C /data .
```

## Troubleshooting

### Common Issues

1. **Service not starting**
   ```bash
   docker-compose logs [service-name]
   ```

2. **SSL certificate issues**
   ```bash
   # Check certificate
   docker-compose run --rm certbot certificates
   
   # Manual renewal
   docker-compose run --rm certbot renew
   ```

3. **Database connection issues**
   ```bash
   # Test database connection
   docker exec tel-postgres pg_isready -U postgres
   ```

### Performance Issues

1. **Check resource usage**
   ```bash
   docker stats
   ```

2. **Monitor application logs**
   ```bash
   docker-compose logs -f --tail=100
   ```

## Updates

### Application Updates

```bash
# Pull latest images and restart
./deploy.sh update
```

### System Updates

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Docker
sudo apt install docker-ce docker-ce-cli containerd.io

# Update Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

## Support

For issues and questions:
1. Check the logs first
2. Review environment variable configuration
3. Ensure all required API keys are set
4. Check DigitalOcean droplet resources

## Architecture Diagram

```
Internet
    ↓
DigitalOcean Load Balancer (optional)
    ↓
Nginx Reverse Proxy (:80, :443)
    ↓
┌─────────────────────────────────────┐
│ TEL Cognitive Platform (:3000)      │
│ ├─ Next.js App                      │
│ ├─ Authentication                   │
│ ├─ Knowledge Base                   │
│ └─ Workflow Management              │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ Deep Research Service (:3001)       │
│ ├─ AI Providers Integration         │
│ ├─ Search Providers                 │
│ ├─ Research Processing              │
│ └─ Knowledge Graph Generation       │
└─────────────────────────────────────┘
    ↓
DigitalOcean Managed PostgreSQL
```