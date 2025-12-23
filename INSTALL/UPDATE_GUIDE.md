# ExchangeKit Update Guide

This guide explains how to update your ExchangeKit installation to newer versions.

## Table of Contents
- [Update Methods](#update-methods)
- [Preparing an Update](#preparing-an-update)
- [Applying an Update](#applying-an-update)
- [Rollback](#rollback)
- [Troubleshooting](#troubleshooting)

## Update Methods

ExchangeKit supports two update methods:

### 1. Update from Package (Recommended)
- Safest method with automatic backup and rollback
- Works offline
- Includes all files needed for the update

### 2. Update from Git (Advanced)
- Requires Git repository access
- Pulls latest changes from remote
- Requires internet connection

## Preparing an Update

### For Package Updates

**On your development machine:**

1. Make your code changes
2. Test thoroughly
3. Create an update package:

```bash
cd INSTALL
bash create-update-package.sh v1.2.0
```

This creates a package in `dist/updates/exchangekit-update-v1.2.0.tar.gz`

4. Transfer the package to your server:

```bash
scp dist/updates/exchangekit-update-v1.2.0.tar.gz user@your-server:/tmp/
```

### For Git Updates

**On your server:**

1. Ensure Git repository is configured in `/opt/exchangekit`
2. Ensure you have access to pull from the repository

## Applying an Update

### Method 1: Update from Package

```bash
# SSH into your server
ssh user@your-server

# Run the update script with the package path
sudo bash /opt/exchangekit/scripts/update.sh /tmp/exchangekit-update-v1.2.0.tar.gz
```

### Method 2: Update from Git

```bash
# SSH into your server
ssh user@your-server

# Run the update script without parameters
sudo bash /opt/exchangekit/scripts/update.sh
```

## What Happens During Update

The update script performs the following steps:

1. **Verification** - Checks current installation
2. **Backup** - Creates backup of configuration and data
3. **Stop Services** - Stops all Docker containers
4. **Update Files** - Replaces application files
5. **Rebuild** - Rebuilds Docker containers
6. **Database Migration** - Runs any database migrations
7. **Start Services** - Starts updated containers
8. **Verification** - Verifies update success
9. **Cleanup** - Removes old backups (keeps last 5)

### Automatic Backup

Before each update, the script creates a backup containing:
- `.env` configuration
- Admin configuration files
- License database
- Docker compose configuration
- Nginx configuration

Backups are stored in `/opt/exchangekit-backups/backup_YYYYMMDD_HHMMSS/`

## Rollback

If an update fails, the script automatically rolls back to the previous version.

### Manual Rollback

If you need to manually rollback after a successful update:

```bash
# List available backups
ls -lt /opt/exchangekit-backups/

# Choose a backup and restore it
sudo bash /opt/exchangekit/scripts/rollback.sh /opt/exchangekit-backups/backup_20231215_143022
```

## Update Workflow

```
Development Machine                    Production Server
──────────────────                    ─────────────────

1. Make changes
2. Test changes
3. Create update package
   ├─ bash create-update-package.sh
   └─ Output: exchangekit-update-X.tar.gz
   
4. Upload package ─────────────────> 5. Receive package
                                     
                                     6. Run update script
                                        ├─ Backup current
                                        ├─ Stop services
                                        ├─ Update files
                                        ├─ Rebuild containers
                                        ├─ Start services
                                        └─ Verify
                                     
                                     7. Update complete ✓
```

## Version Tracking

Each update package includes a VERSION file with:
- Version number
- Build timestamp
- Git commit hash (if available)

Check current version:
```bash
cat /opt/exchangekit/VERSION
```

## Troubleshooting

### Update Failed with "Installation not found"
**Solution:** Ensure ExchangeKit is installed in `/opt/exchangekit`

### Services Won't Start After Update
**Solution:** 
```bash
# Check logs
docker compose logs -f

# If needed, rollback
ls -lt /opt/exchangekit-backups/
# Use the latest backup
```

### Database Migration Errors
**Solution:**
```bash
# Check database status
docker exec exchangekit-postgres psql -U exchange_user -d exchange_db -c "\dt"

# Manual migration
sudo bash /opt/exchangekit/scripts/migrate-database.sh
```

### Permission Errors
**Solution:**
```bash
# Ensure proper ownership
sudo chown -R root:root /opt/exchangekit
sudo chmod +x /opt/exchangekit/scripts/*.sh
```

### Docker Build Fails
**Solution:**
```bash
# Clear Docker cache
docker system prune -af

# Retry update
sudo bash /opt/exchangekit/scripts/update.sh <package-path>
```

## Best Practices

1. **Always backup manually before major updates:**
   ```bash
   sudo tar -czf /root/exchangekit-manual-backup.tar.gz /opt/exchangekit
   ```

2. **Test updates in staging environment first**

3. **Schedule updates during low-traffic periods**

4. **Monitor logs after update:**
   ```bash
   docker compose logs -f
   ```

5. **Keep at least one known-good backup offsite**

6. **Document custom changes** before updating

## Maintenance Updates

For regular maintenance updates (security patches, minor fixes):

```bash
# Quick update (automated)
sudo bash /opt/exchangekit/scripts/update.sh /tmp/update-package.tar.gz

# Verify
docker compose ps
curl -I http://localhost
```

## Support

If you encounter issues during updates:
1. Check the error logs
2. Review the backup in `/opt/exchangekit-backups/`
3. Contact support with the error details
4. Keep backups until update is confirmed stable

---

**Note:** Always ensure you have a recent backup before performing updates!
