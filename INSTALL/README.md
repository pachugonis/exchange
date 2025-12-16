# 4EX Exchange Platform - Installation Guide

## 🚀 One-Click Installation for Ubuntu 24.04

This installation package provides a fully automated deployment system for the 4EX Exchange Platform using Docker containerization.

## 📋 Prerequisites

### Server Requirements

**Minimum Specifications:**
- **Operating System:** Ubuntu 24.04 LTS (recommended fresh installation)
- **CPU:** 2 cores
- **RAM:** 2GB minimum, 4GB recommended
- **Disk Space:** 10GB minimum, 20GB recommended
- **Network:** Public IP address with stable internet connection

**Required Access:**
- Root user access or user with sudo privileges
- SSH access to the server
- Ports 22 (SSH), 80 (HTTP), and 443 (HTTPS) accessible from the internet

### Domain Requirements

**Before installation, ensure:**
- You have a domain name registered
- DNS A record points to your server's public IP address
- DNS changes have propagated (can take up to 24-48 hours)

You can verify DNS propagation:
```bash
nslookup your-domain.com
dig your-domain.com
```

### Information Needed

Have the following information ready before starting:

1. **Domain Name** - Your fully qualified domain name (e.g., exchange.example.com)
2. **Administrator Email** - Valid email address for SSL certificates and admin account
3. **Administrator Password** - Strong password (min 12 characters with uppercase, lowercase, number, and special character)
4. **License Key** - Your purchased license key (format: LIC-XXXX-XXXX-XXXX-XXXX)
5. **Database Password** - (Optional) Strong password for database or auto-generate

## 📦 Installation Package Contents

```
INSTALL/
├── install.sh                    # Main installation script
├── config/
│   ├── docker-compose.yml        # Docker services configuration
│   ├── Dockerfile                # Application container definition
│   ├── nginx.conf.template       # Nginx reverse proxy template
│   └── .env.template             # Environment variables template
├── scripts/
│   ├── check-prerequisites.sh    # System validation
│   ├── configure.sh              # Configuration wizard
│   ├── setup-docker.sh           # Docker installation
│   ├── setup-ssl.sh              # SSL certificate setup
│   ├── setup-database.sh         # Database initialization
│   ├── setup-admin.sh            # Admin account creation
│   └── health-check.sh           # Post-installation validation
├── utils/
│   ├── messages.sh               # Output formatting
│   ├── helpers.sh                # Utility functions
│   └── validators.sh             # Input validation
└── README.md                     # This file
```

## 🔧 Quick Start Installation

### Step 1: Upload Installation Package

Upload the entire `INSTALL` directory to your server:

```bash
# Using SCP from your local machine
scp -r INSTALL root@YOUR_SERVER_IP:/root/

# Or download directly on server
# (if you have the package hosted somewhere)
wget https://your-server.com/4ex-install.tar.gz
tar -xzf 4ex-install.tar.gz
```

### Step 2: Connect to Your Server

```bash
ssh root@YOUR_SERVER_IP
```

### Step 3: Run the Installer

```bash
cd /root/INSTALL
chmod +x install.sh scripts/*.sh utils/*.sh
sudo bash install.sh
```

### Step 4: Follow the Interactive Wizard

The installation wizard will guide you through:

1. **System prerequisites check** - Validates your server meets requirements
2. **Configuration collection** - Prompts for domain, email, passwords, license
3. **Docker installation** - Installs and configures Docker & Docker Compose
4. **Application deployment** - Builds and starts application containers
5. **SSL certificate generation** - Obtains Let's Encrypt certificate
6. **Database initialization** - Sets up PostgreSQL database
7. **License activation** - Configures and validates license
8. **Admin account creation** - Creates administrator user
9. **Health checks** - Validates successful installation

### Step 5: Access Your Application

Once installation completes, access your application at:

```
https://your-domain.com
```

Login credentials will be displayed at the end of installation and saved to:
```
/opt/4ex-exchange/.credentials
```

## ⚙️ Installation Phases

### Phase 1: Prerequisites Check

