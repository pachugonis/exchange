#!/bin/bash

#############################################################################
# Update Script for ExchangeKit
# Updates the application to the latest version
#############################################################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && cd .. && pwd)"
source "${SCRIPT_DIR}/utils/messages.sh"
source "${SCRIPT_DIR}/utils/helpers.sh"
source "${SCRIPT_DIR}/utils/translations.sh"

DEPLOYMENT_DIR="/opt/exchangekit"
BACKUP_DIR="/opt/exchangekit-backups"
UPDATE_PACKAGE="${1:-}"

# Check if LANG_CODE is not set, offer language selection
if [ -z "${LANG_CODE:-}" ] && [ -z "${UPDATE_SKIP_LANG:-}" ]; then
    select_language
fi

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_error "$(t 'must_run_as_root')"
   exit 1
fi

print_header() {
    echo ""
    echo "═══════════════════════════════════════════════════════"
    echo "   $(t 'update_title')"
    echo "═══════════════════════════════════════════════════════"
    echo ""
}

check_current_installation() {
    print_step "$(t 'checking_installation')"
    
    if [ ! -d "$DEPLOYMENT_DIR" ]; then
        print_error "$(t 'installation_not_found') in $DEPLOYMENT_DIR"
        exit 1
    fi
    
    if [ ! -f "$DEPLOYMENT_DIR/.env" ]; then
        print_error "$(t 'config_not_found')"
        exit 1
    fi
    
    print_success "$(t 'installation_found')"
}

create_backup() {
    print_step "$(t 'creating_backup')"
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_path="${BACKUP_DIR}/backup_${timestamp}"
    
    mkdir -p "$BACKUP_DIR"
    
    # Backup important files and directories
    mkdir -p "$backup_path"
    
    # Backup .env and configuration files
    if [ -f "$DEPLOYMENT_DIR/.env" ]; then
        cp "$DEPLOYMENT_DIR/.env" "$backup_path/"
    fi
    
    if [ -f "$DEPLOYMENT_DIR/.admin-config.json" ]; then
        cp "$DEPLOYMENT_DIR/.admin-config.json" "$backup_path/"
    fi
    
    if [ -f "$DEPLOYMENT_DIR/.admin-storage-init.json" ]; then
        cp "$DEPLOYMENT_DIR/.admin-storage-init.json" "$backup_path/"
    fi
    
    # Backup license data if exists
    if [ -f "$DEPLOYMENT_DIR/license-database.json" ]; then
        cp "$DEPLOYMENT_DIR/license-database.json" "$backup_path/"
    fi
    
    # Backup docker-compose.yml
    if [ -f "$DEPLOYMENT_DIR/docker-compose.yml" ]; then
        cp "$DEPLOYMENT_DIR/docker-compose.yml" "$backup_path/"
    fi
    
    # Backup nginx config
    if [ -f "$DEPLOYMENT_DIR/nginx.conf" ]; then
        cp "$DEPLOYMENT_DIR/nginx.conf" "$backup_path/"
    fi
    
    print_success "$(t 'backup_created'): $backup_path"
    echo "$backup_path" > /tmp/exchangekit_last_backup
}

stop_services() {
    print_step "$(t 'stopping_services')"
    
    cd "$DEPLOYMENT_DIR"
    
    if docker compose ps | grep -q "Up"; then
        docker compose down
        print_success "$(t 'services_stopped')"
    else
        print_info "$(t 'services_not_running')"
    fi
}

update_application() {
    print_step "$(t 'updating_files')"
    
    if [ -n "$UPDATE_PACKAGE" ] && [ -f "$UPDATE_PACKAGE" ]; then
        # Update from provided package
        print_info "$(t 'extracting_package'): $UPDATE_PACKAGE"
        
        # Extract to temporary directory
        local temp_dir=$(mktemp -d)
        tar -xzf "$UPDATE_PACKAGE" -C "$temp_dir"
        
        # Update app directory
        if [ -d "$temp_dir/app" ]; then
            rm -rf "$DEPLOYMENT_DIR/app"
            cp -r "$temp_dir/app" "$DEPLOYMENT_DIR/"
        fi
        
        # Update config files (preserve existing if not in package)
        if [ -d "$temp_dir/config" ]; then
            if [ -f "$temp_dir/config/docker-compose.yml" ]; then
                cp "$temp_dir/config/docker-compose.yml" "$DEPLOYMENT_DIR/"
            fi
            if [ -f "$temp_dir/config/Dockerfile" ]; then
                cp "$temp_dir/config/Dockerfile" "$DEPLOYMENT_DIR/"
            fi
        fi
        
        # Update scripts
        if [ -d "$temp_dir/scripts" ]; then
            cp -r "$temp_dir/scripts" "$DEPLOYMENT_DIR/"
        fi
        
        rm -rf "$temp_dir"
        
    else
        # Update from Git repository (if configured)
        if [ -d "$DEPLOYMENT_DIR/.git" ]; then
            print_info "$(t 'pulling_from_git')"
            cd "$DEPLOYMENT_DIR"
            git pull
        else
            print_error "$(t 'no_update_source')"
            print_info "$(t 'update_usage')"
            exit 1
        fi
    fi
    
    print_success "$(t 'files_updated')"
}

