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
    
    # Switch to full nginx configuration with SSL
    if [[ -f "${DEPLOYMENT_DIR}/nginx.conf.with-ssl" ]]; then
        cp "${DEPLOYMENT_DIR}/nginx.conf.with-ssl" "${DEPLOYMENT_DIR}/nginx.conf"
        print_success "Nginx configuration updated with SSL"
    else
        print_error "SSL-enabled nginx.conf not found"
        return 1
    fi
    
    # Enable HTTPS port in docker-compose.yml
    print_info "Enabling HTTPS port..."
    sed -i 's/# - "\${HTTPS_PORT:-443}:443"/- "\${HTTPS_PORT:-443}:443"/' "${DEPLOYMENT_DIR}/docker-compose.yml"
    
    # Recreate nginx container with new configuration
    print_info "Recreating nginx container..."
    cd "${DEPLOYMENT_DIR}"
    docker compose up -d nginx
    
    print_success "Nginx configured with SSL"
}

setup_renewal() {
    print_step "Setting up automatic certificate renewal..."
    
    # Create renewal script
    cat > /usr/local/bin/renew-ssl.sh <<'EOF'
#!/bin/bash
set -e

# Renew certificates
certbot renew --quiet

# Reload nginx
if docker ps | grep -q 4ex-nginx; then
    docker exec 4ex-nginx nginx -s reload
fi
EOF

    chmod +x /usr/local/bin/renew-ssl.sh
    
    # Add cron job for renewal (runs daily at 2am)
    if ! crontab -l 2>/dev/null | grep -q "renew-ssl.sh"; then
        (crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/renew-ssl.sh >> /var/log/ssl-renewal.log 2>&1") | crontab -
        print_success "Automatic renewal configured"
    else
        print_info "Automatic renewal already configured"
    fi
}

main() {
    print_section "SSL Certificate Setup"
    
    install_certbot
    stop_services
    obtain_certificate
    configure_nginx
    setup_renewal
    
    print_success "SSL setup completed successfully!"
    print_info "Certificate location: /etc/letsencrypt/live/${DOMAIN}/"
}

main