The installer validates:
- ✅ Ubuntu 24.04 operating system
- ✅ Minimum 2GB RAM available
- ✅ Minimum 10GB disk space
- ✅ Root/sudo permissions
- ✅ Internet connectivity
- ✅ Ports 80 and 443 available
- ✅ Required system packages

### Phase 2: Configuration Wizard

Interactive prompts collect:
- Domain name with DNS validation
- Administrator email address
- Strong administrator password
- Valid license key
- Database password (or auto-generate)
- Port configuration (default 80/443)

All inputs are validated before proceeding.

### Phase 3: System Preparation

Automated setup includes:
- Docker Engine installation
- Docker Compose plugin installation
- UFW firewall configuration
- System optimization
- Security hardening

### Phase 4: Application Deployment

Deployment process:
- Copies application files to `/opt/4ex-exchange`
- Generates production `.env` file
- Builds optimized Docker images
- Starts multi-container stack:
  - PostgreSQL 15 database
  - React application (Nginx)
  - Nginx reverse proxy

### Phase 5: SSL Certificate Setup

SSL configuration:
- Installs Certbot
- Obtains Let's Encrypt certificate
- Configures Nginx with SSL
- Sets up automatic renewal (cron job)
- Implements security best practices

### Phase 6: Database Initialization

Database setup:
- Creates PostgreSQL database
- Creates application schema
- Sets up tables and indexes
- Configures secure access

### Phase 7: License Activation

License configuration:
- Configures license key in environment
- Application validates on startup
- Binds license to domain
- Enables grace period for offline operation

### Phase 8: Post-Installation Validation

Health checks verify:
- ✅ All containers running
- ✅ Database connectivity
- ✅ Application responding
- ✅ HTTP/HTTPS endpoints
- ✅ SSL certificate valid
- ✅ License activated
- ✅ Admin account created

## 🛠️ Post-Installation

### First Steps

1. **Visit your application:**
   ```
   https://your-domain.com
   ```

2. **Login with admin credentials**
   - Email: (from installation)
   - Password: (from installation)

3. **Change your password immediately**
   - Go to Admin Settings → Security
   - Update password
   - Enable 2FA (recommended)

4. **Configure your platform**
   - Set up currencies and exchange rates
   - Configure payment methods
   - Customize site settings
   - Review security settings

5. **Secure your credentials file**
   ```bash
   # Read and save credentials
   cat /opt/4ex-exchange/.credentials
   
   # Then delete the file
   rm /opt/4ex-exchange/.credentials
   ```

### Service Management

All services are managed via Docker Compose:

```bash
cd /opt/4ex-exchange

# View status
docker compose ps

# View logs
docker compose logs -f

# Restart services
docker compose restart

# Stop services
docker compose stop

# Start services
docker compose start

# Rebuild and restart
docker compose up -d --build
```

### Individual Container Management

```bash
# View all containers
docker ps -a

# View specific container logs
docker logs 4ex-app
docker logs 4ex-postgres
docker logs 4ex-nginx

# Restart specific container
docker restart 4ex-app

# Execute command in container
docker exec -it 4ex-postgres psql -U exchange_user
```

### Database Access

```bash
# Connect to PostgreSQL
docker exec -it 4ex-postgres psql -U exchange_user -d exchange_db

# Create database backup
docker exec 4ex-postgres pg_dump -U exchange_user exchange_db > backup.sql

# Restore database
docker exec -i 4ex-postgres psql -U exchange_user -d exchange_db < backup.sql
```

### SSL Certificate Management

```bash
# Check certificate expiration
sudo certbot certificates

# Force renewal
sudo certbot renew --force-renewal

# View renewal cron job
crontab -l | grep renew-ssl
```

### Logs and Monitoring

```bash
# Application logs
docker logs -f 4ex-app

# Nginx access logs
docker logs -f 4ex-nginx

# Database logs
docker logs -f 4ex-postgres

# Installation log
cat /root/INSTALL/installation.log

# Health check report
cat /opt/4ex-exchange/health-check-report.txt
```

## 🔧 Configuration Files

### Environment Variables

Main configuration file: `/opt/4ex-exchange/.env`

```bash
# Edit configuration
nano /opt/4ex-exchange/.env

# After changes, restart services
cd /opt/4ex-exchange
docker compose restart
```

