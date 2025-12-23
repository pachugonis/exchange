#!/bin/bash

#############################################################################
# ExchangeKit Update Wrapper
# Simple wrapper to run the update script
#############################################################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "ERROR: This script must be run as root (use sudo)"
   exit 1
fi

# Run the update script
bash "${SCRIPT_DIR}/scripts/update.sh" "$@"
