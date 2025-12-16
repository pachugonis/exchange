#!/bin/bash

#############################################################################
# SSL Certificate Setup Script
# Generates Let's Encrypt SSL certificates
#############################################################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && cd .. && pwd)"
source "${SCRIPT_DIR}/utils/messages.sh"
source "${SCRIPT_DIR}/utils/helpers.sh"

DOMAIN="$1"
EMAIL="$2"
DEPLOYMENT_DIR="/opt/4ex-exchange"

if [[ -z "$DOMAIN" ]] || [[ -z "$EMAIL" ]]; then
    echo "Usage: $0 <domain> <email>"
    exit 1
fi

install_certbot() {
    print_step "Installing Certbot..."
    
    if command -v certbot &>/dev/null; then
        print_info "Certbot already installed"
        return 0
    fi
    
    apt-get update -qq
    apt-get install -y certbot
    
    print_success "Certbot installed"
}

stop_services() {
    print_step "Temporarily stopping web services..."
    
    # Stop Docker containers if running
    if docker ps | grep -q 4ex-nginx; then
        docker stop 4ex-nginx || true
    fi
    
    # Make sure port 80 is free
    local port80_pid=$(lsof -ti:80 || echo "")
    if [[ -n "$port80_pid" ]]; then
        print_info "Stopping process on port 80..."
        kill -9 $port80_pid || true
        sleep 2
    fi
}

obtain_certificate() {
    print_step "Obtaining SSL certificate for $DOMAIN..."
    
    # Create webroot directory
    mkdir -p /var/www/certbot
    
    # Try to obtain certificate using standalone mode
    if certbot certonly \
        --standalone \
        --non-interactive \
        --agree-tos \
        --email "$EMAIL" \
        --domain "$DOMAIN" \
        --preferred-challenges http; then
        
        print_success "SSL certificate obtained successfully"
    else
        print_error "Failed to obtain SSL certificate"
        print_info "Please check:"
        print_info "  1. Domain DNS points to this server"
        print_info "  2. Port 80 is accessible from internet"
        print_info "  3. No firewall blocking HTTP traffic"
        return 1
    fi
}

configure_nginx() {
    print_step "Configuring Nginx with SSL..."
    
    # Create nginx configuration from template
    cp "${SCRIPT_DIR}/config/nginx.conf.template" "${DEPLOYMENT_DIR}/nginx.conf"
    
    # Replace domain placeholder
    sed -i "s/DOMAIN_PLACEHOLDER/${DOMAIN}/g" "${DEPLOYMENT_DIR}/nginx.conf"
    
    print_success "Nginx configuration created"
}

setup_renewal() {
    print_step "Setting up automatic certificate renewal..."
    
    # Create renewal script
    cat > /usr/local/bin/renew-ssl.sh <<'EOF'
#!/bin/bash
certbot renew --quiet --deploy-hook "docker restart 4ex-nginx"
EOF
    
    chmod +x /usr/local/bin/renew-ssl.sh
    
    # Add cron job for renewal (daily at 2 AM)
    local cron_job="0 2 * * * /usr/local/bin/renew-ssl.sh >> /var/log/certbot-renewal.log 2>&1"
    
    # Check if cron job already exists
    if ! crontab -l 2>/dev/null | grep -q "renew-ssl.sh"; then
        (crontab -l 2>/dev/null; echo "$cron_job") | crontab -
        print_success "Auto-renewal cron job added"
    else
        print_info "Auto-renewal cron job already exists"
    fi
}

verify_certificate() {
    print_step "Verifying SSL certificate..."
    
    local cert_path="/etc/letsencrypt/live/${DOMAIN}/fullchain.pem"
    
    if [[ -f "$cert_path" ]]; then
        local expiry=$(openssl x509 -enddate -noout -in "$cert_path" | cut -d= -f2)
        print_success "Certificate valid until: $expiry"
    else
        print_error "Certificate file not found"
        return 1
    fi
}

restart_services() {
    print_step "Restarting services..."
    
    cd "${DEPLOYMENT_DIR}"
    
    # Restart nginx container to load new SSL certificates
    if docker ps -a | grep -q 4ex-nginx; then
        docker restart 4ex-nginx
        sleep 3
        
        if docker ps | grep -q 4ex-nginx; then
            print_success "Nginx restarted successfully"
        else
            print_error "Failed to restart Nginx"
            docker logs 4ex-nginx
            return 1
        fi
    fi
}

# Main execution
main() {
    echo ""
    print_info "Setting up SSL certificates for $DOMAIN..."
    echo ""
    
    install_certbot
    stop_services
    obtain_certificate
    configure_nginx
    setup_renewal
    verify_certificate
    restart_services
    
    echo ""
    print_success "✓ SSL setup complete!"
    echo ""
}

