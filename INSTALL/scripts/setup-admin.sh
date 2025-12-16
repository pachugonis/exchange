#!/bin/bash

#############################################################################
# Admin Account Setup Script
# Creates initial administrator account
#############################################################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && cd .. && pwd)"
source "${SCRIPT_DIR}/utils/messages.sh"
source "${SCRIPT_DIR}/utils/helpers.sh"

ADMIN_EMAIL="$1"
ADMIN_PASSWORD="$2"
DEPLOYMENT_DIR="/opt/4ex-exchange"

if [[ -z "$ADMIN_EMAIL" ]] || [[ -z "$ADMIN_PASSWORD" ]]; then
    echo "Usage: $0 <email> <password>"
    exit 1
fi

create_admin_user() {
    print_step "Creating administrator account..."
    
    # Generate password hash (using bcrypt-compatible format)
    local password_hash=$(echo -n "$ADMIN_PASSWORD" | openssl passwd -6 -stdin)
    
    # Insert admin user into database
    docker exec 4ex-postgres psql -U exchange_user -d exchange_db <<EOF
-- Insert admin user (or update if exists)
INSERT INTO users (email, password_hash, role, is_active, email_verified)
VALUES ('${ADMIN_EMAIL}', '${password_hash}', 'admin', true, true)
ON CONFLICT (email) 
DO UPDATE SET 
    password_hash = EXCLUDED.password_hash,
    role = 'admin',
    is_active = true,
    email_verified = true,
    updated_at = CURRENT_TIMESTAMP;
EOF
    
    print_success "Administrator account created"
}

create_admin_config() {
    print_step "Creating admin configuration file..."
    
    # Create admin config in deployment directory
    cat > "${DEPLOYMENT_DIR}/.admin-config.json" <<EOF
{
  "admin": {
    "email": "${ADMIN_EMAIL}",
    "role": "admin",
    "createdAt": "$(date -Iseconds)",
    "permissions": [
      "manage_users",
      "manage_orders",
      "manage_currencies",
      "manage_settings",
      "view_analytics",
      "manage_licenses"
    ]
  }
}
EOF
    
    chmod 600 "${DEPLOYMENT_DIR}/.admin-config.json"
    print_success "Admin configuration saved"
}

verify_admin() {
    print_step "Verifying administrator account..."
    
    # Check if admin user exists in database
    local admin_exists=$(docker exec 4ex-postgres psql -U exchange_user -d exchange_db -t -c \
        "SELECT COUNT(*) FROM users WHERE email = '${ADMIN_EMAIL}' AND role = 'admin';")
    
    if [[ $admin_exists -gt 0 ]]; then
        print_success "Administrator account verified in database"
    else
        print_error "Failed to verify administrator account"
        return 1
    fi
}

# Main execution
main() {
    echo ""
    print_info "Setting up administrator account..."
    echo ""
    
    create_admin_user
    create_admin_config
    verify_admin
    
    echo ""
    print_success "✓ Administrator account setup complete!"
    print_info "Email: ${ADMIN_EMAIL}"
    echo ""
}

main "$@"
