# License System Quick Start Guide

## 🚀 Quick Start

### For Developers

**1. Clone and Install**
```bash
git clone <repository-url>
cd exchange
npm install
```

**2. Development Setup (Bypass License)**
```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_LICENSE_ENABLE_VALIDATION=false
```

**3. Run Development Server**
```bash
npm run dev
```

Open http://localhost:5173 - No license required!

### For Production Deployment

**1. Obtain License**
- Purchase from https://4ex.com/licenses
- Receive key via email: `LIC-XXXX-XXXX-XXXX-XXXX`

**2. Configure Environment**
```env
VITE_LICENSE_ENABLE_VALIDATION=true
VITE_LICENSE_KEY=LIC-XXXX-XXXX-XXXX-XXXX
VITE_LICENSE_SERVER_URL=https://licenses.4ex.com
```

**3. Build and Deploy**
```bash
npm run build
# Deploy dist/ folder to your server
```

**4. Activate License**
- Visit your deployment URL
- Enter license key and email
- Confirm domain binding
- Agree to terms
- Click "Activate"

Done! ✅

## 📋 License Types

| Type | Duration | Domains | Price | Best For |
|------|----------|---------|-------|----------|
| **Trial** | 14 days | 1 | Free | Testing |
| **Standard** | 1 year | 1 | $ | Single deployment |
| **Professional** | 1 year | 3 | $$ | Multiple sites |
| **Enterprise** | Custom | ∞ | Custom | Large organizations |
| **Lifetime** | Forever | 5 | $$$ | Long-term use |

## 🔧 Common Tasks

### Check License Status
Admin Panel → License

### Revalidate License
Admin Panel → License → Click "Revalidate"

### Renew License
Contact: sales@4ex.com

### Change Domain
1. Contact support@4ex.com
2. Unbind old domain
3. Wait 24 hours
4. Activate on new domain

### Troubleshooting
```bash
# Clear license cache
localStorage.removeItem('license-storage')

# Test server connection
curl https://licenses.4ex.com/api/health

# Check license data
localStorage.getItem('license-storage')
```

## 📞 Support

- **License Issues**: licenses@4ex.com
- **Technical Support**: support@4ex.com
- **Sales**: sales@4ex.com
- **Documentation**: See LICENSE_IMPLEMENTATION.md

## ⚠️ Important Notes

1. **Never commit `.env` with license keys to git**
2. **Always use HTTPS in production**
3. **Development mode bypasses validation - DO NOT deploy with it!**
4. **Grace period is 7 days for network issues**
5. **Monitor expiration dates in admin panel**

## 🎯 Quick Reference

| Scenario | Solution |
|----------|----------|
| No license | Visit `/license-activation` |
| License expired | Contact sales@4ex.com |
| Server unreachable | Wait, grace period active (7 days) |
| Domain mismatch | Contact support to unbind |
| Activation failed | Check email & key format |
| Need features | Upgrade license tier |

---

For detailed information, see [LICENSE_IMPLEMENTATION.md](./LICENSE_IMPLEMENTATION.md)
