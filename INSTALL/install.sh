#!/bin/bash

#############################################################################
# ExchangeKit - Automated Installation Script
# Version: 1.0.0
# Target: Ubuntu 24.04 LTS
# Description: One-click installation with Docker containerization
#############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALL_LOG="${SCRIPT_DIR}/installation.log"
DEPLOYMENT_DIR="/opt/exchangekit"

# Source utility scripts
source "${SCRIPT_DIR}/utils/translations.sh"
source "${SCRIPT_DIR}/utils/messages.sh"
source "${SCRIPT_DIR}/utils/helpers.sh"
source "${SCRIPT_DIR}/utils/validators.sh"

# Log function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "${INSTALL_LOG}"
}

# Error handler
error_exit() {
    echo -e "${RED}ERROR: $1${NC}" >&2
    log "ERROR: $1"
    exit 1
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error_exit "$(t 'must_run_as_root')"
    fi
}

# Main installation function
main() {
    # Select language first
    select_language
    
    clear
    show_banner
    
    log "=== $(t 'starting_installation') ==="
    
    # Phase 1: Prerequisites check
    print_phase "$(t 'phase1')"
    
    # Update package repositories
    log "$(t 'updating_packages')"
    apt-get update -qq || log "Warning: apt update had some errors, continuing anyway..."
    
    bash "${SCRIPT_DIR}/scripts/check-prerequisites.sh" || error_exit "$(t 'prerequisites_failed')"
    
    # Phase 2: Interactive configuration
    print_phase "$(t 'phase2')"
    bash "${SCRIPT_DIR}/scripts/configure.sh" || error_exit "$(t 'configuration_failed')"
    
    # Load configuration
    if [[ -f "${SCRIPT_DIR}/.install.conf" ]]; then
        source "${SCRIPT_DIR}/.install.conf"
    else
        error_exit "Configuration file not found"
    fi
    
    # Phase 3: System preparation
    print_phase "$(t 'phase3')"
    bash "${SCRIPT_DIR}/scripts/setup-docker.sh" || error_exit "$(t 'docker_setup_failed')"
    
    # Phase 4: Application deployment
    print_phase "$(t 'phase4')"
    deploy_application
    
    # Phase 5: SSL certificate setup (SKIPPED - run enable-ssl.sh after installation)
    # SSL will be configured separately to avoid installation failures
    # To enable HTTPS: cd /root/INSTALL && bash enable-ssl.sh
    
    # Phase 6: Database initialization
    print_phase "$(t 'phase5')"
    bash "${SCRIPT_DIR}/scripts/setup-database.sh" || error_exit "$(t 'database_setup_failed')"
    
    # Phase 7: License activation
    print_phase "$(t 'phase6')"
    activate_license
    
    # Phase 7: Admin account creation
    print_phase "$(t 'phase7')"
    bash "${SCRIPT_DIR}/scripts/setup-admin.sh" "${ADMIN_EMAIL}" "${ADMIN_PASSWORD}" || error_exit "$(t 'admin_setup_failed')"
    
    # Phase 8: Health check
    print_phase "$(t 'phase8')"
    bash "${SCRIPT_DIR}/scripts/health-check.sh" "${DOMAIN}" || error_exit "Health check failed"
    
    # Installation complete
    show_completion
    
    # Phase 9: SSL Setup (Optional)
    echo ""
    echo -e "${YELLOW}========================================${NC}"
    echo -e "${YELLOW}  Optional: SSL Certificate Setup${NC}"
    echo -e "${YELLOW}========================================${NC}"
    echo ""
    echo "Your site is currently running on HTTP (port 80)."
    echo "Would you like to set up HTTPS with a free SSL certificate from Let's Encrypt?"
    echo ""
    echo "Requirements:"
    echo "  - Domain ${DOMAIN} must point to this server's IP"
    echo "  - Port 80 must be accessible from the internet"
    echo ""
    read -p "Setup SSL now? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        print_phase "Phase 9: SSL Certificate Configuration"
        bash "${SCRIPT_DIR}/scripts/setup-ssl.sh" "${DOMAIN}" "${ADMIN_EMAIL}"
        
        if [[ $? -eq 0 ]]; then
            echo ""
            echo -e "${GREEN}========================================${NC}"
            echo -e "${GREEN}  SSL Setup Complete!${NC}"
            echo -e "${GREEN}========================================${NC}"
            echo ""
            echo -e "Your site is now available at: ${GREEN}https://${DOMAIN}${NC}"
            echo ""
        else
            echo ""
            echo -e "${YELLOW}SSL setup was skipped or failed.${NC}"
            echo -e "You can run it later with: ${CYAN}cd /root/INSTALL && bash enable-ssl.sh${NC}"
            echo ""
        fi
    else
        echo ""
        echo -e "${YELLOW}SSL setup skipped.${NC}"
        echo -e "You can enable HTTPS later by running: ${CYAN}cd /root/INSTALL && bash enable-ssl.sh${NC}"
        echo ""
    fi
}

# Deploy application
deploy_application() {
    log "Creating deployment directory: ${DEPLOYMENT_DIR}"
    mkdir -p "${DEPLOYMENT_DIR}"
    
    log "Copying application files..."
    # Copy from INSTALL/app directory (prepared for deployment)
    local APP_DIR="${SCRIPT_DIR}/app"
    
    if [[ ! -d "${APP_DIR}" ]]; then
        error_exit "Application directory not found: ${APP_DIR}"
    fi
    
    # Copy all application files
    cp -r "${APP_DIR}"/* "${DEPLOYMENT_DIR}/" || error_exit "Failed to copy application files"
    
    # Copy Docker files
    cp "${SCRIPT_DIR}/config/Dockerfile" "${DEPLOYMENT_DIR}/"
    cp "${SCRIPT_DIR}/config/docker-compose.yml" "${DEPLOYMENT_DIR}/"
    
    # Create nginx.conf from template
    log "Generating nginx.conf from template..."
    rm -rf "${DEPLOYMENT_DIR}/nginx.conf" 2>/dev/null || true
    
    # Use HTTP-only template for initial deployment
    sed "s/DOMAIN_PLACEHOLDER/${DOMAIN}/g" "${SCRIPT_DIR}/config/nginx.conf.http-only.template" > "${DEPLOYMENT_DIR}/nginx.conf"
    
    # Save the full template for later SSL setup
    sed "s/DOMAIN_PLACEHOLDER/${DOMAIN}/g" "${SCRIPT_DIR}/config/nginx.conf.template" > "${DEPLOYMENT_DIR}/nginx.conf.with-ssl"
    
    log "Creating .env file from configuration..."
    create_env_file
    
    log "Building Docker images..."
    cd "${DEPLOYMENT_DIR}"
    docker compose build --no-cache || error_exit "Docker build failed"
    
    log "Starting Docker containers..."
    docker compose up -d || error_exit "Failed to start containers"
    
    log "Waiting for services to be ready..."
    sleep 15
    
    # Copy admin initialization file into the running container
    if [[ -f "${DEPLOYMENT_DIR}/.admin-storage-init.json" ]]; then
        log "Copying admin initialization file to container..."
        local max_attempts=5
        local attempt=1
        
        while [ $attempt -le $max_attempts ]; do
            if docker cp "${DEPLOYMENT_DIR}/.admin-storage-init.json" exchangekit-app:/usr/share/nginx/html/.admin-storage-init.json 2>/dev/null; then
                log "Admin initialization file copied successfully"
                break
            else
                log "Attempt $attempt/$max_attempts failed, retrying..."
                sleep 2
                attempt=$((attempt + 1))
            fi
        done
        
        if [ $attempt -gt $max_attempts ]; then
            log "Warning: Failed to copy admin init file after $max_attempts attempts"
        fi
    else
        log "Warning: Admin initialization file not found at ${DEPLOYMENT_DIR}/.admin-storage-init.json"
    fi
}

# Create environment file
create_env_file() {
    log "Generating .env file..."
    cat > "${DEPLOYMENT_DIR}/.env" <<EOF
# ExchangeKit - Production Configuration
# Generated: $(date)

# License Configuration
VITE_LICENSE_KEY=${LICENSE_KEY}
VITE_LICENSE_SERVER_URL=https://license.exchangekit.io
VITE_LICENSE_ENABLE_VALIDATION=true
VITE_LICENSE_CHECK_INTERVAL=24
VITE_LICENSE_GRACE_PERIOD=7

# Application Configuration
VITE_APP_ENV=production
VITE_APP_URL=https://${DOMAIN}
VITE_DEBUG=false

# API Configuration
VITE_COINGECKO_API_URL=https://api.coingecko.com/api/v3

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_TELEGRAM=false
VITE_ENABLE_2FA=true

# UI Configuration
VITE_DEFAULT_THEME=dark
VITE_DEFAULT_LANGUAGE=ru

# Security
VITE_SESSION_TIMEOUT=30

# Database Configuration
POSTGRES_DB=exchange_db
POSTGRES_USER=exchange_user
POSTGRES_PASSWORD=${DB_PASSWORD}
POSTGRES_HOST=postgres
POSTGRES_PORT=5432

# Application Ports
APP_PORT=${APP_PORT:-3000}
HTTP_PORT=${HTTP_PORT:-80}
HTTPS_PORT=${HTTPS_PORT:-443}
EOF
    
    chmod 600 "${DEPLOYMENT_DIR}/.env"
    log ".env file created successfully"
}

# Activate license
activate_license() {
    log "Activating license for domain: ${DOMAIN}"
    
    # Wait for application to be ready
    sleep 5
    
    # License activation happens automatically when the app starts
    # The app will contact the license server with the configured key
    log "License activation initiated. The application will validate on startup."
    
    print_success "License configured for automatic activation"
}

# Show completion message
show_completion() {
    clear
    echo -e "${GREEN}"
    cat << "EOF"
===============================================================
|                                                             |
|         INSTALLATION COMPLETED SUCCESSFULLY!                |
|                                                             |
===============================================================
EOF
    echo -e "${NC}"
    
    echo -e "${CYAN}================================================================${NC}"
    echo -e "${GREEN}Application URL:${NC}      http://${DOMAIN}"
    echo -e "${GREEN}Admin Panel:${NC}          http://${DOMAIN}/admin/login"
    echo -e "${GREEN}Admin Email:${NC}          ${ADMIN_EMAIL}"
    echo -e "${GREEN}Admin Password:${NC}       ${ADMIN_PASSWORD}"
    echo -e "${CYAN}================================================================${NC}"
    echo ""
    echo -e "${YELLOW}IMPORTANT SECURITY NOTES:${NC}"
    echo "  - Save your credentials in a secure location"
    echo "  - Change your admin password after first login"
    echo "  - Enable 2FA in the admin panel"
    echo "  - Your credentials are saved in: ${DEPLOYMENT_DIR}/.credentials"
    echo "  - Site is running on HTTP - enable HTTPS for security:"
    echo "    cd /root/INSTALL && bash enable-ssl.sh"
    echo ""
    echo -e "${CYAN}================================================================${NC}"
    echo -e "${GREEN}Next Steps:${NC}"
    echo "  1. Visit http://${DOMAIN}/admin/login to access admin panel"
    echo "  2. Use email: ${ADMIN_EMAIL}"
    echo "  3. Use password: ${ADMIN_PASSWORD}"
    echo "  4. If login fails, clear browser cache and try again"
    echo "  5. Complete your profile setup"
    echo "  6. Configure exchange rates and currencies"
    echo "  7. Setup SSL certificate (recommended):"
    echo "     cd /root/INSTALL && bash scripts/setup-ssl.sh ${DOMAIN} ${ADMIN_EMAIL}"
    echo ""
    echo -e "${CYAN}================================================================${NC}"
    echo -e "${GREEN}Useful Commands:${NC}"
    echo "  - View logs:        cd ${DEPLOYMENT_DIR} && docker compose logs -f"
    echo "  - Restart services: cd ${DEPLOYMENT_DIR} && docker compose restart"
    echo "  - Stop services:    cd ${DEPLOYMENT_DIR} && docker compose stop"
    echo "  - Start services:   cd ${DEPLOYMENT_DIR} && docker compose start"
    echo "  - Check status:     cd ${DEPLOYMENT_DIR} && docker compose ps"
    echo ""
    echo -e "${CYAN}================================================================${NC}"
    echo -e "${GREEN}Support:${NC}"
    echo "  - Documentation: https://docs.4ex.com"
    echo "  - Support Email: support@exchangekit.io"
    echo "  - License Issues: licenses@exchangekit.io"
    echo ""
    
    # Save credentials to file
    cat > "${DEPLOYMENT_DIR}/.credentials" <<EOF
ExchangeKit - Admin Credentials
Installation Date: $(date)

Application URL: http://${DOMAIN}
Admin Email: ${ADMIN_EMAIL}
Admin Password: ${ADMIN_PASSWORD}

IMPORTANT:
- Site is currently running on HTTP only
- To enable HTTPS, run: cd /root/INSTALL && bash scripts/setup-ssl.sh ${DOMAIN} ${ADMIN_EMAIL}
- After SSL setup, URL will be: https://${DOMAIN}

KEEP THIS FILE SECURE AND DELETE AFTER SAVING CREDENTIALS!
EOF
    chmod 600 "${DEPLOYMENT_DIR}/.credentials"
    
    log "=== Installation completed successfully ==="
}

# Run main installation
check_root
main "$@"
