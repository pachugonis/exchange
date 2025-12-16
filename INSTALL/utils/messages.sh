#!/bin/bash

#############################################################################
# Message Utilities
# Colored output and formatted messages
#############################################################################

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Print functions
print_success() {
    echo -e "${GREEN}✓${NC} $*"
}

print_error() {
    echo -e "${RED}✗${NC} $*"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $*"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $*"
}

print_step() {
    echo -e "${CYAN}▶${NC} $*"
}

print_section() {
    echo ""
    echo -e "${MAGENTA}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${MAGENTA} $*${NC}"
    echo -e "${MAGENTA}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
}

print_phase() {
    clear
    echo ""
    echo -e "${CYAN}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}                                                               ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}  ${GREEN}$*${NC}$(printf "%$((59 - ${#1}))s")${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}                                                               ${CYAN}║${NC}"
    echo -e "${CYAN}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

show_banner() {
    echo -e "${CYAN}"
    cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║    ██╗  ██╗███████╗██╗  ██╗    ███████╗██╗  ██╗             ║
║    ██║  ██║██╔════╝╚██╗██╔╝    ██╔════╝╚██╗██╔╝             ║
║    ███████║█████╗   ╚███╔╝     █████╗   ╚███╔╝              ║
║    ╚════██║██╔══╝   ██╔██╗     ██╔══╝   ██╔██╗              ║
║         ██║███████╗██╔╝ ██╗    ███████╗██╔╝ ██╗             ║
║         ╚═╝╚══════╝╚═╝  ╚═╝    ╚══════╝╚═╝  ╚═╝             ║
║                                                               ║
║            Exchange Platform - Automated Installer           ║
║                       Version 1.0.0                          ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
}

progress_bar() {
    local duration=$1
    local steps=50
    local step_duration=$(echo "scale=2; $duration / $steps" | bc)
    
    echo -n "["
    for ((i=0; i<steps; i++)); do
        echo -n "="
        sleep $step_duration
    done
    echo "] Done!"
}
#!/bin/bash

#############################################################################
# Message Utilities
# Colored output and formatted messages
#############################################################################

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Print functions
print_success() {
    echo -e "${GREEN}✓${NC} $*"
}

print_error() {
    echo -e "${RED}✗${NC} $*"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $*"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $*"
}

print_step() {
    echo -e "${CYAN}▶${NC} $*"
}

print_section() {
    echo ""
    echo -e "${MAGENTA}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${MAGENTA} $*${NC}"
    echo -e "${MAGENTA}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
}

print_phase() {
    clear
    echo ""
    echo -e "${CYAN}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}                                                               ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}  ${GREEN}$*${NC}$(printf "%$((59 - ${#1}))s")${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}                                                               ${CYAN}║${NC}"
    echo -e "${CYAN}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

show_banner() {
    echo -e "${CYAN}"
    cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║    ██╗  ██╗███████╗██╗  ██╗    ███████╗██╗  ██╗             ║
║    ██║  ██║██╔════╝╚██╗██╔╝    ██╔════╝╚██╗██╔╝             ║
║    ███████║█████╗   ╚███╔╝     █████╗   ╚███╔╝              ║
║    ╚════██║██╔══╝   ██╔██╗     ██╔══╝   ██╔██╗              ║
║         ██║███████╗██╔╝ ██╗    ███████╗██╔╝ ██╗             ║
║         ╚═╝╚══════╝╚═╝  ╚═╝    ╚══════╝╚═╝  ╚═╝             ║
║                                                               ║
║            Exchange Platform - Automated Installer           ║
║                       Version 1.0.0                          ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
}

progress_bar() {
    local duration=$1
    local steps=50
    local step_duration=$(echo "scale=2; $duration / $steps" | bc)
    
    echo -n "["
    for ((i=0; i<steps; i++)); do
        echo -n "="
        sleep $step_duration
    done
    echo "] Done!"
}
