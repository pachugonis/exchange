#!/bin/bash

#############################################################################
# Create Update Package
# Packages the application for distribution as an update
#############################################################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
VERSION="${1:-$(date +%Y%m%d_%H%M%S)}"
OUTPUT_DIR="${PROJECT_ROOT}/dist/updates"
PACKAGE_NAME="exchangekit-update-${VERSION}.tar.gz"

echo "═══════════════════════════════════════════════════════"
echo "   Creating ExchangeKit Update Package"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "Version: $VERSION"
echo "Output: ${OUTPUT_DIR}/${PACKAGE_NAME}"
echo ""

# Create temporary directory for packaging
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# Create package structure
mkdir -p "$TEMP_DIR/app"
mkdir -p "$TEMP_DIR/config"
mkdir -p "$TEMP_DIR/scripts"

echo "[1/5] Copying application files..."
cp -r "$SCRIPT_DIR/app/"* "$TEMP_DIR/app/"

echo "[2/5] Copying configuration files..."
cp "$SCRIPT_DIR/config/Dockerfile" "$TEMP_DIR/config/"
cp "$SCRIPT_DIR/config/docker-compose.yml" "$TEMP_DIR/config/"
if [ -f "$SCRIPT_DIR/config/nginx.conf.template" ]; then
    cp "$SCRIPT_DIR/config/nginx.conf.template" "$TEMP_DIR/config/"
fi

echo "[3/5] Copying scripts..."
cp -r "$SCRIPT_DIR/scripts/"* "$TEMP_DIR/scripts/"
cp -r "$SCRIPT_DIR/utils" "$TEMP_DIR/"

echo "[4/5] Creating version info..."
cat > "$TEMP_DIR/VERSION" <<EOF
{
  "version": "$VERSION",
  "timestamp": "$(date -Iseconds)",
  "build": "$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')"
}
EOF

echo "[5/5] Creating package archive..."
mkdir -p "$OUTPUT_DIR"
cd "$TEMP_DIR"
tar -czf "${OUTPUT_DIR}/${PACKAGE_NAME}" .

echo ""
echo "═══════════════════════════════════════════════════════"
echo "   Update Package Created Successfully!"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "Package: ${OUTPUT_DIR}/${PACKAGE_NAME}"
echo "Size: $(du -h "${OUTPUT_DIR}/${PACKAGE_NAME}" | cut -f1)"
echo ""
echo "To apply this update on a server:"
echo "  1. Upload the package to the server"
echo "  2. Run: sudo bash /opt/exchangekit/scripts/update.sh <path-to-package>"
echo ""