main "$@"
#!/bin/bash

#############################################################################
# SSL Certificate Setup Script
# Generates Let's Encrypt SSL certificates
#############################################################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && cd .. && pwd)"
source "${SCRIPT_DIR}/utils/messages.sh"
source "${SCRIPT_DIR}/utils/helpers.sh"

DOMAIN="$1"
EMAIL="$2"
DEPLOYMENT_DIR="/opt/4ex-exchange"

if [[ -z "$DOMAIN" ]] || [[ -z "$EMAIL" ]]; then
    echo "Usage: $0 <domain> <email>"
    exit 1
fi

install_certbot() {
    print_step "Installing Certbot..."
    
    if command -v certbot &>/dev/null; then
        print_info "Certbot already installed"
        return 0
    fi
    
    apt-get update -qq
    apt-get install -y certbot
    
    print_success "Certbot installed"
}

stop_services() {
    print_step "Temporarily stopping web services..."
    
    # Stop Docker containers if running
    if docker ps | grep -q 4ex-nginx; then
        docker stop 4ex-nginx || true
    fi
    
    # Make sure port 80 is free
    local port80_pid=$(lsof -ti:80 || echo "")
    if [[ -n "$port80_pid" ]]; then
        print_info "Stopping process on port 80..."
        kill -9 $port80_pid || true
        sleep 2
    fi
}

obtain_certificate() {
    print_step "Obtaining SSL certificate for $DOMAIN..."
    
    # Create webroot directory
    mkdir -p /var/www/certbot
    
    # Try to obtain certificate using standalone mode
    if certbot certonly \
        --standalone \
        --non-interactive \
        --agree-tos \
        --email "$EMAIL" \
        --domain "$DOMAIN" \
        --preferred-challenges http; then
        
        print_success "SSL certificate obtained successfully"
    else
        print_error "Failed to obtain SSL certificate"
        print_info "Please check:"
        print_info "  1. Domain DNS points to this server"
        print_info "  2. Port 80 is accessible from internet"
        print_info "  3. No firewall blocking HTTP traffic"
        return 1
    fi
}

configure_nginx() {
    print_step "Configuring Nginx with SSL..."
    
    # Create nginx configuration from template
    cp "${SCRIPT_DIR}/config/nginx.conf.template" "${DEPLOYMENT_DIR}/nginx.conf"
    
    # Replace domain placeholder
    sed -i "s/DOMAIN_PLACEHOLDER/${DOMAIN}/g" "${DEPLOYMENT_DIR}/nginx.conf"
    
    print_success "Nginx configuration created"
}

setup_renewal() {
    print_step "Setting up automatic certificate renewal..."
    
    # Create renewal script
    cat > /usr/local/bin/renew-ssl.sh <<'EOF'
#!/bin/bash
certbot renew --quiet --deploy-hook "docker restart 4ex-nginx"
EOF
    
    chmod +x /usr/local/bin/renew-ssl.sh
    
    # Add cron job for renewal (daily at 2 AM)
    local cron_job="0 2 * * * /usr/local/bin/renew-ssl.sh >> /var/log/certbot-renewal.log 2>&1"
    
    # Check if cron job already exists
    if ! crontab -l 2>/dev/null | grep -q "renew-ssl.sh"; then
        (crontab -l 2>/dev/null; echo "$cron_job") | crontab -
        print_success "Auto-renewal cron job added"
    else
        print_info "Auto-renewal cron job already exists"
    fi
}

verify_certificate() {
    print_step "Verifying SSL certificate..."
    
    local cert_path="/etc/letsencrypt/live/${DOMAIN}/fullchain.pem"
    
    if [[ -f "$cert_path" ]]; then
        local expiry=$(openssl x509 -enddate -noout -in "$cert_path" | cut -d= -f2)
        print_success "Certificate valid until: $expiry"
    else
        print_error "Certificate file not found"
        return 1
    fi
}

restart_services() {
    print_step "Restarting services..."
    
    cd "${DEPLOYMENT_DIR}"
    
    # Restart nginx container to load new SSL certificates
    if docker ps -a | grep -q 4ex-nginx; then
        docker restart 4ex-nginx
        sleep 3
        
        if docker ps | grep -q 4ex-nginx; then
            print_success "Nginx restarted successfully"
        else
            print_error "Failed to restart Nginx"
            docker logs 4ex-nginx
            return 1
        fi
    fi
}

# Main execution
main() {
    echo ""
    print_info "Setting up SSL certificates for $DOMAIN..."
    echo ""
    
    install_certbot
    stop_services
    obtain_certificate
    configure_nginx
    setup_renewal
    verify_certificate
    restart_services
    
    echo ""
    print_success "✓ SSL setup complete!"
    echo ""
}

main "$@"
