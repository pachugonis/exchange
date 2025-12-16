#!/bin/bash

#############################################################################
# Configuration Wizard
# Interactive configuration collection and validation
#############################################################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && cd .. && pwd)"
source "${SCRIPT_DIR}/utils/messages.sh"
source "${SCRIPT_DIR}/utils/validators.sh"
source "${SCRIPT_DIR}/utils/helpers.sh"

CONFIG_FILE="${SCRIPT_DIR}/.install.conf"

# Configuration variables
DOMAIN=""
ADMIN_EMAIL=""
ADMIN_PASSWORD=""
LICENSE_KEY=""
DB_PASSWORD=""
APP_PORT=80
SSL_PORT=443

# Welcome message
show_welcome() {
    clear
    echo -e "${CYAN}"
    cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║          4EX EXCHANGE PLATFORM - INSTALLATION WIZARD         ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
    echo ""
    echo "This wizard will guide you through the installation process."
    echo "Please have the following information ready:"
    echo ""
    echo "  • Your domain name (DNS must point to this server)"
    echo "  • Administrator email address"
    echo "  • Strong administrator password"
    echo "  • Valid license key (format: LIC-XXXX-XXXX-XXXX-XXXX)"
    echo ""
    echo "Press Enter to continue..."
    read
}

# Collect domain name
collect_domain() {
    echo ""
    print_section "Domain Configuration"
    echo ""
    
    while true; do
        read -p "Enter your domain name (e.g., exchange.example.com): " DOMAIN
        
        if validate_domain "$DOMAIN"; then
            print_success "Domain format valid: $DOMAIN"
            
            # Check DNS resolution
            print_info "Checking DNS resolution..."
            local server_ip=$(curl -s ifconfig.me || echo "unknown")
            local domain_ip=$(dig +short "$DOMAIN" | tail -1 || echo "")
            
            if [[ -n "$domain_ip" ]]; then
                print_info "Domain resolves to: $domain_ip"
                print_info "Server IP: $server_ip"
                
                if [[ "$domain_ip" != "$server_ip" ]]; then
                    print_warning "Domain does not point to this server!"
                    print_warning "SSL certificate generation may fail."
                    
                    read -p "Continue anyway? (y/N): " -n 1 -r
                    echo
                    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                        continue
                    fi
                fi
            else
                print_warning "Cannot resolve domain. Make sure DNS is configured."
                read -p "Continue anyway? (y/N): " -n 1 -r
                echo
                if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                    continue
                fi
            fi
            
            break
        else
            print_error "Invalid domain format. Please try again."
        fi
    done
}

# Collect admin email
collect_email() {
    echo ""
    print_section "Administrator Email"
    echo ""
    print_info "This email will be used for:"
    echo "  • SSL certificate notifications"
    echo "  • Administrator account login"
    echo "  • System notifications"
    echo ""
    
    while true; do
        read -p "Enter administrator email: " ADMIN_EMAIL
        
        if validate_email "$ADMIN_EMAIL"; then
            print_success "Email format valid: $ADMIN_EMAIL"
            break
        else
            print_error "Invalid email format. Please try again."
        fi
    done
}

# Collect admin password
collect_password() {
    echo ""
    print_section "Administrator Password"
    echo ""
    print_info "Password requirements:"
    echo "  • Minimum 12 characters"
    echo "  • At least one uppercase letter"
    echo "  • At least one lowercase letter"
    echo "  • At least one number"
    echo "  • At least one special character"
    echo ""
    
    while true; do
        read -s -p "Enter administrator password: " ADMIN_PASSWORD
        echo
        
        if validate_password "$ADMIN_PASSWORD"; then
            read -s -p "Confirm password: " password_confirm
            echo
            
            if [[ "$ADMIN_PASSWORD" == "$password_confirm" ]]; then
                print_success "Password set successfully"
                break
            else
                print_error "Passwords do not match. Please try again."
            fi
        else
            print_error "Password does not meet requirements. Please try again."
        fi
    done
}

