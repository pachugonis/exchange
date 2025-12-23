#!/bin/bash

#############################################################################
# Configuration Wizard
# Interactive configuration collection and validation
#############################################################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && cd .. && pwd)"
source "${SCRIPT_DIR}/utils/translations.sh"
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
===============================================================
                                                               
EOF
    echo "          $(t 'wizard_title')         "
    cat << "EOF"                                                               
===============================================================
EOF
    echo -e "${NC}"
    echo ""
    echo "$(t 'wizard_intro')"
    echo "$(t 'wizard_requirements')"
    echo ""
    echo "  - $(t 'wizard_domain')"
    echo "  - $(t 'wizard_admin_email')"
    echo "  - $(t 'wizard_admin_password')"
    echo "  - $(t 'wizard_license')"
    echo ""
    echo "$(t 'press_enter')"
    read
}

# Collect domain name
collect_domain() {
    echo ""
    print_section "$(t 'domain_config_title')"
    echo ""
    
    while true; do
        read -p "$(t 'enter_domain') " DOMAIN
        
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
            print_error "$(t 'invalid_domain')"
        fi
    done
}

# Collect admin email
collect_email() {
    echo ""
    print_section "$(t 'admin_email_title')"
    echo ""
    print_info "$(t 'email_usage_info')"
    echo "  - $(t 'email_usage_ssl')"
    echo "  - $(t 'email_usage_login')"
    echo "  - $(t 'email_usage_notifications')"
    echo ""
    
    while true; do
        read -p "$(t 'enter_admin_email') " ADMIN_EMAIL
        
        if validate_email "$ADMIN_EMAIL"; then
            print_success "Email format valid: $ADMIN_EMAIL"
            break
        else
            print_error "$(t 'invalid_email')"
        fi
    done
}

# Collect admin password
collect_password() {
    echo ""
    print_section "$(t 'admin_password_title')"
    echo ""
    print_info "$(t 'password_requirements')"
    echo "  - $(t 'password_req_length')"
    echo "  - $(t 'password_req_uppercase')"
    echo "  - $(t 'password_req_lowercase')"
    echo "  - $(t 'password_req_number')"
    echo "  - $(t 'password_req_special')"
    echo ""
    
    while true; do
        read -s -p "$(t 'enter_admin_password') " ADMIN_PASSWORD
        echo
        
        if validate_password "$ADMIN_PASSWORD"; then
            read -s -p "$(t 'confirm_password') " password_confirm
            echo
            
            if [[ "$ADMIN_PASSWORD" == "$password_confirm" ]]; then
                print_success "Password set successfully"
                break
            else
                print_error "$(t 'password_mismatch')"
            fi
        else
            print_error "$(t 'password_too_short')"
        fi
    done
}

# Collect license key
collect_license() {
    echo ""
    print_section "$(t 'license_key_title')"
    echo ""
    print_info "$(t 'license_key_info')"
    print_info "$(t 'license_key_format')"
    echo ""
    
    while true; do
        read -p "$(t 'enter_license') " LICENSE_KEY
        
        if validate_license_key "$LICENSE_KEY"; then
            print_success "License key format valid"
            break
        else
            print_error "$(t 'invalid_license')"
        fi
    done
}

# Collect database password
collect_database() {
    echo ""
    print_section "$(t 'database_config_title')"
    echo ""
    print_info "$(t 'database_info')"
    echo ""
    
    read -p "$(t 'auto_generate_db_password') (Y/n): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Nn]$ ]]; then
        while true; do
            read -s -p "$(t 'enter_db_password_prompt') " DB_PASSWORD
            echo
            
            if [[ ${#DB_PASSWORD} -ge 16 ]]; then
                read -s -p "$(t 'confirm_password') " db_confirm
                echo
                
                if [[ "$DB_PASSWORD" == "$db_confirm" ]]; then
                    print_success "$(t 'db_password_set')"
                    break
                else
                    print_error "$(t 'password_mismatch')"
                fi
            else
                print_error "$(t 'db_password_min_length')"
            fi
        done
    else
        DB_PASSWORD=$(generate_password 32)
        print_success "$(t 'db_password_generated')"
    fi
}

# Collect port configuration
collect_ports() {
    echo ""
    print_section "$(t 'port_config_title')"
    echo ""
    print_info "$(t 'default_ports_info')"
    echo ""
    
    read -p "$(t 'use_default_ports') (Y/n): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Nn]$ ]]; then
        read -p "$(t 'http_port_prompt') [80]: " custom_http
        APP_PORT=${custom_http:-80}
        
        read -p "$(t 'https_port_prompt') [443]: " custom_https
        SSL_PORT=${custom_https:-443}
        
        print_info "$(t 'using_custom_ports') HTTP=${APP_PORT}, HTTPS=${SSL_PORT}"
    else
        print_info "$(t 'using_default_ports')"
    fi
}

# Show configuration summary
show_summary() {
    echo ""
    print_section "$(t 'configuration_summary')"
    echo ""
    echo -e "${CYAN}===============================================================${NC}"
    echo -e "${GREEN}$(t 'summary_domain'):${NC}              $DOMAIN"
    echo -e "${GREEN}$(t 'summary_admin_email'):${NC}         $ADMIN_EMAIL"
    echo -e "${GREEN}$(t 'summary_admin_password'):${NC}      **********"
    echo -e "${GREEN}$(t 'summary_license_key'):${NC}         ${LICENSE_KEY:0:8}...${LICENSE_KEY: -4}"
    echo -e "${GREEN}$(t 'summary_db_password'):${NC}   **********"
    echo -e "${GREEN}$(t 'summary_http_port'):${NC}           $APP_PORT"
    echo -e "${GREEN}$(t 'summary_https_port'):${NC}          $SSL_PORT"
    echo -e "${CYAN}===============================================================${NC}"
    echo ""
}

# Save configuration
save_configuration() {
    cat > "$CONFIG_FILE" <<EOF
# ExchangeKit Installation Configuration
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
    print_success "$(t 'config_saved')"
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
    read -p "$(t 'confirm_installation') " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "$(t 'installation_cancelled')"
        exit 1
    fi
    
    save_configuration
    
    echo ""
    print_success "$(t 'config_complete')"
    echo ""
}

main "$@"
