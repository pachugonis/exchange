# ExchangeKit Platform - Quick Start Guide

## ⚡ 5-Minute Installation

### Prerequisites Checklist

- [ ] Ubuntu 24.04 VPS server
- [ ] Root or sudo access
- [ ] Domain name with DNS pointing to server IP
- [ ] Valid license key
- [ ] Email address for admin account

### Installation Steps

1. **Upload installation package to server**
   ```bash
   scp -r INSTALL root@YOUR_SERVER_IP:/root/
   ```

2. **Connect to server**
   ```bash
   ssh root@YOUR_SERVER_IP
   ```

3. **Run installer**
   ```bash
   cd /root/INSTALL
   chmod +x install.sh scripts/*.sh utils/*.sh
   sudo bash install.sh
   ```

4. **Follow the prompts**
   - Enter domain name
   - Enter admin email
   - Create admin password
   - Enter license key
   - Auto-generate database password (recommended)
   - Confirm installation

5. **Wait for completion** (~10-15 minutes)
   The installer will:
   - Check system requirements
   - Install Docker
   - Build application
   - Generate SSL certificate
   - Initialize database
   - Activate license
   - Create admin account

6. **Access your application**
   ```
   https://your-domain.com
   ```

### Post-Installation

**Save your credentials** (displayed at end of installation):
- Application URL: https://your-domain.com
- Admin Email: your-email@example.com
- Admin Password: your-password

**First login:**
1. Visit your domain
2. Click "Admin Login"
3. Enter credentials
4. Change password immediately
5. Enable 2FA

### Useful Commands

```bash
# View service status
cd /opt/4ex-exchange && docker compose ps

# View logs
docker compose logs -f

# Restart services
docker compose restart

# Stop services
docker compose stop

# Start services
docker compose start
```

### Need Help?

- Full documentation: [README.md](README.md)
- Support: support@4ex.com
- License issues: licenses@4ex.com

---

**That's it! Your exchange platform is ready to use.**

Visit https://your-domain.com to get started! 🚀
# ExchangeKit Platform - Quick Start Guide

## ⚡ 5-Minute Installation

### Prerequisites Checklist

- [ ] Ubuntu 24.04 VPS server
- [ ] Root or sudo access
- [ ] Domain name with DNS pointing to server IP
- [ ] Valid license key
- [ ] Email address for admin account

### Installation Steps

1. **Upload installation package to server**
   ```bash
   scp -r INSTALL root@YOUR_SERVER_IP:/root/
   ```

2. **Connect to server**
   ```bash
   ssh root@YOUR_SERVER_IP
   ```

3. **Run installer**
   ```bash
   cd /root/INSTALL
   chmod +x install.sh scripts/*.sh utils/*.sh
   sudo bash install.sh
   ```

4. **Follow the prompts**
   - Enter domain name
   - Enter admin email
   - Create admin password
   - Enter license key
   - Auto-generate database password (recommended)
   - Confirm installation

5. **Wait for completion** (~10-15 minutes)
   The installer will:
   - Check system requirements
   - Install Docker
   - Build application
   - Generate SSL certificate
   - Initialize database
   - Activate license
   - Create admin account

6. **Access your application**
   ```
   https://your-domain.com
   ```

### Post-Installation

**Save your credentials** (displayed at end of installation):
- Application URL: https://your-domain.com
- Admin Email: your-email@example.com
- Admin Password: your-password

**First login:**
1. Visit your domain
2. Click "Admin Login"
3. Enter credentials
4. Change password immediately
5. Enable 2FA

### Useful Commands

```bash
# View service status
cd /opt/4ex-exchange && docker compose ps

# View logs
docker compose logs -f

# Restart services
docker compose restart

# Stop services
docker compose stop

# Start services
docker compose start
```

### Need Help?

- Full documentation: [README.md](README.md)
- Support: support@4ex.com
- License issues: licenses@4ex.com

---

**That's it! Your exchange platform is ready to use.**

Visit https://your-domain.com to get started! 🚀