rebuild_containers() {
    print_step "$(t 'rebuilding_containers')"
    
    cd "$DEPLOYMENT_DIR"
    
    # Rebuild with no cache to ensure latest changes
    docker compose build --no-cache
    
    print_success "$(t 'containers_rebuilt')"
}

migrate_database() {
    print_step "$(t 'checking_migrations')"
    
    # Check if migration script exists
    if [ -f "$DEPLOYMENT_DIR/scripts/migrate-database.sh" ]; then
        print_info "$(t 'running_migrations')"
        bash "$DEPLOYMENT_DIR/scripts/migrate-database.sh"
    else
        print_info "$(t 'no_migrations')"
    fi
}

start_services() {
    print_step "$(t 'starting_services')"
    
    cd "$DEPLOYMENT_DIR"
    docker compose up -d
    
    # Wait for services to be healthy
    sleep 5
    
    print_success "$(t 'services_started')"
}

verify_update() {
    print_step "$(t 'verifying_update')"
    
    cd "$DEPLOYMENT_DIR"
    
    # Check if containers are running
    if docker compose ps | grep -q "Up"; then
        print_success "$(t 'all_services_running')"
    else
        print_error "$(t 'services_failed')"
        print_info "$(t 'check_logs')"
        return 1
    fi
    
    # Check if app is responding
    sleep 3
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|301\|302"; then
        print_success "$(t 'app_responding')"
    else
        print_warning "$(t 'app_not_ready')"
        print_info "$(t 'check_status')"
    fi
}

cleanup_old_backups() {
    print_step "$(t 'cleaning_backups')"
    
    # Keep only last 5 backups
    if [ -d "$BACKUP_DIR" ]; then
        local backup_count=$(ls -1 "$BACKUP_DIR" | wc -l)
        if [ "$backup_count" -gt 5 ]; then
            ls -1t "$BACKUP_DIR" | tail -n +6 | xargs -I {} rm -rf "$BACKUP_DIR/{}"
            print_success "$(t 'backups_cleaned')"
        else
            print_info "$(t 'no_cleanup_needed')"
        fi
    fi
}

rollback() {
    print_error "$(t 'update_failed_rollback')"
    
    if [ -f /tmp/exchangekit_last_backup ]; then
        local backup_path=$(cat /tmp/exchangekit_last_backup)
        
        if [ -d "$backup_path" ]; then
            print_step "$(t 'restoring_backup'): $backup_path"
            
            # Restore configuration files
            if [ -f "$backup_path/.env" ]; then
                cp "$backup_path/.env" "$DEPLOYMENT_DIR/"
            fi
            
            if [ -f "$backup_path/.admin-config.json" ]; then
                cp "$backup_path/.admin-config.json" "$DEPLOYMENT_DIR/"
            fi
            
            if [ -f "$backup_path/.admin-storage-init.json" ]; then
                cp "$backup_path/.admin-storage-init.json" "$DEPLOYMENT_DIR/"
            fi
            
            if [ -f "$backup_path/docker-compose.yml" ]; then
                cp "$backup_path/docker-compose.yml" "$DEPLOYMENT_DIR/"
            fi
            
            # Restart services
            cd "$DEPLOYMENT_DIR"
            docker compose up -d
            
            print_success "$(t 'rollback_complete')"
        else
            print_error "$(t 'backup_not_found'): $backup_path"
        fi
    else
        print_error "$(t 'no_backup_info')"
    fi
}

show_update_info() {
    echo ""
    print_success "═══════════════════════════════════════════════════════"
    print_success "   $(t 'update_complete')"
    print_success "═══════════════════════════════════════════════════════"
    echo ""
    print_info "$(t 'application_url'): http://$(hostname -I | awk '{print $1}')"
    print_info "$(t 'admin_panel'): /admin/login"
    echo ""
    print_info "$(t 'useful_commands'):"
    print_info "  - $(t 'cmd_check_status'): docker compose ps"
    print_info "  - $(t 'cmd_view_logs'): docker compose logs -f"
    print_info "  - $(t 'cmd_restart_services'): docker compose restart"
    echo ""
    
    if [ -f /tmp/exchangekit_last_backup ]; then
        local backup_path=$(cat /tmp/exchangekit_last_backup)
        print_info "$(t 'backup_location'): $backup_path"
        echo ""
    fi
}

# Main execution
main() {
    print_header
    
    # Check current installation
    check_current_installation
    
    # Create backup
    create_backup
    
    # Stop services
    stop_services
    
    # Update application
    if update_application; then
        # Rebuild containers
        rebuild_containers
        
        # Run migrations if needed
        migrate_database
        
        # Start services
        start_services
        
        # Verify update
        if verify_update; then
            # Cleanup
            cleanup_old_backups
            
            # Show success message
            show_update_info
        else
            rollback
            exit 1
        fi
    else
        rollback
        exit 1
    fi
}

# Handle errors
trap 'rollback' ERR

main "$@"
