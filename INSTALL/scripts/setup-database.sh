#!/bin/bash

#############################################################################
# Database Setup Script
# Initializes PostgreSQL database
#############################################################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && cd .. && pwd)"
source "${SCRIPT_DIR}/utils/messages.sh"
source "${SCRIPT_DIR}/utils/helpers.sh"

DEPLOYMENT_DIR="/opt/exchangekit"

wait_for_postgres() {
    print_step "Waiting for PostgreSQL to be ready..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker exec exchangekit-postgres pg_isready -U exchange_user &>/dev/null; then
            print_success "PostgreSQL is ready"
            return 0
        fi
        
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "PostgreSQL failed to start"
    return 1
}

initialize_database() {
    print_step "Initializing database..."
    
    # Check if database exists
    if docker exec exchangekit-postgres psql -U exchange_user -lqt | cut -d \| -f 1 | grep -qw exchange_db; then
        print_info "Database already exists"
    else
        print_info "Creating database..."
        docker exec exchangekit-postgres createdb -U exchange_user exchange_db || true
    fi
    
    print_success "Database initialized"
}

create_tables() {
    print_step "Creating database schema..."
    
    # Create SQL schema file
    cat > /tmp/schema.sql <<'SQLEOF'
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    token VARCHAR(500) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(100) UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id),
    from_currency VARCHAR(20) NOT NULL,
    to_currency VARCHAR(20) NOT NULL,
    from_amount DECIMAL(20, 8) NOT NULL,
    to_amount DECIMAL(20, 8) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
SQLEOF

    # Execute SQL file
    print_info "Executing SQL schema..."
    if docker exec -i exchangekit-postgres psql -U exchange_user -d exchange_db < /tmp/schema.sql; then
        print_success "Database schema created"
    else
        print_error "Failed to create database schema"
        cat /tmp/schema.sql
        rm -f /tmp/schema.sql
        return 1
    fi
    
    # Clean up
    rm -f /tmp/schema.sql
}

verify_database() {
    print_step "Verifying database setup..."
    
    # Test database connection
    if docker exec exchangekit-postgres psql -U exchange_user -d exchange_db -c "SELECT 1;" &>/dev/null; then
        print_success "Database connection verified"
    else
        print_error "Database connection failed"
        return 1
    fi
    
    # Check tables
    local table_count=$(docker exec exchangekit-postgres psql -U exchange_user -d exchange_db -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
    print_info "Created $table_count tables"
}

# Main execution
main() {
    echo ""
    print_info "Setting up database..."
    echo ""
    
    wait_for_postgres
    initialize_database
    create_tables
    verify_database
    
        
    echo ""
    print_success "Database setup complete!"
    echo ""
}

main "$@"
