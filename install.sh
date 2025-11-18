#!/bin/bash

# Team Performance Dashboard - Installation Script
# This script sets up the dashboard with your configuration

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "\n${BLUE}================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Main installation
main() {
    print_header "Team Performance Dashboard - Installation"
    
    # Check prerequisites
    print_info "Checking prerequisites..."
    
    if ! command_exists node; then
        print_error "Node.js is not installed. Please install Node.js 16.x or higher"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 16 ]; then
        print_error "Node.js version must be 16.x or higher (current: $(node -v))"
        exit 1
    fi
    print_success "Node.js $(node -v) found"
    
    if ! command_exists npm; then
        print_error "npm is not installed"
        exit 1
    fi
    print_success "npm $(npm -v) found"
    
    # Install dependencies
    print_header "Installing Dependencies"
    print_info "This may take a few minutes..."
    
    if npm run install:all; then
        print_success "Dependencies installed successfully"
    else
        print_error "Failed to install dependencies"
        exit 1
    fi
    
    # Setup configuration
    print_header "Configuration Setup"
    
    # Setup .env file
    if [ ! -f backend/.env ]; then
        print_info "Creating backend/.env file..."
        cp backend/.env.template backend/.env
        print_success "Created backend/.env from template"
        print_warning "You need to edit backend/.env with your credentials"
    else
        print_warning "backend/.env already exists, skipping..."
    fi
    
    # Setup config.json
    if [ ! -f config.json ]; then
        print_info "Creating config.json file..."
        cp config.example.json config.json
        print_success "Created config.json from template"
        print_warning "You need to edit config.json with your project and board IDs"
    else
        print_warning "config.json already exists, skipping..."
    fi
    
    # Interactive configuration (optional)
    print_header "Interactive Configuration (Optional)"
    echo "Would you like to configure your credentials now? (y/n)"
    read -r CONFIGURE_NOW
    
    if [ "$CONFIGURE_NOW" = "y" ] || [ "$CONFIGURE_NOW" = "Y" ]; then
        configure_env
    else
        print_info "Skipping interactive configuration"
        print_warning "Remember to edit backend/.env and config.json before running"
    fi
    
    # Summary
    print_header "Installation Complete!"
    echo ""
    echo "Next steps:"
    echo ""
    echo "1. Configure your credentials:"
    echo "   ${BLUE}nano backend/.env${NC}"
    echo ""
    echo "2. Configure your projects and boards:"
    echo "   ${BLUE}nano config.json${NC}"
    echo ""
    echo "3. Start the development server:"
    echo "   ${BLUE}npm run dev${NC}"
    echo ""
    echo "4. Open your browser:"
    echo "   Frontend: ${GREEN}http://localhost:3000${NC}"
    echo "   Backend:  ${GREEN}http://localhost:5001${NC}"
    echo ""
    echo "For help, see README.md or visit the documentation"
    echo ""
}

# Interactive environment configuration
configure_env() {
    print_info "Configuring environment variables..."
    
    # Jira Configuration
    echo ""
    echo "=== Jira Configuration ==="
    echo -n "Jira Host (e.g., https://your-company.atlassian.net): "
    read -r JIRA_HOST
    
    echo -n "Jira Email: "
    read -r JIRA_EMAIL
    
    echo -n "Jira API Token: "
    read -r JIRA_TOKEN
    
    # GitLab Configuration
    echo ""
    echo "=== GitLab Configuration ==="
    echo -n "GitLab URL (e.g., https://gitlab.com): "
    read -r GITLAB_URL
    
    echo -n "GitLab Token: "
    read -r GITLAB_TOKEN
    
    # Firebase Configuration
    echo ""
    echo "=== Firebase Configuration (Optional - press Enter to skip) ==="
    echo -n "Firebase Project ID (or press Enter to skip): "
    read -r FIREBASE_PROJECT_ID
    
    if [ -n "$FIREBASE_PROJECT_ID" ]; then
        echo -n "Firebase Private Key: "
        read -r FIREBASE_PRIVATE_KEY
        
        echo -n "Firebase Client Email: "
        read -r FIREBASE_CLIENT_EMAIL
    fi
    
    # Server Configuration
    echo ""
    echo "=== Server Configuration ==="
    echo -n "Backend Port (default: 5001): "
    read -r PORT
    PORT=${PORT:-5001}
    
    # Write to .env file
    print_info "Writing configuration to backend/.env..."
    
    cat > backend/.env << EOF
# Jira Configuration
JIRA_HOST=${JIRA_HOST}
JIRA_EMAIL=${JIRA_EMAIL}
JIRA_TOKEN=${JIRA_TOKEN}

# GitLab Configuration
GITLAB_URL=${GITLAB_URL}
GITLAB_TOKEN=${GITLAB_TOKEN}

# Firebase Configuration (Optional)
FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID}
FIREBASE_PRIVATE_KEY=${FIREBASE_PRIVATE_KEY}
FIREBASE_CLIENT_EMAIL=${FIREBASE_CLIENT_EMAIL}

# Server Configuration
PORT=${PORT}
EOF
    
    print_success "Configuration saved to backend/.env"
    print_warning "Don't forget to configure your projects and boards in config.json!"
}

# Run main function
main
