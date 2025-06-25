#!/bin/bash

# ========================================
# TEL Cognitive Platform - DigitalOcean Deployment Script
# ========================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOCKER_REGISTRY="ghcr.io"
REPOSITORY_NAME="your-org/tel-agents-studio"
COMPOSE_FILE="docker-compose.yml"
ENV_FILE="../.env.deployment"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_requirements() {
    log_info "Checking requirements..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if environment file exists
    if [[ ! -f "$ENV_FILE" ]]; then
        log_error "Environment file not found: $ENV_FILE"
        log_info "Please copy .env.deployment.template to .env.deployment and fill in your values"
        exit 1
    fi
    
    log_success "All requirements met"
}

setup_firewall() {
    log_info "Setting up firewall rules..."
    
    # Allow SSH, HTTP, and HTTPS
    sudo ufw allow 22/tcp
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    
    # Allow application ports (only from localhost for security)
    sudo ufw allow from 127.0.0.1 to any port 3000
    sudo ufw allow from 127.0.0.1 to any port 3001
    
    # Enable firewall
    sudo ufw --force enable
    
    log_success "Firewall configured"
}

create_directories() {
    log_info "Creating necessary directories..."
    
    mkdir -p ssl
    mkdir -p nginx
    mkdir -p logs
    
    log_success "Directories created"
}

pull_images() {
    log_info "Pulling Docker images..."
    
    # Pull the latest images from registry
    docker pull ${DOCKER_REGISTRY}/${REPOSITORY_NAME}/simstudio:latest || log_warning "Could not pull simstudio image"
    docker pull ${DOCKER_REGISTRY}/${REPOSITORY_NAME}/deep-research:latest || log_warning "Could not pull deep-research image"
    
    log_success "Images pulled"
}

deploy_services() {
    log_info "Deploying services..."
    
    # Load environment variables
    export $(cat $ENV_FILE | xargs)
    
    # Deploy with Docker Compose
    docker-compose -f $COMPOSE_FILE up -d
    
    log_success "Services deployed"
}

setup_ssl() {
    log_info "Setting up SSL certificates..."
    
    if [[ -z "$DOMAIN_NAME" ]]; then
        log_warning "DOMAIN_NAME not set, skipping SSL setup"
        return
    fi
    
    if [[ -z "$SSL_EMAIL" ]]; then
        log_warning "SSL_EMAIL not set, skipping SSL setup"
        return
    fi
    
    # Request SSL certificate
    docker-compose -f $COMPOSE_FILE run --rm certbot
    
    # Set up auto-renewal
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/docker-compose -f $(pwd)/$COMPOSE_FILE run --rm certbot renew --quiet") | crontab -
    
    log_success "SSL certificates configured"
}

check_health() {
    log_info "Checking service health..."
    
    # Wait for services to start
    sleep 30
    
    # Check main app
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        log_success "Main application is healthy"
    else
        log_error "Main application health check failed"
    fi
    
    # Check deep research service
    if curl -f http://localhost:3001 > /dev/null 2>&1; then
        log_success "Deep research service is healthy"
    else
        log_error "Deep research service health check failed"
    fi
}

show_status() {
    log_info "Service Status:"
    docker-compose -f $COMPOSE_FILE ps
    
    log_info "Access your application at:"
    if [[ -n "$DOMAIN_NAME" ]]; then
        echo "  https://$DOMAIN_NAME"
    else
        echo "  http://$(curl -s http://checkip.amazonaws.com)"
    fi
}

cleanup() {
    log_info "Cleaning up old Docker resources..."
    
    # Remove unused images
    docker image prune -af
    
    # Remove unused volumes
    docker volume prune -f
    
    log_success "Cleanup completed"
}

main() {
    log_info "Starting TEL Cognitive Platform deployment..."
    
    check_requirements
    create_directories
    setup_firewall
    pull_images
    deploy_services
    setup_ssl
    check_health
    show_status
    cleanup
    
    log_success "Deployment completed successfully!"
    log_info "Monitor logs with: docker-compose -f $COMPOSE_FILE logs -f"
}

# Handle arguments
case "${1:-}" in
    "deploy")
        main
        ;;
    "update")
        log_info "Updating services..."
        pull_images
        docker-compose -f $COMPOSE_FILE up -d
        check_health
        log_success "Update completed"
        ;;
    "stop")
        log_info "Stopping services..."
        docker-compose -f $COMPOSE_FILE down
        log_success "Services stopped"
        ;;
    "restart")
        log_info "Restarting services..."
        docker-compose -f $COMPOSE_FILE restart
        check_health
        log_success "Services restarted"
        ;;
    "logs")
        docker-compose -f $COMPOSE_FILE logs -f
        ;;
    "status")
        show_status
        ;;
    "cleanup")
        cleanup
        ;;
    *)
        echo "Usage: $0 {deploy|update|stop|restart|logs|status|cleanup}"
        echo ""
        echo "Commands:"
        echo "  deploy   - Full deployment (first time setup)"
        echo "  update   - Update services to latest images"
        echo "  stop     - Stop all services"
        echo "  restart  - Restart all services"
        echo "  logs     - Show live logs"
        echo "  status   - Show service status"
        echo "  cleanup  - Clean up unused Docker resources"
        exit 1
        ;;
esac