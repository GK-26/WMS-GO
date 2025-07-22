#!/bin/bash

# WMS Environment Setup Script
# This script helps manage environment variables for different deployment scenarios

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Function to check if .env file exists
check_env_file() {
    if [ ! -f ".env" ]; then
        print_error ".env file not found!"
        print_status "Creating .env file from env.example..."
        cp env.example .env
        print_status ".env file created successfully!"
    else
        print_status ".env file already exists"
    fi
}

# Function to generate secure JWT secret
generate_jwt_secret() {
    local secret=$(openssl rand -base64 64)
    echo "$secret"
}

# Function to setup development environment
setup_dev() {
    print_header "Setting up Development Environment"
    
    check_env_file
    
    # Generate secure JWT secret if not already set
    if grep -q "JWT_SECRET=your-super-secret-jwt-key-change-in-production" .env; then
        print_status "Generating secure JWT secret..."
        local jwt_secret=$(generate_jwt_secret)
        sed -i "s/JWT_SECRET=your-super-secret-jwt-key-change-in-production/JWT_SECRET=$jwt_secret/" .env
        print_status "JWT secret updated!"
    fi
    
    # Set development-specific values
    sed -i 's/ENV=production/ENV=development/' .env
    sed -i 's/LOG_LEVEL=info/LOG_LEVEL=debug/' .env
    sed -i 's/DEBUG=false/DEBUG=true/' .env
    
    print_status "Development environment configured!"
}

# Function to setup production environment
setup_prod() {
    print_header "Setting up Production Environment"
    
    check_env_file
    
    # Generate secure JWT secret
    print_status "Generating secure JWT secret..."
    local jwt_secret=$(generate_jwt_secret)
    sed -i "s/JWT_SECRET=.*/JWT_SECRET=$jwt_secret/" .env
    
    # Set production-specific values
    sed -i 's/ENV=development/ENV=production/' .env
    sed -i 's/LOG_LEVEL=debug/LOG_LEVEL=info/' .env
    sed -i 's/DEBUG=true/DEBUG=false/' .env
    
    print_warning "Please update the following in your .env file:"
    echo "  - MONGODB_URI (production database)"
    echo "  - SMTP credentials for email notifications"
    echo "  - ALLOWED_ORIGINS (production domains)"
    echo "  - Any external service credentials"
    
    print_status "Production environment configured!"
}

# Function to setup Docker environment
setup_docker() {
    print_header "Setting up Docker Environment"
    
    check_env_file
    
    # Update MongoDB URI for Docker
    sed -i 's/MONGODB_URI=mongodb:\/\/localhost:27017/MONGODB_URI=mongodb:\/\/mongodb:27017/' .env
    
    print_status "Docker environment configured!"
}

# Function to validate environment
validate_env() {
    print_header "Validating Environment Configuration"
    
    if [ ! -f ".env" ]; then
        print_error ".env file not found!"
        exit 1
    fi
    
    # Check required variables
    local required_vars=("MONGODB_URI" "MONGODB_DATABASE" "JWT_SECRET" "PORT")
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "^${var}=" .env; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -eq 0 ]; then
        print_status "All required environment variables are set!"
    else
        print_error "Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        exit 1
    fi
    
    # Check for default values that should be changed
    local warnings=()
    
    if grep -q "JWT_SECRET=your-super-secret-jwt-key-change-in-production" .env; then
        warnings+=("JWT_SECRET should be changed from default")
    fi
    
    if grep -q "SMTP_USERNAME=your-email@gmail.com" .env; then
        warnings+=("SMTP_USERNAME should be configured for email notifications")
    fi
    
    if [ ${#warnings[@]} -gt 0 ]; then
        print_warning "Configuration warnings:"
        for warning in "${warnings[@]}"; do
            echo "  - $warning"
        done
    fi
}

# Function to show current environment
show_env() {
    print_header "Current Environment Configuration"
    
    if [ ! -f ".env" ]; then
        print_error ".env file not found!"
        exit 1
    fi
    
    echo "Environment Variables:"
    echo "====================="
    
    # Show non-sensitive variables
    grep -E "^(PORT|ENV|MONGODB_DATABASE|LOG_LEVEL|DEBUG|WS_ENABLED|HEALTH_CHECK_ENABLED)=" .env | sort
    
    echo ""
    echo "Sensitive Variables (values hidden):"
    echo "===================================="
    
    # Show sensitive variables with hidden values
    grep -E "^(MONGODB_URI|JWT_SECRET|SMTP_|AWS_)" .env | sed 's/=.*/=***HIDDEN***/' | sort
}

# Function to show help
show_help() {
    print_header "WMS Environment Setup Script"
    
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  dev      - Setup development environment"
    echo "  prod     - Setup production environment"
    echo "  docker   - Setup Docker environment"
    echo "  validate - Validate current environment configuration"
    echo "  show     - Show current environment variables"
    echo "  help     - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 dev      # Setup for development"
    echo "  $0 prod     # Setup for production"
    echo "  $0 validate # Validate configuration"
}

# Main script logic
case "${1:-help}" in
    dev)
        setup_dev
        ;;
    prod)
        setup_prod
        ;;
    docker)
        setup_docker
        ;;
    validate)
        validate_env
        ;;
    show)
        show_env
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac 