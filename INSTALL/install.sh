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
    
    LANG_CODE="${LANG_CODE}" bash "${SCRIPT_DIR}/scripts/check-prerequisites.sh" || error_exit "$(t 'prerequisites_failed')"
    
    # Phase 2: Interactive configuration
    print_phase "$(t 'phase2')"
    LANG_CODE="${LANG_CODE}" bash "${SCRIPT_DIR}/scripts/configure.sh" || error_exit "$(t 'configuration_failed')"
    
    # Load configuration
    if [[ -f "${SCRIPT_DIR}/.install.conf" ]]; then
        source "${SCRIPT_DIR}/.install.conf"
    else
        error_exit "Configuration file not found"
    fi
    
    # Phase 3: System preparation
    print_phase "$(t 'phase3')"
    LANG_CODE="${LANG_CODE}" bash "${SCRIPT_DIR}/scripts/setup-docker.sh" || error_exit "$(t 'docker_setup_failed')"
    
    # Phase 4: Application deployment
    print_phase "$(t 'phase4')"
    deploy_application
    
    # Phase 5: SSL certificate setup (SKIPPED - run enable-ssl.sh after installation)
    # SSL will be configured separately to avoid installation failures
    # To enable HTTPS: cd /root/INSTALL && bash enable-ssl.sh
    
    # Phase 6: Database initialization
    print_phase "$(t 'phase5')"
    LANG_CODE="${LANG_CODE}" bash "${SCRIPT_DIR}/scripts/setup-database.sh" || error_exit "$(t 'database_setup_failed')"
    
    # Phase 7: License activation
    print_phase "$(t 'phase6')"
    activate_license
    
    # Phase 7: Admin account creation
    print_phase "$(t 'phase7')"
    LANG_CODE="${LANG_CODE}" bash "${SCRIPT_DIR}/scripts/setup-admin.sh" "${ADMIN_EMAIL}" "${ADMIN_PASSWORD}" || error_exit "$(t 'admin_setup_failed')"
    
    # Phase 8: Health check
    print_phase "$(t 'phase8')"
    LANG_CODE="${LANG_CODE}" bash "${SCRIPT_DIR}/scripts/health-check.sh" "${DOMAIN}" || error_exit "Health check failed"
    
    # Installation complete
    show_completion
    
    # Phase 9: SSL Setup (Optional)
    echo ""
    echo -e "${YELLOW}========================================${NC}"
    echo -e "${YELLOW}  $(t 'ssl_optional_title')${NC}"
    echo -e "${YELLOW}========================================${NC}"
    echo ""
    echo "$(t 'ssl_site_running_http')"
    echo "$(t 'ssl_would_like_setup')"
    echo ""
    echo "$(t 'ssl_requirements'):"
    printf "  - $(t 'ssl_domain_must_point')\n" "${DOMAIN}"
    echo "  - $(t 'ssl_port_accessible')"
    echo ""
    read -p "$(t 'ssl_setup_now'): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        print_phase "$(t 'ssl_phase_9')"
        LANG_CODE="${LANG_CODE}" bash "${SCRIPT_DIR}/scripts/setup-ssl.sh" "${DOMAIN}" "${ADMIN_EMAIL}"
        
        if [[ $? -eq 0 ]]; then
            echo ""
            echo -e "${GREEN}========================================${NC}"
            echo -e "${GREEN}  $(t 'ssl_setup_complete')${NC}"
            echo -e "${GREEN}========================================${NC}"
            echo ""
            echo -e "$(t 'ssl_site_available_at'): ${GREEN}https://${DOMAIN}${NC}"
            echo ""
        else
            echo ""
            echo -e "${YELLOW}$(t 'ssl_setup_failed')${NC}"
            echo -e "$(t 'ssl_run_later'): ${CYAN}cd /root/INSTALL && bash enable-ssl.sh${NC}"
            echo ""
        fi
    else
        echo ""
        echo -e "${YELLOW}$(t 'ssl_setup_skipped')${NC}"
        echo -e "$(t 'ssl_enable_later'): ${CYAN}cd /root/INSTALL && bash enable-ssl.sh${NC}"
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
EOF
    printf "|%*s|\n" 61 "$(t 'installation_success_title')"
    cat << "EOF"
|                                                             |
===============================================================
EOF
    echo -e "${NC}"
    
    echo -e "${CYAN}================================================================${NC}"
    echo -e "${GREEN}$(t 'application_url'):${NC}      http://${DOMAIN}"
    echo -e "${GREEN}$(t 'admin_panel'):${NC}          http://${DOMAIN}/admin/login"
    echo -e "${GREEN}$(t 'admin_email'):${NC}          ${ADMIN_EMAIL}"
    echo -e "${GREEN}$(t 'admin_password'):${NC}       ${ADMIN_PASSWORD}"
    echo -e "${CYAN}================================================================${NC}"
    echo ""
    echo -e "${YELLOW}$(t 'security_notes'):${NC}"
    echo "  - $(t 'security_save_credentials')"
    echo "  - $(t 'security_change_password')"
    echo "  - $(t 'security_enable_2fa')"
    echo "  - $(t 'credentials_saved_to'): ${DEPLOYMENT_DIR}/.credentials"
    echo "  - $(t 'site_running_http'):"
    echo "    cd /root/INSTALL && bash enable-ssl.sh"
    echo ""
    echo -e "${CYAN}================================================================${NC}"
    echo -e "${GREEN}$(t 'next_steps'):${NC}"
    echo "  1. $(t 'step_visit_admin')"
    echo "  2. $(t 'step_use_email'): ${ADMIN_EMAIL}"
    echo "  3. $(t 'step_use_password'): ${ADMIN_PASSWORD}"
    echo "  4. $(t 'step_clear_cache')"
    echo "  5. $(t 'step_complete_profile')"
    echo "  6. $(t 'step_configure_rates')"
    echo "  7. $(t 'step_setup_ssl'):"
    echo "     cd /root/INSTALL && bash scripts/setup-ssl.sh ${DOMAIN} ${ADMIN_EMAIL}"
    echo ""
    echo -e "${CYAN}================================================================${NC}"
    echo -e "${GREEN}$(t 'useful_commands'):${NC}"
    echo "  - $(t 'cmd_view_logs'):        cd ${DEPLOYMENT_DIR} && docker compose logs -f"
    echo "  - $(t 'cmd_restart_services'): cd ${DEPLOYMENT_DIR} && docker compose restart"
    echo "  - $(t 'cmd_stop_services'):    cd ${DEPLOYMENT_DIR} && docker compose stop"
    echo "  - $(t 'cmd_start_services'):   cd ${DEPLOYMENT_DIR} && docker compose start"
    echo "  - $(t 'cmd_check_status'):     cd ${DEPLOYMENT_DIR} && docker compose ps"
    echo ""
    echo -e "${CYAN}================================================================${NC}"
    echo -e "${GREEN}$(t 'support'):${NC}"
    echo "  - $(t 'documentation'): https://docs.4ex.com"
    echo "  - $(t 'support_email'): support@exchangekit.io"
    echo "  - $(t 'license_issues'): licenses@exchangekit.io"
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
