#!/bin/bash

#############################################################################
# Helper Functions
# Common utility functions
#############################################################################

# Generate random password
generate_password() {
    local length=${1:-32}
    tr -dc 'A-Za-z0-9!@#$%^&*()_+-=' < /dev/urandom | head -c "$length"
}

# Generate random string
generate_random_string() {
    local length=${1:-16}
    tr -dc 'A-Za-z0-9' < /dev/urandom | head -c "$length"
}

# Check if command exists
command_exists() {
    command -v "$1" &>/dev/null
}

# Wait for service to be ready
wait_for_service() {
    local service=$1
    local max_attempts=${2:-30}
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if systemctl is-active --quiet "$service"; then
            return 0
        fi
        sleep 2
        attempt=$((attempt + 1))
    done
    
    return 1
}

# Wait for port to be open
wait_for_port() {
    local port=$1
    local max_attempts=${2:-30}
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if nc -z localhost "$port" 2>/dev/null; then
            return 0
        fi
        sleep 2
        attempt=$((attempt + 1))
    done
    
    return 1
}

# Get server IP
get_server_ip() {
    # Try multiple methods to get public IP
    local ip=""
    
    ip=$(curl -s -4 ifconfig.me 2>/dev/null)
    if [[ -z "$ip" ]]; then
        ip=$(curl -s -4 icanhazip.com 2>/dev/null)
    fi
    if [[ -z "$ip" ]]; then
        ip=$(curl -s -4 ipinfo.io/ip 2>/dev/null)
    fi
    if [[ -z "$ip" ]]; then
        ip=$(hostname -I | awk '{print $1}')
    fi
    
    echo "$ip"
}

# Check if running in Docker
is_docker() {
    if [[ -f /.dockerenv ]] || grep -q docker /proc/1/cgroup 2>/dev/null; then
        return 0
    fi
    return 1
}

# Get system info
get_system_info() {
    echo "OS: $(lsb_release -ds 2>/dev/null || cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2)"
    echo "Kernel: $(uname -r)"
    echo "Architecture: $(uname -m)"
    echo "CPU: $(grep -m1 'model name' /proc/cpuinfo | cut -d: -f2 | xargs)"
    echo "RAM: $(free -h | awk '/^Mem:/ {print $2}')"
    echo "Disk: $(df -h / | awk 'NR==2 {print $2}')"
}

# Create backup
create_backup() {
    local source=$1
    local backup_dir=${2:-/var/backups/4ex}
    
    mkdir -p "$backup_dir"
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="${backup_dir}/backup_${timestamp}.tar.gz"
    
    tar -czf "$backup_file" -C "$(dirname "$source")" "$(basename "$source")" 2>/dev/null
    
    echo "$backup_file"
}

# Sanitize string for use in filenames
sanitize_filename() {
    echo "$1" | tr -cd '[:alnum:]._-'
}

# Check if port is in use
is_port_in_use() {
    local port=$1
    
    if ss -tuln | grep -q ":${port} "; then
        return 0
    fi
    return 1
}

# Get process using port
get_port_process() {
    local port=$1
    ss -tlnp | grep ":${port} " | awk '{print $NF}' | head -1
}

# Calculate file hash
calculate_hash() {
    local file=$1
    local algorithm=${2:-sha256}
    
    "${algorithm}sum" "$file" 2>/dev/null | awk '{print $1}'
}

# Convert bytes to human readable
bytes_to_human() {
    local bytes=$1
    
    if [[ $bytes -lt 1024 ]]; then
        echo "${bytes}B"
    elif [[ $bytes -lt 1048576 ]]; then
        echo "$((bytes / 1024))KB"
    elif [[ $bytes -lt 1073741824 ]]; then
        echo "$((bytes / 1048576))MB"
    else
        echo "$((bytes / 1073741824))GB"
    fi
}

# Retry command
retry_command() {
    local max_attempts=$1
    shift
    local command=("$@")
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if "${command[@]}"; then
            return 0
        fi
        
        echo "Attempt $attempt failed. Retrying..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    return 1
}

# Check internet connectivity
check_internet() {
    if ping -c 1 -W 5 8.8.8.8 &>/dev/null; then
        return 0
    fi
    return 1
}

# Get timestamp
get_timestamp() {
    date "+%Y-%m-%d %H:%M:%S"
}

# Log to file
log_to_file() {
    local logfile=$1
    shift
    local message="$*"
    
    echo "[$(get_timestamp)] $message" >> "$logfile"
}
#!/bin/bash