### Nginx Configuration

Nginx config: `/opt/4ex-exchange/nginx.conf`

```bash
# Edit Nginx config
nano /opt/4ex-exchange/nginx.conf

# Test configuration
docker exec 4ex-nginx nginx -t

# Reload Nginx
docker restart 4ex-nginx
```

### Docker Compose

Docker Compose file: `/opt/4ex-exchange/docker-compose.yml`

```bash
# Edit Docker Compose
nano /opt/4ex-exchange/docker-compose.yml

# Apply changes
cd /opt/4ex-exchange
docker compose up -d
```

## 🔒 Security Best Practices

### After Installation

1. **Change default passwords immediately**
2. **Enable two-factor authentication (2FA)**
3. **Keep credentials file secure and delete after saving**
4. **Regularly update system packages:**
   ```bash
   apt update && apt upgrade -y
   ```

5. **Monitor logs for suspicious activity**
6. **Set up automated backups**
7. **Review firewall rules:**
   ```bash
   ufw status
   ```

### SSL/TLS Security

- Automatic renewal configured (runs daily at 2 AM)
- TLS 1.2 and 1.3 only
- Strong cipher suites enabled
- HSTS header configured
- OCSP stapling enabled

### Database Security

- Database not exposed to internet
- Strong auto-generated passwords
- Accessible only within Docker network
- Regular backups recommended

## 📊 Troubleshooting

### Installation Fails

**Check logs:**
```bash
cat /root/INSTALL/installation.log
tail -100 /root/INSTALL/installation.log
```

**Common issues:**

1. **DNS not propagated**
   - Wait for DNS to propagate
   - Skip SSL for now, configure later manually

2. **Ports in use**
   - Identify process: `lsof -i :80`
   - Stop conflicting service
   - Re-run installer

3. **Insufficient resources**
   - Verify RAM: `free -h`
   - Check disk: `df -h`
   - Upgrade server if needed

4. **Docker issues**
   - Check Docker status: `systemctl status docker`
   - View Docker logs: `journalctl -u docker`

### Application Won't Start

```bash
# Check container status
docker compose ps

# View container logs
docker compose logs

# Restart containers
docker compose restart

# Rebuild if needed
docker compose up -d --build
```

### SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# View Certbot logs
sudo cat /var/log/letsencrypt/letsencrypt.log

# Manual renewal
sudo certbot renew --dry-run
```

### Database Connection Issues

```bash
# Check PostgreSQL status
docker exec 4ex-postgres pg_isready

# View database logs
docker logs 4ex-postgres

# Test connection
docker exec -it 4ex-postgres psql -U exchange_user -d exchange_db
```

### License Activation Failed

1. **Verify license key format**
2. **Check internet connectivity**
3. **Ensure domain matches license registration**
4. **Contact support with license key**

### Can't Access Application

```bash
# Check if services are running
docker compose ps

# Test HTTP endpoint
curl -I http://localhost:80

# Test HTTPS endpoint
curl -k -I https://localhost:443

# Check firewall
ufw status

# Check Nginx logs
docker logs 4ex-nginx
```

## 🔄 Updates and Maintenance

### Update Application

```bash
cd /opt/4ex-exchange

# Pull latest code (if using Git)
git pull

# Rebuild containers
docker compose build --no-cache

# Restart with new version
docker compose up -d

# Verify update
docker compose ps
```

### System Updates

```bash
# Update system packages
apt update && apt upgrade -y

# Update Docker
apt install docker-ce docker-ce-cli containerd.io

# Restart Docker service
systemctl restart docker
```

### Database Backups

**Manual backup:**
```bash
docker exec 4ex-postgres pg_dump -U exchange_user exchange_db > backup_$(date +%Y%m%d).sql
```

**Automated daily backups:**
```bash
# Create backup script
cat > /usr/local/bin/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/4ex"
mkdir -p $BACKUP_DIR
docker exec 4ex-postgres pg_dump -U exchange_user exchange_db > $BACKUP_DIR/db_$(date +%Y%m%d_%H%M%S).sql
find $BACKUP_DIR -name "db_*.sql" -mtime +7 -delete
EOF

