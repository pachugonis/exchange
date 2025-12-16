#!/bin/bash

#############################################################################
# Prerequisites Check Script
# Validates system requirements before installation
#############################################################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && cd .. && pwd)"
source "${SCRIPT_DIR}/utils/messages.sh"
source "${SCRIPT_DIR}/utils/helpers.sh"

# Minimum requirements
MIN_RAM_GB=2
MIN_DISK_GB=10
REQUIRED_PORTS=(80 443)

check_os() {
    print_step "Checking operating system..."
    
    if [[ ! -f /etc/os-release ]]; then
        print_error "Cannot detect OS version"
        return 1
    fi
    
    source /etc/os-release
    
    if [[ "$ID" != "ubuntu" ]]; then
        print_warning "This script is designed for Ubuntu. Detected: $ID"
        print_warning "Installation may work but is not officially supported."
        
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            return 1
        fi
    fi
    
    if [[ "$VERSION_ID" != "24.04" ]]; then
        print_warning "Ubuntu 24.04 recommended. Detected: $VERSION_ID"
    fi
    
    print_success "OS check passed: $PRETTY_NAME"
}

check_resources() {
    print_step "Checking system resources..."
    
    # Check RAM
    local total_ram_kb=$(grep MemTotal /proc/meminfo | awk '{print $2}')
    local total_ram_gb=$((total_ram_kb / 1024 / 1024))
    
    if [[ $total_ram_gb -lt $MIN_RAM_GB ]]; then
        print_error "Insufficient RAM: ${total_ram_gb}GB (minimum ${MIN_RAM_GB}GB required)"
        return 1
    fi
    print_success "RAM: ${total_ram_gb}GB available"
    
    # Check disk space
    local free_disk_gb=$(df -BG / | tail -1 | awk '{print $4}' | sed 's/G//')
    
    if [[ $free_disk_gb -lt $MIN_DISK_GB ]]; then
        print_error "Insufficient disk space: ${free_disk_gb}GB (minimum ${MIN_DISK_GB}GB required)"
        return 1
    fi
    print_success "Disk space: ${free_disk_gb}GB available"
}

check_network() {
    print_step "Checking network connectivity..."
    
    # Check internet connection
    if ! ping -c 1 -W 5 8.8.8.8 &>/dev/null; then
        print_error "No internet connectivity detected"
        return 1
    fi
    print_success "Internet connectivity: OK"
    
    # Check DNS resolution
    if ! nslookup google.com &>/dev/null; then
        print_warning "DNS resolution may have issues"
    else
        print_success "DNS resolution: OK"
    fi
}

check_ports() {
    print_step "Checking required ports..."
    
    for port in "${REQUIRED_PORTS[@]}"; do
        if ss -tuln | grep -q ":${port} "; then
            print_error "Port ${port} is already in use"
            
            # Try to identify the process
            local process=$(ss -tlnp | grep ":${port} " | awk '{print $NF}' | head -1)
            if [[ -n "$process" ]]; then
                print_warning "Process using port ${port}: ${process}"
            fi
            
            return 1
        else
            print_success "Port ${port}: Available"
        fi
    done
}

check_permissions() {
    print_step "Checking permissions..."
    
    if [[ $EUID -ne 0 ]]; then
        print_error "This script must be run as root"
        print_info "Please run: sudo bash install.sh"
        return 1
    fi
    
    print_success "Running with root privileges"
}

check_dependencies() {
    print_step "Checking required commands..."
    
    local missing_deps=()
    
    # Check for essential commands
    for cmd in curl wget git; do
        if ! command -v "$cmd" &>/dev/null; then
            missing_deps+=("$cmd")
        fi
    done
    
    if [[ ${#missing_deps[@]} -gt 0 ]]; then
        print_warning "Missing dependencies: ${missing_deps[*]}"
        print_info "Installing missing dependencies..."
        
        apt-get update -qq
        apt-get install -y "${missing_deps[@]}" || return 1
        
        print_success "Dependencies installed"
    else
        print_success "All required commands available"
    fi
}

# Main execution
main() {
    echo ""
    print_info "Starting prerequisites check..."
    echo ""
    
    check_permissions || exit 1
    check_os || exit 1
    check_resources || exit 1
    check_network || exit 1
    check_ports || exit 1
    check_dependencies || exit 1
    
    echo ""
    print_success "✓ All prerequisites checks passed!"
    echo ""
}

main "$@"
