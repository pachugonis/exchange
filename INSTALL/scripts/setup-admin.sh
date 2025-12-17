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
    
    # First, check if users table exists
    if ! docker exec 4ex-postgres psql -U exchange_user -d exchange_db -t -c "SELECT to_regclass('public.users');" 2>/dev/null | grep -q users; then
        print_error "Users table does not exist. Running database setup first..."
        bash "${SCRIPT_DIR}/scripts/setup-database.sh" || {
            print_error "Failed to setup database"
            return 1
        }
    fi
    
    # Generate password hash (using bcrypt-compatible format)
    local password_hash=$(echo -n "$ADMIN_PASSWORD" | openssl passwd -6 -stdin)
    
    # Create SQL file for admin user
    cat > /tmp/create_admin.sql <<SQLEOF
INSERT INTO users (email, password_hash, role, is_active, email_verified)
VALUES ('${ADMIN_EMAIL}', '${password_hash}', 'admin', true, true)
ON CONFLICT (email) 
DO UPDATE SET 
    password_hash = EXCLUDED.password_hash,
    role = 'admin',
    is_active = true,
    email_verified = true,
    updated_at = CURRENT_TIMESTAMP;
SQLEOF

    # Execute SQL file
    if docker exec -i 4ex-postgres psql -U exchange_user -d exchange_db < /tmp/create_admin.sql; then
        print_success "Administrator account created"
    else
        print_error "Failed to create administrator account"
        cat /tmp/create_admin.sql
        rm -f /tmp/create_admin.sql
        return 1
    fi
    
    # Clean up
    rm -f /tmp/create_admin.sql
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
        "SELECT COUNT(*) FROM users WHERE email = '${ADMIN_EMAIL}' AND role = 'admin';" 2>&1)
    
    # Trim whitespace
    admin_exists=$(echo "$admin_exists" | tr -d '[:space:]')
    
    print_info "Debug: Query result = '$admin_exists'"
    
    if [[ "$admin_exists" =~ ^[0-9]+$ ]] && [[ $admin_exists -gt 0 ]]; then
        print_success "Administrator account verified in database"
    else
        print_error "Failed to verify administrator account"
        print_info "Listing all users in database:"
        docker exec 4ex-postgres psql -U exchange_user -d exchange_db -c "SELECT id, email, role FROM users;"
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
    print_success "Administrator account setup complete!"
    print_info "Email: ${ADMIN_EMAIL}"
    echo ""
}

main "$@"
