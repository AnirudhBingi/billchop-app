#!/bin/bash

# Vibecode iOS App - Git Sync Automation Script
# This script automates pushing changes to both Vibecode and GitHub

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to check if there are changes to commit
has_changes() {
    if [[ -n $(git status --porcelain) ]]; then
        return 0  # Has changes
    else
        return 1  # No changes
    fi
}

# Function to commit changes
commit_changes() {
    local commit_message="$1"
    if [[ -z "$commit_message" ]]; then
        commit_message="Auto-sync: $(date '+%Y-%m-%d %H:%M:%S')"
    fi
    
    print_status "Committing changes..."
    git add .
    git commit -m "$commit_message"
    print_success "Changes committed successfully"
}

# Function to push to Vibecode remote
push_to_vibecode() {
    print_status "Pushing to Vibecode remote..."
    if git push origin main; then
        print_success "Successfully pushed to Vibecode"
    else
        print_error "Failed to push to Vibecode"
        return 1
    fi
}

# Function to push to GitHub (if configured)
push_to_github() {
    if git remote get-url github >/dev/null 2>&1; then
        print_status "Pushing to GitHub..."
        if git push github main; then
            print_success "Successfully pushed to GitHub"
        else
            print_warning "Failed to push to GitHub (continuing with Vibecode sync)"
        fi
    else
        print_warning "GitHub remote not configured - skipping GitHub push"
    fi
}

# Function to pull latest changes
pull_latest() {
    print_status "Pulling latest changes..."
    if git pull origin main; then
        print_success "Successfully pulled latest changes"
    else
        print_warning "Failed to pull changes (continuing anyway)"
    fi
}

# Main sync function
sync_changes() {
    local commit_message="$1"
    
    print_status "Starting sync process..."
    
    # Check if we're in a git repository
    if [[ ! -d .git ]]; then
        print_error "Not in a git repository. Please initialize git first."
        exit 1
    fi
    
    # Pull latest changes first
    pull_latest
    
    # Check if there are changes to commit
    if has_changes; then
        print_status "Changes detected, committing..."
        commit_changes "$commit_message"
        
        # Push to Vibecode
        if push_to_vibecode; then
            # Push to GitHub if configured
            push_to_github
            print_success "Sync completed successfully!"
        else
            print_error "Sync failed at Vibecode push"
            exit 1
        fi
    else
        print_success "No changes to sync - everything is up to date"
    fi
}

# Function to setup GitHub remote
setup_github() {
    local github_url="$1"
    
    if [[ -z "$github_url" ]]; then
        print_error "Please provide GitHub repository URL"
        echo "Usage: $0 setup-github <github-repo-url>"
        echo "Example: $0 setup-github https://github.com/username/repo.git"
        exit 1
    fi
    
    print_status "Setting up GitHub remote..."
    
    # Remove existing github remote if it exists
    if git remote get-url github >/dev/null 2>&1; then
        git remote remove github
    fi
    
    # Add new github remote
    git remote add github "$github_url"
    print_success "GitHub remote added successfully"
    
    # Test the connection
    print_status "Testing GitHub connection..."
    if git ls-remote github >/dev/null 2>&1; then
        print_success "GitHub connection successful"
    else
        print_error "Failed to connect to GitHub. Please check your URL and permissions."
        exit 1
    fi
}

# Function to show status
show_status() {
    print_status "Current git status:"
    echo ""
    git status --short
    echo ""
    
    print_status "Remote repositories:"
    git remote -v
    echo ""
    
    print_status "Recent commits:"
    git log --oneline -5
}

# Main script logic
case "${1:-sync}" in
    "sync")
        sync_changes "$2"
        ;;
    "setup-github")
        setup_github "$2"
        ;;
    "status")
        show_status
        ;;
    "pull")
        pull_latest
        ;;
    "help"|"-h"|"--help")
        echo "Vibecode iOS App - Git Sync Automation"
        echo ""
        echo "Usage:"
        echo "  $0 [command] [options]"
        echo ""
        echo "Commands:"
        echo "  sync [message]     - Sync changes to Vibecode and GitHub"
        echo "  setup-github <url> - Add GitHub remote repository"
        echo "  status             - Show current git status"
        echo "  pull               - Pull latest changes"
        echo "  help               - Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0 sync                           # Auto-sync with default message"
        echo "  $0 sync 'Added new feature'       # Sync with custom message"
        echo "  $0 setup-github https://github.com/user/repo.git"
        ;;
    *)
        print_error "Unknown command: $1"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac 