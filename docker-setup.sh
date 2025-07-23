#!/bin/bash

# Docker Setup Script for React Redux Thunk Example
# This script handles Docker installation, build, and container management

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        echo "Visit: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_success "Docker and Docker Compose are installed"
}

# Build Docker images
build_images() {
    print_status "Building Docker images..."
    
    # Build production image
    print_status "Building production image..."
    docker build -t react-redux-app:latest .
    
    # Build development image
    print_status "Building development image..."
    docker build -f Dockerfile.dev -t react-redux-app:dev .
    
    print_success "Docker images built successfully"
}

# Start services with docker-compose
start_services() {
    print_status "Starting services with docker-compose..."
    docker-compose up -d
    print_success "Services started successfully"
    
    print_status "Services running:"
    docker-compose ps
}

# Stop services
stop_services() {
    print_status "Stopping services..."
    docker-compose down
    print_success "Services stopped successfully"
}

# Restart services
restart_services() {
    print_status "Restarting services..."
    docker-compose down
    docker-compose up -d
    print_success "Services restarted successfully"
}

# View logs
view_logs() {
    local service=${1:-""}
    if [ -z "$service" ]; then
        print_status "Showing logs for all services..."
        docker-compose logs -f
    else
        print_status "Showing logs for service: $service"
        docker-compose logs -f "$service"
    fi
}

# Clean up Docker resources
cleanup() {
    print_status "Cleaning up Docker resources..."
    
    # Stop and remove containers
    docker-compose down --remove-orphans
    
    # Remove images
    docker rmi react-redux-app:latest react-redux-app:dev 2>/dev/null || true
    
    # Clean up unused Docker resources
    docker system prune -f
    
    print_success "Cleanup completed"
}

# Development mode
dev_mode() {
    print_status "Starting in development mode..."
    docker-compose -f docker-compose.yml up -d
    print_success "Development environment started"
    
    print_status "Application will be available at:"
    echo "  - Frontend: http://localhost:3000"
    echo "  - Hot reload enabled for development"
}

# Production mode
prod_mode() {
    print_status "Starting in production mode..."
    docker build -t react-redux-app:latest .
    docker run -d -p 80:80 --name react-redux-app-prod react-redux-app:latest
    print_success "Production environment started"
    
    print_status "Application available at: http://localhost"
}

# Show help
show_help() {
    echo "Docker Setup Script for React Redux Thunk Example"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  check        Check if Docker is installed"
    echo "  build        Build Docker images"
    echo "  start        Start services with docker-compose"
    echo "  stop         Stop services"
    echo "  restart      Restart services"
    echo "  logs [svc]   View logs (optionally for specific service)"
    echo "  dev          Start in development mode"
    echo "  prod         Start in production mode"
    echo "  cleanup      Clean up Docker resources"
    echo "  help         Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 dev       # Start development environment"
    echo "  $0 logs      # View all logs"
    echo "  $0 logs app  # View logs for 'app' service"
}

# Main script logic
main() {
    case "${1:-help}" in
        "check")
            check_docker
            ;;
        "build")
            check_docker
            build_images
            ;;
        "start")
            check_docker
            start_services
            ;;
        "stop")
            stop_services
            ;;
        "restart")
            check_docker
            restart_services
            ;;
        "logs")
            view_logs "$2"
            ;;
        "dev")
            check_docker
            dev_mode
            ;;
        "prod")
            check_docker
            prod_mode
            ;;
        "cleanup")
            cleanup
            ;;
        "help"|*)
            show_help
            ;;
    esac
}

# Run main function with all arguments
main "$@"