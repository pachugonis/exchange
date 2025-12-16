#!/bin/bash

#############################################################################
# Health Check Script
# Validates post-installation status
#############################################################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && cd .. && pwd)"
source "${SCRIPT_DIR}/utils/messages.sh"
source "${SCRIPT_DIR}/utils/helpers.sh"

DOMAIN="$1"
DEPLOYMENT_DIR="/opt/4ex-exchange"

if [[ -z "$DOMAIN" ]]; then
    echo "Usage: $0 <domain>"
    exit 1
fi

check_containers() {
    print_step "Checking Docker containers..."
    
    local containers=("4ex-postgres" "4ex-app" "4ex-nginx")
    local all_running=true
    
    for container in "${containers[@]}"; do
        if docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
            print_success "Container ${container}: Running"
        else
            print_error "Container ${container}: Not running"
            all_running=false
        fi
    done
    
    if [[ "$all_running" == false ]]; then
        return 1
    fi
}

check_database() {
    print_step "Checking database connectivity..."
    
    if docker exec 4ex-postgres pg_isready -U exchange_user &>/dev/null; then
        print_success "Database: Connected"
    else
        print_error "Database: Connection failed"
        return 1
    fi
    
    # Check if tables exist
    local table_count=$(docker exec 4ex-postgres psql -U exchange_user -d exchange_db -t -c \
        "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null || echo "0")
    
    if [[ $table_count -gt 0 ]]; then
        print_success "Database: ${table_count} tables created"
    else
        print_warning "Database: No tables found"
    fi
}

check_http() {
    print_step "Checking HTTP endpoint..."
    
    local max_attempts=5
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -o /dev/null -w "%{http_code}" http://localhost:80 | grep -q "200\|301\|302"; then
            print_success "HTTP: Responding"
            return 0
        fi
        
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "HTTP: Not responding"
    return 1
}

check_https() {
    print_step "Checking HTTPS endpoint..."
    
    local max_attempts=5
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -k -s -o /dev/null -w "%{http_code}" https://localhost:443 | grep -q "200\|301\|302"; then
            print_success "HTTPS: Responding"
            return 0
        fi
        
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_warning "HTTPS: Not responding (may still be initializing)"
}

check_ssl_certificate() {
    print_step "Checking SSL certificate..."
    
    local cert_path="/etc/letsencrypt/live/${DOMAIN}/fullchain.pem"
    
    if [[ -f "$cert_path" ]]; then
        local expiry=$(openssl x509 -enddate -noout -in "$cert_path" | cut -d= -f2)
        local days_left=$(( ($(date -d "$expiry" +%s) - $(date +%s)) / 86400 ))
        
        if [[ $days_left -gt 0 ]]; then
            print_success "SSL Certificate: Valid (expires in ${days_left} days)"
        else
            print_error "SSL Certificate: Expired"
            return 1
        fi
    else
        print_warning "SSL Certificate: Not found at expected location"
    fi
}

check_application() {
    print_step "Checking application health..."
    
    # Wait a bit for app to fully initialize
    sleep 5
    
    # Try to access health endpoint
    if docker exec 4ex-app wget --quiet --tries=1 --spider http://localhost:3000/health 2>/dev/null; then
        print_success "Application: Health check passed"
    else
        print_warning "Application: Health endpoint not responding"
    fi
    
    # Check if index.html exists
    if docker exec 4ex-app test -f /usr/share/nginx/html/index.html; then
        print_success "Application: Static files deployed"
    else
        print_error "Application: Static files missing"
        return 1
    fi
}

check_license() {
    print_step "Checking license configuration..."
    
    if [[ -f "${DEPLOYMENT_DIR}/.env" ]]; then
        if grep -q "VITE_LICENSE_KEY=" "${DEPLOYMENT_DIR}/.env"; then
            print_success "License: Configured"
        else
            print_warning "License: Not configured in .env"
        fi
    else
        print_error "License: .env file not found"
        return 1
    fi
}

check_firewall() {
    print_step "Checking firewall rules..."
    
    if command -v ufw &>/dev/null; then
        if ufw status | grep -q "Status: active"; then
            print_success "Firewall: Active"
            
            # Check if required ports are allowed
            if ufw status | grep -q "80/tcp.*ALLOW"; then
                print_success "Firewall: Port 80 allowed"
            else
                print_warning "Firewall: Port 80 not explicitly allowed"
            fi
            
            if ufw status | grep -q "443/tcp.*ALLOW"; then
                print_success "Firewall: Port 443 allowed"
            else
                print_warning "Firewall: Port 443 not explicitly allowed"
            fi
        else
            print_warning "Firewall: Inactive"
        fi
    else
        print_info "Firewall: UFW not installed"
    fi
}

check_disk_space() {
    print_step "Checking disk space..."
    
    local free_space=$(df -BG / | tail -1 | awk '{print $4}' | sed 's/G//')
    
    if [[ $free_space -gt 5 ]]; then
        print_success "Disk Space: ${free_space}GB available"
    elif [[ $free_space -gt 2 ]]; then
        print_warning "Disk Space: ${free_space}GB available (running low)"
    else
        print_error "Disk Space: ${free_space}GB available (critically low)"
    fi
}

generate_report() {
    local report_file="${DEPLOYMENT_DIR}/health-check-report.txt"
    
    cat > "$report_file" <<EOF
4EX Exchange Platform - Health Check Report
Generated: $(date)
Domain: ${DOMAIN}

Container Status:
$(docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | grep 4ex- || echo "No containers found")

Database Status:
$(docker exec 4ex-postgres psql -U exchange_user -d exchange_db -c "SELECT version();" 2>/dev/null || echo "Database not accessible")

Application Logs (last 20 lines):
$(docker logs --tail 20 4ex-app 2>&1 || echo "No logs available")

Nginx Logs (last 20 lines):
$(docker logs --tail 20 4ex-nginx 2>&1 || echo "No logs available")

Disk Usage:
$(df -h /)

Memory Usage:
$(free -h)

EOF
    
    print_success "Health check report saved to: $report_file"
}

# Main execution
main() {
    echo ""
    print_info "Running post-installation health checks..."
    echo ""
    
    local failed=0
    
    check_containers || failed=$((failed + 1))
    check_database || failed=$((failed + 1))
    check_application || failed=$((failed + 1))
    check_license || failed=$((failed + 1))
    check_http || failed=$((failed + 1))
    check_https || true  # Don't fail on HTTPS check
    check_ssl_certificate || true  # Don't fail on SSL check
    check_firewall || true  # Don't fail on firewall check
    check_disk_space || true  # Don't fail on disk space check
    
    generate_report
    
    echo ""
    
    if [[ $failed -eq 0 ]]; then
        print_success "✓ All critical health checks passed!"
        echo ""
        print_info "Your application is ready at: https://${DOMAIN}"
    else
        print_warning "⚠ Some health checks failed (${failed} issues found)"
        print_info "Please review the issues above and the health check report."
    fi
    
    echo ""
    
    return $failed
}

main "$@"
#!/bin/bash

#############################################################################
# Health Check Script
# Validates post-installation status
#############################################################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && cd .. && pwd)"
source "${SCRIPT_DIR}/utils/messages.sh"
source "${SCRIPT_DIR}/utils/helpers.sh"

DOMAIN="$1"
DEPLOYMENT_DIR="/opt/4ex-exchange"

if [[ -z "$DOMAIN" ]]; then
    echo "Usage: $0 <domain>"
    exit 1
fi

check_containers() {
    print_step "Checking Docker containers..."
    
    local containers=("4ex-postgres" "4ex-app" "4ex-nginx")
    local all_running=true
    
    for container in "${containers[@]}"; do
        if docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
            print_success "Container ${container}: Running"
        else
            print_error "Container ${container}: Not running"
            all_running=false
        fi
    done
    
    if [[ "$all_running" == false ]]; then
        return 1
    fi
}

check_database() {
    print_step "Checking database connectivity..."
    
    if docker exec 4ex-postgres pg_isready -U exchange_user &>/dev/null; then
        print_success "Database: Connected"
    else
        print_error "Database: Connection failed"
        return 1
    fi
    
    # Check if tables exist
    local table_count=$(docker exec 4ex-postgres psql -U exchange_user -d exchange_db -t -c \
        "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null || echo "0")
    
    if [[ $table_count -gt 0 ]]; then
        print_success "Database: ${table_count} tables created"
    else
        print_warning "Database: No tables found"
    fi
}

check_http() {
    print_step "Checking HTTP endpoint..."
    
    local max_attempts=5
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -o /dev/null -w "%{http_code}" http://localhost:80 | grep -q "200\|301\|302"; then
            print_success "HTTP: Responding"
            return 0
        fi
        
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "HTTP: Not responding"
    return 1
}

check_https() {
    print_step "Checking HTTPS endpoint..."
    
    local max_attempts=5
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -k -s -o /dev/null -w "%{http_code}" https://localhost:443 | grep -q "200\|301\|302"; then
            print_success "HTTPS: Responding"
            return 0
        fi
        
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_warning "HTTPS: Not responding (may still be initializing)"
}

check_ssl_certificate() {
    print_step "Checking SSL certificate..."
    
    local cert_path="/etc/letsencrypt/live/${DOMAIN}/fullchain.pem"
    
    if [[ -f "$cert_path" ]]; then
        local expiry=$(openssl x509 -enddate -noout -in "$cert_path" | cut -d= -f2)
        local days_left=$(( ($(date -d "$expiry" +%s) - $(date +%s)) / 86400 ))
        
        if [[ $days_left -gt 0 ]]; then
            print_success "SSL Certificate: Valid (expires in ${days_left} days)"
        else
            print_error "SSL Certificate: Expired"
            return 1
        fi
    else
        print_warning "SSL Certificate: Not found at expected location"
    fi
}

check_application() {
    print_step "Checking application health..."
    
    # Wait a bit for app to fully initialize
    sleep 5
    
    # Try to access health endpoint
    if docker exec 4ex-app wget --quiet --tries=1 --spider http://localhost:3000/health 2>/dev/null; then
        print_success "Application: Health check passed"
    else
        print_warning "Application: Health endpoint not responding"
    fi
    
    # Check if index.html exists
    if docker exec 4ex-app test -f /usr/share/nginx/html/index.html; then
        print_success "Application: Static files deployed"
    else
        print_error "Application: Static files missing"
        return 1
    fi
}

check_license() {
    print_step "Checking license configuration..."
    
    if [[ -f "${DEPLOYMENT_DIR}/.env" ]]; then
        if grep -q "VITE_LICENSE_KEY=" "${DEPLOYMENT_DIR}/.env"; then
            print_success "License: Configured"
        else
            print_warning "License: Not configured in .env"
        fi
    else
        print_error "License: .env file not found"
        return 1
    fi
}

check_firewall() {
    print_step "Checking firewall rules..."
    
    if command -v ufw &>/dev/null; then
        if ufw status | grep -q "Status: active"; then
            print_success "Firewall: Active"
            
            # Check if required ports are allowed
            if ufw status | grep -q "80/tcp.*ALLOW"; then
                print_success "Firewall: Port 80 allowed"
            else
                print_warning "Firewall: Port 80 not explicitly allowed"
            fi
            
            if ufw status | grep -q "443/tcp.*ALLOW"; then
                print_success "Firewall: Port 443 allowed"
            else
                print_warning "Firewall: Port 443 not explicitly allowed"
            fi
        else
            print_warning "Firewall: Inactive"
        fi
    else
        print_info "Firewall: UFW not installed"
    fi
}

check_disk_space() {
    print_step "Checking disk space..."
    
    local free_space=$(df -BG / | tail -1 | awk '{print $4}' | sed 's/G//')
    
    if [[ $free_space -gt 5 ]]; then
        print_success "Disk Space: ${free_space}GB available"
    elif [[ $free_space -gt 2 ]]; then
        print_warning "Disk Space: ${free_space}GB available (running low)"
    else
        print_error "Disk Space: ${free_space}GB available (critically low)"
    fi
}

generate_report() {
    local report_file="${DEPLOYMENT_DIR}/health-check-report.txt"
    
    cat > "$report_file" <<EOF
4EX Exchange Platform - Health Check Report
Generated: $(date)
Domain: ${DOMAIN}

Container Status:
$(docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | grep 4ex- || echo "No containers found")

Database Status:
$(docker exec 4ex-postgres psql -U exchange_user -d exchange_db -c "SELECT version();" 2>/dev/null || echo "Database not accessible")

Application Logs (last 20 lines):
$(docker logs --tail 20 4ex-app 2>&1 || echo "No logs available")

Nginx Logs (last 20 lines):
$(docker logs --tail 20 4ex-nginx 2>&1 || echo "No logs available")

Disk Usage:
$(df -h /)

Memory Usage:
$(free -h)

EOF
    
    print_success "Health check report saved to: $report_file"
}

# Main execution
main() {
    echo ""
    print_info "Running post-installation health checks..."
    echo ""
    
    local failed=0
    
    check_containers || failed=$((failed + 1))
    check_database || failed=$((failed + 1))
    check_application || failed=$((failed + 1))
    check_license || failed=$((failed + 1))
    check_http || failed=$((failed + 1))
    check_https || true  # Don't fail on HTTPS check
    check_ssl_certificate || true  # Don't fail on SSL check
    check_firewall || true  # Don't fail on firewall check
    check_disk_space || true  # Don't fail on disk space check
    
    generate_report
    
    echo ""
    
    if [[ $failed -eq 0 ]]; then
        print_success "✓ All critical health checks passed!"
        echo ""
        print_info "Your application is ready at: https://${DOMAIN}"
    else
        print_warning "⚠ Some health checks failed (${failed} issues found)"
        print_info "Please review the issues above and the health check report."
    fi
    
    echo ""
    
    return $failed
}

main "$@"