chmod +x /usr/local/bin/backup-db.sh

# Add cron job (daily at 3 AM)
(crontab -l; echo "0 3 * * * /usr/local/bin/backup-db.sh") | crontab -
```

## 📞 Support

### Documentation

- **Full Documentation:** https://docs.4ex.com
- **API Reference:** https://docs.4ex.com/api
- **FAQ:** https://docs.4ex.com/faq

### Contact

- **Technical Support:** support@4ex.com
- **License Issues:** licenses@4ex.com
- **Sales Inquiries:** sales@4ex.com

### Before Contacting Support

Please gather:
1. Installation log (`/root/INSTALL/installation.log`)
2. Health check report (`/opt/4ex-exchange/health-check-report.txt`)
3. Container logs (`docker compose logs > logs.txt`)
4. System information (`uname -a`, `docker --version`)
5. License key
6. Domain name

## 📝 Uninstallation

To completely remove the installation:

```bash
cd /opt/4ex-exchange

# Stop and remove containers
docker compose down -v

# Remove Docker images
docker rmi $(docker images -q '4ex-*')

# Remove installation directory
rm -rf /opt/4ex-exchange

# Remove SSL certificates (optional)
sudo certbot delete --cert-name your-domain.com

# Remove cron jobs
crontab -l | grep -v 'renew-ssl\|backup-db' | crontab -

# Remove installation package
rm -rf /root/INSTALL
```

## 📄 License

This software is licensed under commercial license. See LICENSE file for details.

## 🎯 Next Steps

After successful installation:

1. ✅ Login to admin panel
2. ✅ Change default password
3. ✅ Enable 2FA
4. ✅ Configure currencies and rates
5. ✅ Set up payment methods
6. ✅ Customize branding
7. ✅ Test exchange flow
8. ✅ Set up monitoring
9. ✅ Configure automated backups
10. ✅ Review security settings

---

**Version:** 1.0.0  
**Last Updated:** December 2024  
**Tested On:** Ubuntu 24.04 LTS  
**Docker Version:** 24.0+  

For the latest version and updates, visit: https://4ex.com/downloads
# 4EX Exchange Platform - Installation Guide

## 🚀 One-Click Installation for Ubuntu 24.04

This installation package provides a fully automated deployment system for the 4EX Exchange Platform using Docker containerization.

## 📋 Prerequisites

### Server Requirements

**Minimum Specifications:**
- **Operating System:** Ubuntu 24.04 LTS (recommended fresh installation)
- **CPU:** 2 cores
- **RAM:** 2GB minimum, 4GB recommended
- **Disk Space:** 10GB minimum, 20GB recommended
- **Network:** Public IP address with stable internet connection

**Required Access:**
- Root user access or user with sudo privileges
- SSH access to the server
- Ports 22 (SSH), 80 (HTTP), and 443 (HTTPS) accessible from the internet

### Domain Requirements

**Before installation, ensure:**
- You have a domain name registered
- DNS A record points to your server's public IP address
- DNS changes have propagated (can take up to 24-48 hours)

You can verify DNS propagation:
```bash
nslookup your-domain.com
dig your-domain.com
```

### Information Needed

Have the following information ready before starting:

1. **Domain Name** - Your fully qualified domain name (e.g., exchange.example.com)
2. **Administrator Email** - Valid email address for SSL certificates and admin account
3. **Administrator Password** - Strong password (min 12 characters with uppercase, lowercase, number, and special character)
4. **License Key** - Your purchased license key (format: LIC-XXXX-XXXX-XXXX-XXXX)
5. **Database Password** - (Optional) Strong password for database or auto-generate

## 📦 Installation Package Contents

```
INSTALL/
├── install.sh                    # Main installation script
├── config/
│   ├── docker-compose.yml        # Docker services configuration
│   ├── Dockerfile                # Application container definition
│   ├── nginx.conf.template       # Nginx reverse proxy template
│   └── .env.template             # Environment variables template
├── scripts/
│   ├── check-prerequisites.sh    # System validation
│   ├── configure.sh              # Configuration wizard
│   ├── setup-docker.sh           # Docker installation
│   ├── setup-ssl.sh              # SSL certificate setup
│   ├── setup-database.sh         # Database initialization
│   ├── setup-admin.sh            # Admin account creation
│   └── health-check.sh           # Post-installation validation
├── utils/
│   ├── messages.sh               # Output formatting
│   ├── helpers.sh                # Utility functions
│   └── validators.sh             # Input validation
└── README.md                     # This file
```

## 🔧 Quick Start Installation

### Step 1: Upload Installation Package

Upload the entire `INSTALL` directory to your server:

```bash
# Using SCP from your local machine
scp -r INSTALL root@YOUR_SERVER_IP:/root/