# Collect license key
collect_license() {
    echo ""
    print_section "License Key"
    echo ""
    print_info "Enter your product license key."
    print_info "Format: LIC-XXXX-XXXX-XXXX-XXXX"
    echo ""
    
    while true; do
        read -p "Enter license key: " LICENSE_KEY
        
        if validate_license_key "$LICENSE_KEY"; then
            print_success "License key format valid"
            break
        else
            print_error "Invalid license key format. Please try again."
        fi
    done
}

# Collect database password
collect_database() {
    echo ""
    print_section "Database Configuration"
    echo ""
    print_info "A PostgreSQL database will be created for the application."
    echo ""
    
    read -p "Auto-generate secure database password? (Y/n): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Nn]$ ]]; then
        while true; do
            read -s -p "Enter database password (min 16 characters): " DB_PASSWORD
            echo
            
            if [[ ${#DB_PASSWORD} -ge 16 ]]; then
                read -s -p "Confirm password: " db_confirm
                echo
                
                if [[ "$DB_PASSWORD" == "$db_confirm" ]]; then
                    print_success "Database password set"
                    break
                else
                    print_error "Passwords do not match. Please try again."
                fi
            else
                print_error "Password must be at least 16 characters."
            fi
        done
    else
        DB_PASSWORD=$(generate_password 32)
        print_success "Database password auto-generated"
    fi
}

# Collect port configuration
collect_ports() {
    echo ""
    print_section "Port Configuration"
    echo ""
    print_info "Default ports: HTTP (80), HTTPS (443)"
    echo ""
    
    read -p "Use default ports? (Y/n): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Nn]$ ]]; then
        read -p "HTTP port [80]: " custom_http
        APP_PORT=${custom_http:-80}
        
        read -p "HTTPS port [443]: " custom_https
        SSL_PORT=${custom_https:-443}
        
        print_info "Using ports: HTTP=${APP_PORT}, HTTPS=${SSL_PORT}"
    else
        print_info "Using default ports: HTTP=80, HTTPS=443"
    fi
}

# Show configuration summary
show_summary() {
    echo ""
    print_section "Configuration Summary"
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}Domain:${NC}              $DOMAIN"
    echo -e "${GREEN}Admin Email:${NC}         $ADMIN_EMAIL"
    echo -e "${GREEN}Admin Password:${NC}      **********"
    echo -e "${GREEN}License Key:${NC}         ${LICENSE_KEY:0:8}...${LICENSE_KEY: -4}"
    echo -e "${GREEN}Database Password:${NC}   **********"
    echo -e "${GREEN}HTTP Port:${NC}           $APP_PORT"
    echo -e "${GREEN}HTTPS Port:${NC}          $SSL_PORT"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
}

# Save configuration
save_configuration() {
    cat > "$CONFIG_FILE" <<EOF
# 4EX Exchange Installation Configuration
# Generated: $(date)

DOMAIN="${DOMAIN}"
ADMIN_EMAIL="${ADMIN_EMAIL}"
ADMIN_PASSWORD="${ADMIN_PASSWORD}"
LICENSE_KEY="${LICENSE_KEY}"
DB_PASSWORD="${DB_PASSWORD}"
APP_PORT=${APP_PORT}
HTTP_PORT=${APP_PORT}
SSL_PORT=${SSL_PORT}
HTTPS_PORT=${SSL_PORT}
EOF
    
    chmod 600 "$CONFIG_FILE"
    print_success "Configuration saved"
}

# Main execution
main() {
    show_welcome
    
    collect_domain
    collect_email
    collect_password
    collect_license
    collect_database
    collect_ports
    
    show_summary
    
    echo ""
    read -p "Proceed with installation? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Installation cancelled by user"
        exit 1
    fi
    
    save_configuration
    
    echo ""
    print_success "✓ Configuration complete!"
    echo ""
}

main "$@"
#!/bin/bash

#############################################################################
# Configuration Wizard
# Interactive configuration collection and validation
#############################################################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && cd .. && pwd)"
source "${SCRIPT_DIR}/utils/messages.sh"
source "${SCRIPT_DIR}/utils/validators.sh"
source "${SCRIPT_DIR}/utils/helpers.sh"

CONFIG_FILE="${SCRIPT_DIR}/.install.conf"

# Configuration variables
DOMAIN=""
ADMIN_EMAIL=""
ADMIN_PASSWORD=""
LICENSE_KEY=""
DB_PASSWORD=""
APP_PORT=80
SSL_PORT=443

# Welcome message
show_welcome() {
    clear
    echo -e "${CYAN}"
    cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║          4EX EXCHANGE PLATFORM - INSTALLATION WIZARD         ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
    echo ""
    echo "This wizard will guide you through the installation process."
    echo "Please have the following information ready:"
    echo ""
    echo "  • Your domain name (DNS must point to this server)"
    echo "  • Administrator email address"
    echo "  • Strong administrator password"
    echo "  • Valid license key (format: LIC-XXXX-XXXX-XXXX-XXXX)"
    echo ""
    echo "Press Enter to continue..."
    read
}

# Collect domain name
collect_domain() {
    echo ""
    print_section "Domain Configuration"
    echo ""
    
    while true; do
        read -p "Enter your domain name (e.g., exchange.example.com): " DOMAIN
        
        if validate_domain "$DOMAIN"; then
            print_success "Domain format valid: $DOMAIN"
            
            # Check DNS resolution
            print_info "Checking DNS resolution..."
            local server_ip=$(curl -s ifconfig.me || echo "unknown")
            local domain_ip=$(dig +short "$DOMAIN" | tail -1 || echo "")
            
            if [[ -n "$domain_ip" ]]; then
                print_info "Domain resolves to: $domain_ip"
                print_info "Server IP: $server_ip"
                
                if [[ "$domain_ip" != "$server_ip" ]]; then
                    print_warning "Domain does not point to this server!"
                    print_warning "SSL certificate generation may fail."
                    
                    read -p "Continue anyway? (y/N): " -n 1 -r
                    echo
                    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                        continue
                    fi
                fi
            else
                print_warning "Cannot resolve domain. Make sure DNS is configured."
                read -p "Continue anyway? (y/N): " -n 1 -r
                echo
                if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                    continue
                fi
            fi
            
            break
        else
            print_error "Invalid domain format. Please try again."
        fi
    done
}

# Collect admin email
collect_email() {
    echo ""
    print_section "Administrator Email"
    echo ""
    print_info "This email will be used for:"
    echo "  • SSL certificate notifications"
    echo "  • Administrator account login"
    echo "  • System notifications"
    echo ""
    
    while true; do
        read -p "Enter administrator email: " ADMIN_EMAIL
        
        if validate_email "$ADMIN_EMAIL"; then
            print_success "Email format valid: $ADMIN_EMAIL"
            break
        else
            print_error "Invalid email format. Please try again."
        fi
    done
}

# Collect admin password
collect_password() {
    echo ""
    print_section "Administrator Password"
    echo ""
    print_info "Password requirements:"
    echo "  • Minimum 12 characters"
    echo "  • At least one uppercase letter"
    echo "  • At least one lowercase letter"
    echo "  • At least one number"
    echo "  • At least one special character"
    echo ""
    
    while true; do
        read -s -p "Enter administrator password: " ADMIN_PASSWORD
        echo
        
        if validate_password "$ADMIN_PASSWORD"; then
            read -s -p "Confirm password: " password_confirm
            echo
            
            if [[ "$ADMIN_PASSWORD" == "$password_confirm" ]]; then
                print_success "Password set successfully"
                break
            else
                print_error "Passwords do not match. Please try again."
            fi
        else
            print_error "Password does not meet requirements. Please try again."
        fi
    done
}

# Collect license key
collect_license() {
    echo ""
    print_section "License Key"
    echo ""
    print_info "Enter your product license key."
    print_info "Format: LIC-XXXX-XXXX-XXXX-XXXX"
    echo ""
    
    while true; do
        read -p "Enter license key: " LICENSE_KEY
        
        if validate_license_key "$LICENSE_KEY"; then
            print_success "License key format valid"
            break
        else
            print_error "Invalid license key format. Please try again."
        fi
    done
}

# Collect database password
collect_database() {
    echo ""
    print_section "Database Configuration"
    echo ""
    print_info "A PostgreSQL database will be created for the application."
    echo ""
    
    read -p "Auto-generate secure database password? (Y/n): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Nn]$ ]]; then
        while true; do
            read -s -p "Enter database password (min 16 characters): " DB_PASSWORD
            echo
            
            if [[ ${#DB_PASSWORD} -ge 16 ]]; then
                read -s -p "Confirm password: " db_confirm
                echo
                
                if [[ "$DB_PASSWORD" == "$db_confirm" ]]; then
                    print_success "Database password set"
                    break
                else
                    print_error "Passwords do not match. Please try again."
                fi
            else
                print_error "Password must be at least 16 characters."
            fi
        done
    else
        DB_PASSWORD=$(generate_password 32)
        print_success "Database password auto-generated"
    fi
}

# Collect port configuration
collect_ports() {
    echo ""
    print_section "Port Configuration"
    echo ""
    print_info "Default ports: HTTP (80), HTTPS (443)"
    echo ""
    
    read -p "Use default ports? (Y/n): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Nn]$ ]]; then
        read -p "HTTP port [80]: " custom_http
        APP_PORT=${custom_http:-80}
        
        read -p "HTTPS port [443]: " custom_https
        SSL_PORT=${custom_https:-443}
        
        print_info "Using ports: HTTP=${APP_PORT}, HTTPS=${SSL_PORT}"
    else
        print_info "Using default ports: HTTP=80, HTTPS=443"
    fi
}

# Show configuration summary
show_summary() {
    echo ""
    print_section "Configuration Summary"
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}Domain:${NC}              $DOMAIN"
    echo -e "${GREEN}Admin Email:${NC}         $ADMIN_EMAIL"
    echo -e "${GREEN}Admin Password:${NC}      **********"
    echo -e "${GREEN}License Key:${NC}         ${LICENSE_KEY:0:8}...${LICENSE_KEY: -4}"
    echo -e "${GREEN}Database Password:${NC}   **********"
    echo -e "${GREEN}HTTP Port:${NC}           $APP_PORT"
    echo -e "${GREEN}HTTPS Port:${NC}          $SSL_PORT"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
}

# Save configuration
save_configuration() {
    cat > "$CONFIG_FILE" <<EOF
# 4EX Exchange Installation Configuration
# Generated: $(date)

DOMAIN="${DOMAIN}"
ADMIN_EMAIL="${ADMIN_EMAIL}"
ADMIN_PASSWORD="${ADMIN_PASSWORD}"
LICENSE_KEY="${LICENSE_KEY}"
DB_PASSWORD="${DB_PASSWORD}"
APP_PORT=${APP_PORT}
HTTP_PORT=${APP_PORT}
SSL_PORT=${SSL_PORT}
HTTPS_PORT=${SSL_PORT}
EOF
    
    chmod 600 "$CONFIG_FILE"
    print_success "Configuration saved"
}

# Main execution
main() {
    show_welcome
    
    collect_domain
    collect_email
    collect_password
    collect_license
    collect_database
    collect_ports
    
    show_summary
    
    echo ""
    read -p "Proceed with installation? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Installation cancelled by user"
        exit 1
    fi
    
    save_configuration
    
    echo ""
    print_success "✓ Configuration complete!"
    echo ""
}

main "$@"