#############################################################################
# Helper Functions
# Common utility functions
#############################################################################

# Generate random password
generate_password() {
    local length=${1:-32}
    tr -dc 'A-Za-z0-9!@#$%^&*()_+-=' < /dev/urandom | head -c "$length"
}

# Generate random string
generate_random_string() {
    local length=${1:-16}
    tr -dc 'A-Za-z0-9' < /dev/urandom | head -c "$length"
}

# Check if command exists
command_exists() {
    command -v "$1" &>/dev/null
}

# Wait for service to be ready
wait_for_service() {
    local service=$1
    local max_attempts=${2:-30}
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if systemctl is-active --quiet "$service"; then
            return 0
        fi
        sleep 2
        attempt=$((attempt + 1))
    done
    
    return 1
}

# Wait for port to be open
wait_for_port() {
    local port=$1
    local max_attempts=${2:-30}
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if nc -z localhost "$port" 2>/dev/null; then
            return 0
        fi
        sleep 2
        attempt=$((attempt + 1))
    done
    
    return 1
}

# Get server IP
get_server_ip() {
    # Try multiple methods to get public IP
    local ip=""
    
    ip=$(curl -s -4 ifconfig.me 2>/dev/null)
    if [[ -z "$ip" ]]; then
        ip=$(curl -s -4 icanhazip.com 2>/dev/null)
    fi
    if [[ -z "$ip" ]]; then
        ip=$(curl -s -4 ipinfo.io/ip 2>/dev/null)
    fi
    if [[ -z "$ip" ]]; then
        ip=$(hostname -I | awk '{print $1}')
    fi
    
    echo "$ip"
}

# Check if running in Docker
is_docker() {
    if [[ -f /.dockerenv ]] || grep -q docker /proc/1/cgroup 2>/dev/null; then
        return 0
    fi
    return 1
}

# Get system info
get_system_info() {
    echo "OS: $(lsb_release -ds 2>/dev/null || cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2)"
    echo "Kernel: $(uname -r)"
    echo "Architecture: $(uname -m)"
    echo "CPU: $(grep -m1 'model name' /proc/cpuinfo | cut -d: -f2 | xargs)"
    echo "RAM: $(free -h | awk '/^Mem:/ {print $2}')"
    echo "Disk: $(df -h / | awk 'NR==2 {print $2}')"
}

# Create backup
create_backup() {
    local source=$1
    local backup_dir=${2:-/var/backups/4ex}
    
    mkdir -p "$backup_dir"
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="${backup_dir}/backup_${timestamp}.tar.gz"
    
    tar -czf "$backup_file" -C "$(dirname "$source")" "$(basename "$source")" 2>/dev/null
    
    echo "$backup_file"
}

# Sanitize string for use in filenames
sanitize_filename() {
    echo "$1" | tr -cd '[:alnum:]._-'
}

# Check if port is in use
is_port_in_use() {
    local port=$1
    
    if ss -tuln | grep -q ":${port} "; then
        return 0
    fi
    return 1
}

# Get process using port
get_port_process() {
    local port=$1
    ss -tlnp | grep ":${port} " | awk '{print $NF}' | head -1
}

# Calculate file hash
calculate_hash() {
    local file=$1
    local algorithm=${2:-sha256}
    
    "${algorithm}sum" "$file" 2>/dev/null | awk '{print $1}'
}

# Convert bytes to human readable
bytes_to_human() {
    local bytes=$1
    
    if [[ $bytes -lt 1024 ]]; then
        echo "${bytes}B"
    elif [[ $bytes -lt 1048576 ]]; then
        echo "$((bytes / 1024))KB"
    elif [[ $bytes -lt 1073741824 ]]; then
        echo "$((bytes / 1048576))MB"
    else
        echo "$((bytes / 1073741824))GB"
    fi
}

# Retry command
retry_command() {
    local max_attempts=$1
    shift
    local command=("$@")
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if "${command[@]}"; then
            return 0
        fi
        
        echo "Attempt $attempt failed. Retrying..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    return 1
}

# Check internet connectivity
check_internet() {
    if ping -c 1 -W 5 8.8.8.8 &>/dev/null; then
        return 0
    fi
    return 1
}

# Get timestamp
get_timestamp() {
    date "+%Y-%m-%d %H:%M:%S"
}

# Log to file
log_to_file() {
    local logfile=$1
    shift
    local message="$*"
    
    echo "[$(get_timestamp)] $message" >> "$logfile"
}