# Or download directly on server
# (if you have the package hosted somewhere)
wget https://your-server.com/4ex-install.tar.gz
tar -xzf 4ex-install.tar.gz
```

### Step 2: Connect to Your Server

```bash
ssh root@YOUR_SERVER_IP
```

### Step 3: Run the Installer

```bash
cd /root/INSTALL
chmod +x install.sh scripts/*.sh utils/*.sh
sudo bash install.sh
```

### Step 4: Follow the Interactive Wizard

The installation wizard will guide you through:

1. **System prerequisites check** - Validates your server meets requirements
2. **Configuration collection** - Prompts for domain, email, passwords, license
3. **Docker installation** - Installs and configures Docker & Docker Compose
4. **Application deployment** - Builds and starts application containers
5. **SSL certificate generation** - Obtains Let's Encrypt certificate
6. **Database initialization** - Sets up PostgreSQL database
7. **License activation** - Configures and validates license
8. **Admin account creation** - Creates administrator user
9. **Health checks** - Validates successful installation

### Step 5: Access Your Application

Once installation completes, access your application at:

```
https://your-domain.com
```

Login credentials will be displayed at the end of installation and saved to:
```
/opt/4ex-exchange/.credentials
```

## ⚙️ Installation Phases

### Phase 1: Prerequisites Check

The installer validates:
- ✅ Ubuntu 24.04 operating system
- ✅ Minimum 2GB RAM available
- ✅ Minimum 10GB disk space
- ✅ Root/sudo permissions
- ✅ Internet connectivity
- ✅ Ports 80 and 443 available
- ✅ Required system packages

### Phase 2: Configuration Wizard

Interactive prompts collect:
- Domain name with DNS validation
- Administrator email address
- Strong administrator password
- Valid license key
- Database password (or auto-generate)
- Port configuration (default 80/443)

All inputs are validated before proceeding.

### Phase 3: System Preparation

Automated setup includes:
- Docker Engine installation
- Docker Compose plugin installation
- UFW firewall configuration
- System optimization
- Security hardening

### Phase 4: Application Deployment

Deployment process:
- Copies application files to `/opt/4ex-exchange`
- Generates production `.env` file
- Builds optimized Docker images
- Starts multi-container stack:
  - PostgreSQL 15 database
  - React application (Nginx)
  - Nginx reverse proxy

### Phase 5: SSL Certificate Setup

SSL configuration:
- Installs Certbot
- Obtains Let's Encrypt certificate
- Configures Nginx with SSL
- Sets up automatic renewal (cron job)
- Implements security best practices

### Phase 6: Database Initialization

Database setup:
- Creates PostgreSQL database
- Creates application schema
- Sets up tables and indexes
- Configures secure access

### Phase 7: License Activation

License configuration:
- Configures license key in environment
- Application validates on startup
- Binds license to domain
- Enables grace period for offline operation

### Phase 8: Post-Installation Validation

Health checks verify:
- ✅ All containers running
- ✅ Database connectivity
- ✅ Application responding
- ✅ HTTP/HTTPS endpoints
- ✅ SSL certificate valid
- ✅ License activated
- ✅ Admin account created

## 🛠️ Post-Installation

### First Steps

1. **Visit your application:**
   ```
   https://your-domain.com
   ```

2. **Login with admin credentials**
   - Email: (from installation)
   - Password: (from installation)

3. **Change your password immediately**
   - Go to Admin Settings → Security
   - Update password
   - Enable 2FA (recommended)

4. **Configure your platform**
   - Set up currencies and exchange rates
   - Configure payment methods
   - Customize site settings
   - Review security settings

5. **Secure your credentials file**
   ```bash
   # Read and save credentials
   cat /opt/4ex-exchange/.credentials
   
   # Then delete the file
   rm /opt/4ex-exchange/.credentials
   ```

### Service Management

All services are managed via Docker Compose:

```bash
cd /opt/4ex-exchange

# View status
docker compose ps

# View logs
docker compose logs -f

# Restart services
docker compose restart

# Stop services
docker compose stop

# Start services
docker compose start

# Rebuild and restart
docker compose up -d --build
```

### Individual Container Management

```bash
# View all containers
docker ps -a

# View specific container logs
docker logs 4ex-app
docker logs 4ex-postgres
docker logs 4ex-nginx

# Restart specific container
docker restart 4ex-app

# Execute command in container
docker exec -it 4ex-postgres psql -U exchange_user
```

### Database Access

```bash
# Connect to PostgreSQL
docker exec -it 4ex-postgres psql -U exchange_user -d exchange_db

# Create database backup
docker exec 4ex-postgres pg_dump -U exchange_user exchange_db > backup.sql

# Restore database
docker exec -i 4ex-postgres psql -U exchange_user -d exchange_db < backup.sql
```

### SSL Certificate Management

```bash
# Check certificate expiration
sudo certbot certificates

# Force renewal
sudo certbot renew --force-renewal

# View renewal cron job
crontab -l | grep renew-ssl
```

### Logs and Monitoring

```bash
# Application logs
docker logs -f 4ex-app

# Nginx access logs
docker logs -f 4ex-nginx

# Database logs
docker logs -f 4ex-postgres

# Installation log
cat /root/INSTALL/installation.log

# Health check report
cat /opt/4ex-exchange/health-check-report.txt
```

## 🔧 Configuration Files

### Environment Variables

Main configuration file: `/opt/4ex-exchange/.env`

```bash
# Edit configuration
nano /opt/4ex-exchange/.env

# After changes, restart services
cd /opt/4ex-exchange
docker compose restart
```

### Nginx Configuration

Nginx config: `/opt/4ex-exchange/nginx.conf`

```bash
# Edit Nginx config
nano /opt/4ex-exchange/nginx.conf

# Test configuration
docker exec 4ex-nginx nginx -t

# Reload Nginx
docker restart 4ex-nginx
```

### Docker Compose

Docker Compose file: `/opt/4ex-exchange/docker-compose.yml`

```bash
# Edit Docker Compose
nano /opt/4ex-exchange/docker-compose.yml

# Apply changes
cd /opt/4ex-exchange
docker compose up -d
```

## 🔒 Security Best Practices

### After Installation

1. **Change default passwords immediately**
2. **Enable two-factor authentication (2FA)**
3. **Keep credentials file secure and delete after saving**
4. **Regularly update system packages:**
   ```bash
   apt update && apt upgrade -y
   ```

5. **Monitor logs for suspicious activity**
6. **Set up automated backups**
7. **Review firewall rules:**
   ```bash
   ufw status
   ```

### SSL/TLS Security

- Automatic renewal configured (runs daily at 2 AM)
- TLS 1.2 and 1.3 only
- Strong cipher suites enabled
- HSTS header configured
- OCSP stapling enabled

### Database Security

- Database not exposed to internet
- Strong auto-generated passwords
- Accessible only within Docker network
- Regular backups recommended

## 📊 Troubleshooting

### Installation Fails

**Check logs:**
```bash
cat /root/INSTALL/installation.log
tail -100 /root/INSTALL/installation.log
```

**Common issues:**

1. **DNS not propagated**
   - Wait for DNS to propagate
   - Skip SSL for now, configure later manually

2. **Ports in use**
   - Identify process: `lsof -i :80`
   - Stop conflicting service
   - Re-run installer

3. **Insufficient resources**
   - Verify RAM: `free -h`
   - Check disk: `df -h`
   - Upgrade server if needed

4. **Docker issues**
   - Check Docker status: `systemctl status docker`
   - View Docker logs: `journalctl -u docker`

### Application Won't Start

```bash
# Check container status
docker compose ps

# View container logs
docker compose logs

# Restart containers
docker compose restart

# Rebuild if needed
docker compose up -d --build
```

### SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# View Certbot logs
sudo cat /var/log/letsencrypt/letsencrypt.log

# Manual renewal
sudo certbot renew --dry-run
```

### Database Connection Issues

```bash
# Check PostgreSQL status
docker exec 4ex-postgres pg_isready

# View database logs
docker logs 4ex-postgres

# Test connection
docker exec -it 4ex-postgres psql -U exchange_user -d exchange_db
```

### License Activation Failed

1. **Verify license key format**
2. **Check internet connectivity**
3. **Ensure domain matches license registration**
4. **Contact support with license key**

### Can't Access Application

```bash
# Check if services are running
docker compose ps

# Test HTTP endpoint
curl -I http://localhost:80

# Test HTTPS endpoint
curl -k -I https://localhost:443

# Check firewall
ufw status

# Check Nginx logs
docker logs 4ex-nginx
```

## 🔄 Updates and Maintenance

### Update Application

```bash
cd /opt/4ex-exchange

# Pull latest code (if using Git)
git pull

# Rebuild containers
docker compose build --no-cache

# Restart with new version
docker compose up -d

# Verify update
docker compose ps
```

### System Updates

```bash
# Update system packages
apt update && apt upgrade -y

# Update Docker
apt install docker-ce docker-ce-cli containerd.io

# Restart Docker service
systemctl restart docker
```

### Database Backups

**Manual backup:**
```bash
docker exec 4ex-postgres pg_dump -U exchange_user exchange_db > backup_$(date +%Y%m%d).sql
```

**Automated daily backups:**
```bash
# Create backup script
cat > /usr/local/bin/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/4ex"
mkdir -p $BACKUP_DIR
docker exec 4ex-postgres pg_dump -U exchange_user exchange_db > $BACKUP_DIR/db_$(date +%Y%m%d_%H%M%S).sql
find $BACKUP_DIR -name "db_*.sql" -mtime +7 -delete
EOF

chmod +x /usr/local/bin/backup-db.sh

# Add cron job (daily at 3 AM)
(crontab -l; echo "0 3 * * * /usr/local/bin/backup-db.sh") | crontab -
```

## 📞 Support

### Documentation

- **Full Documentation:** https://docs.4ex.com
- **API Reference:** https://docs.4ex.com/api
- **FAQ:** https://docs.4ex.com/faq

### Contact

- **Technical Support:** support@4ex.com
- **License Issues:** licenses@4ex.com
- **Sales Inquiries:** sales@4ex.com

### Before Contacting Support

Please gather:
1. Installation log (`/root/INSTALL/installation.log`)
2. Health check report (`/opt/4ex-exchange/health-check-report.txt`)
3. Container logs (`docker compose logs > logs.txt`)
4. System information (`uname -a`, `docker --version`)
5. License key
6. Domain name

## 📝 Uninstallation

To completely remove the installation:

```bash
cd /opt/4ex-exchange

# Stop and remove containers
docker compose down -v

# Remove Docker images
docker rmi $(docker images -q '4ex-*')

# Remove installation directory
rm -rf /opt/4ex-exchange

# Remove SSL certificates (optional)
sudo certbot delete --cert-name your-domain.com

# Remove cron jobs
crontab -l | grep -v 'renew-ssl\|backup-db' | crontab -

# Remove installation package
rm -rf /root/INSTALL
```

## 📄 License

This software is licensed under commercial license. See LICENSE file for details.

## 🎯 Next Steps

After successful installation:

1. ✅ Login to admin panel
2. ✅ Change default password
3. ✅ Enable 2FA
4. ✅ Configure currencies and rates
5. ✅ Set up payment methods
6. ✅ Customize branding
7. ✅ Test exchange flow
8. ✅ Set up monitoring
9. ✅ Configure automated backups
10. ✅ Review security settings

---

**Version:** 1.0.0  
**Last Updated:** December 2024  
**Tested On:** Ubuntu 24.04 LTS  
**Docker Version:** 24.0+  

For the latest version and updates, visit: https://4ex.com/downloads
