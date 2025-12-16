#!/bin/bash

#############################################################################
# Docker Setup Script
# Installs Docker and Docker Compose
#############################################################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && cd .. && pwd)"
source "${SCRIPT_DIR}/utils/messages.sh"
source "${SCRIPT_DIR}/utils/helpers.sh"

install_docker() {
    print_step "Installing Docker..."
    
    # Check if Docker is already installed
    if command -v docker &>/dev/null; then
        local docker_version=$(docker --version | awk '{print $3}' | sed 's/,//')
        print_info "Docker is already installed (version $docker_version)"
        
        # Check if it's running
        if systemctl is-active --quiet docker; then
            print_success "Docker service is running"
            return 0
        else
            print_info "Starting Docker service..."
            systemctl start docker
            systemctl enable docker
            print_success "Docker service started"
            return 0
        fi
    fi
    
    print_info "Docker not found. Installing..."
    
    # Update package index
    apt-get update -qq
    
    # Install prerequisites
    apt-get install -y \
        ca-certificates \
        curl \
        gnupg \
        lsb-release
    
    # Add Docker's official GPG key
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    
    # Set up the repository
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker Engine
    apt-get update -qq
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # Start and enable Docker
    systemctl start docker
    systemctl enable docker
    
    # Verify installation
    docker --version
    
    print_success "Docker installed successfully"
}

configure_docker() {
    print_step "Configuring Docker..."
    
    # Create Docker daemon configuration
    mkdir -p /etc/docker
    
    cat > /etc/docker/daemon.json <<EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2"
}
EOF
    
    # Restart Docker to apply configuration
    systemctl restart docker
    
    print_success "Docker configured"
}

setup_firewall() {
    print_step "Configuring firewall..."
    
    # Check if UFW is installed
    if ! command -v ufw &>/dev/null; then
        print_info "Installing UFW..."
        apt-get install -y ufw
    fi
    
    # Configure UFW rules
    ufw --force enable
    ufw default deny incoming
    ufw default allow outgoing
    
    # Allow SSH
    ufw allow 22/tcp comment 'SSH'
    
    # Allow HTTP and HTTPS
    ufw allow 80/tcp comment 'HTTP'
    ufw allow 443/tcp comment 'HTTPS'
    
    # Reload firewall
    ufw --force reload
    
    print_success "Firewall configured"
}

test_docker() {
    print_step "Testing Docker installation..."
    
    # Run hello-world container
    if docker run --rm hello-world &>/dev/null; then
        print_success "Docker test passed"
    else
        print_error "Docker test failed"
        return 1
    fi
    
    # Check Docker Compose
    if docker compose version &>/dev/null; then
        local compose_version=$(docker compose version | awk '{print $4}')
        print_success "Docker Compose installed (version $compose_version)"
    else
        print_error "Docker Compose not available"
        return 1
    fi
}

# Main execution
main() {
    echo ""
    print_info "Setting up Docker environment..."
    echo ""
    
    install_docker
    configure_docker
    setup_firewall
    test_docker
    
    echo ""
    print_success "✓ Docker setup complete!"
    echo ""
}

main "$@"
#!/bin/bash

#############################################################################
# Docker Setup Script
# Installs Docker and Docker Compose
#############################################################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && cd .. && pwd)"
source "${SCRIPT_DIR}/utils/messages.sh"
source "${SCRIPT_DIR}/utils/helpers.sh"

install_docker() {
    print_step "Installing Docker..."
    
    # Check if Docker is already installed
    if command -v docker &>/dev/null; then
        local docker_version=$(docker --version | awk '{print $3}' | sed 's/,//')
        print_info "Docker is already installed (version $docker_version)"
        
        # Check if it's running
        if systemctl is-active --quiet docker; then
            print_success "Docker service is running"
            return 0
        else
            print_info "Starting Docker service..."
            systemctl start docker
            systemctl enable docker
            print_success "Docker service started"
            return 0
        fi
    fi
    
    print_info "Docker not found. Installing..."
    
    # Update package index
    apt-get update -qq
    
    # Install prerequisites
    apt-get install -y \
        ca-certificates \
        curl \
        gnupg \
        lsb-release
    
    # Add Docker's official GPG key
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    
    # Set up the repository
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker Engine
    apt-get update -qq
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # Start and enable Docker
    systemctl start docker
    systemctl enable docker
    
    # Verify installation
    docker --version
    
    print_success "Docker installed successfully"
}

configure_docker() {
    print_step "Configuring Docker..."
    
    # Create Docker daemon configuration
    mkdir -p /etc/docker
    
    cat > /etc/docker/daemon.json <<EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2"
}
EOF
    
    # Restart Docker to apply configuration
    systemctl restart docker
    
    print_success "Docker configured"
}

setup_firewall() {
    print_step "Configuring firewall..."
    
    # Check if UFW is installed
    if ! command -v ufw &>/dev/null; then
        print_info "Installing UFW..."
        apt-get install -y ufw
    fi
    
    # Configure UFW rules
    ufw --force enable
    ufw default deny incoming
    ufw default allow outgoing
    
    # Allow SSH
    ufw allow 22/tcp comment 'SSH'
    
    # Allow HTTP and HTTPS
    ufw allow 80/tcp comment 'HTTP'
    ufw allow 443/tcp comment 'HTTPS'
    
    # Reload firewall
    ufw --force reload
    
    print_success "Firewall configured"
}

test_docker() {
    print_step "Testing Docker installation..."
    
    # Run hello-world container
    if docker run --rm hello-world &>/dev/null; then
        print_success "Docker test passed"
    else
        print_error "Docker test failed"
        return 1
    fi
    
    # Check Docker Compose
    if docker compose version &>/dev/null; then
        local compose_version=$(docker compose version | awk '{print $4}')
        print_success "Docker Compose installed (version $compose_version)"
    else
        print_error "Docker Compose not available"
        return 1
    fi
}

# Main execution
main() {
    echo ""
    print_info "Setting up Docker environment..."
    echo ""
    
    install_docker
    configure_docker
    setup_firewall
    test_docker
    
    echo ""
    print_success "✓ Docker setup complete!"
    echo ""
}

main "$@"
