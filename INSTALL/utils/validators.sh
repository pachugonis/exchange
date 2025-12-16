#!/bin/bash

#############################################################################
# Validation Functions
# Input validation utilities
#############################################################################

# Validate domain name
validate_domain() {
    local domain=$1
    
    # Check if empty
    if [[ -z "$domain" ]]; then
        return 1
    fi
    
    # Check domain format (basic regex)
    if [[ ! "$domain" =~ ^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$ ]]; then
        return 1
    fi
    
    # Check length
    if [[ ${#domain} -gt 253 ]]; then
        return 1
    fi
    
    return 0
}

# Validate email
validate_email() {
    local email=$1
    
    # Check if empty
    if [[ -z "$email" ]]; then
        return 1
    fi
    
    # Check email format
    if [[ ! "$email" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
        return 1
    fi
    
    return 0
}

# Validate password strength
validate_password() {
    local password=$1
    
    # Check minimum length
    if [[ ${#password} -lt 12 ]]; then
        echo "Password must be at least 12 characters long"
        return 1
    fi
    
    # Check for uppercase letter
    if [[ ! "$password" =~ [A-Z] ]]; then
        echo "Password must contain at least one uppercase letter"
        return 1
    fi
    
    # Check for lowercase letter
    if [[ ! "$password" =~ [a-z] ]]; then
        echo "Password must contain at least one lowercase letter"
        return 1
    fi
    
    # Check for number
    if [[ ! "$password" =~ [0-9] ]]; then
        echo "Password must contain at least one number"
        return 1
    fi
    
    # Check for special character
    if [[ ! "$password" =~ [^a-zA-Z0-9] ]]; then
        echo "Password must contain at least one special character"
        return 1
    fi
    
    return 0
}

# Validate license key format
validate_license_key() {
    local license=$1
    
    # Check if empty
    if [[ -z "$license" ]]; then
        return 1
    fi
    
    # Check format: LIC-XXXX-XXXX-XXXX-XXXX
    if [[ ! "$license" =~ ^LIC-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$ ]]; then
        return 1
    fi
    
    return 0
}

# Validate port number
validate_port() {
    local port=$1
    
    # Check if number
    if [[ ! "$port" =~ ^[0-9]+$ ]]; then
        return 1
    fi
    
    # Check range (1024-65535 for non-privileged ports, but we allow 80/443 for root)
    if [[ $port -lt 1 ]] || [[ $port -gt 65535 ]]; then
        return 1
    fi
    
    return 0
}

# Validate IP address
validate_ip() {
    local ip=$1
    
    # IPv4 validation
    if [[ "$ip" =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ ]]; then
        # Check each octet
        IFS='.' read -ra ADDR <<< "$ip"
        for i in "${ADDR[@]}"; do
            if [[ $i -gt 255 ]]; then
                return 1
            fi
        done
        return 0
    fi
    
    return 1
}

# Validate URL
validate_url() {
    local url=$1
    
    if [[ ! "$url" =~ ^https?://[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(/.*)?$ ]]; then
        return 1
    fi
    
    return 0
}

# Validate yes/no input
validate_yes_no() {
    local input=$1
    
    if [[ "$input" =~ ^[YyNn]$ ]]; then
        return 0
    fi
    
    return 1
}

# Validate path exists
validate_path_exists() {
    local path=$1
    
    if [[ -e "$path" ]]; then
        return 0
    fi
    
    return 1
}

# Validate file is readable
validate_file_readable() {
    local file=$1
    
    if [[ -r "$file" ]]; then
        return 0
    fi
    
    return 1
}

# Validate directory is writable
validate_dir_writable() {
    local dir=$1
    
    if [[ -w "$dir" ]]; then
        return 0
    fi
    
    return 1
}

# Validate string length
validate_length() {
    local string=$1
    local min=$2
    local max=$3
    
    local length=${#string}
    
    if [[ $length -lt $min ]] || [[ $length -gt $max ]]; then
        return 1
    fi
    
    return 0
}

# Validate alphanumeric
validate_alphanumeric() {
    local string=$1
    
    if [[ ! "$string" =~ ^[a-zA-Z0-9]+$ ]]; then
        return 1
    fi
    
    return 0
}

# Validate numeric
validate_numeric() {
    local string=$1
    
    if [[ ! "$string" =~ ^[0-9]+$ ]]; then
        return 1
    fi
    
    return 0
}

# Validate disk space (in GB)
validate_disk_space() {
    local required_gb=$1
    local path=${2:-/}
    
    local available_gb=$(df -BG "$path" | tail -1 | awk '{print $4}' | sed 's/G//')
    
    if [[ $available_gb -lt $required_gb ]]; then
        return 1
    fi
    
    return 0
}

# Validate RAM (in GB)
validate_ram() {
    local required_gb=$1
    
    local total_ram_kb=$(grep MemTotal /proc/meminfo | awk '{print $2}')
    local total_ram_gb=$((total_ram_kb / 1024 / 1024))
    
    if [[ $total_ram_gb -lt $required_gb ]]; then
        return 1
    fi
    
    return 0
}
