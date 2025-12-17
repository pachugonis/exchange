#!/bin/bash

#############################################################################
# Quick SSL Setup - Post-Installation Script
# Run this after main installation to enable HTTPS
#############################################################################

DEPLOYMENT_DIR="/opt/4ex-exchange"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  SSL Certificate Setup${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Read domain from .env or ask
if [[ -f "${DEPLOYMENT_DIR}/.env" ]]; then
    DOMAIN=$(grep "^DOMAIN=" "${DEPLOYMENT_DIR}/.env" | cut -d= -f2)
    ADMIN_EMAIL=$(grep "^ADMIN_EMAIL=" "${DEPLOYMENT_DIR}/.env" | cut -d= -f2)
fi

if [[ -z "$DOMAIN" ]]; then
    read -p "Enter your domain name: " DOMAIN
fi

if [[ -z "$ADMIN_EMAIL" ]]; then
    read -p "Enter your email for Let's Encrypt: " ADMIN_EMAIL
fi

echo ""
echo -e "${YELLOW}Domain:${NC} $DOMAIN"
echo -e "${YELLOW}Email:${NC} $ADMIN_EMAIL"
echo ""

read -p "Continue with SSL setup? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

# Run SSL setup script
cd /root/INSTALL
bash scripts/setup-ssl.sh "$DOMAIN" "$ADMIN_EMAIL"

if [[ $? -eq 0 ]]; then
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  SSL Setup Complete!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "Your site is now available at: ${GREEN}https://${DOMAIN}${NC}"
    echo ""
    echo "Verifying nginx status..."
    docker ps | grep 4ex-nginx
else
    echo ""
    echo -e "${RED}SSL setup failed. Please check the errors above.${NC}"
    echo ""
    echo "Common issues:"
    echo "  - Domain not pointing to this server"
    echo "  - Port 80 not accessible from internet"
    echo "  - Firewall blocking HTTP traffic"
    echo "  - Check nginx logs: docker logs 4ex-nginx"
    echo ""
fi
