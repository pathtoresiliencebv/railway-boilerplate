# 🚀 Medusa Backend Deployment Guide

## Overview
This guide covers deploying the enhanced Medusa v2.10.2 backend with 15 custom modules and 6 recipe workflows to Railway.

## 📋 Prerequisites

### Required Environment Variables
Copy `env.template` to `.env` and configure:

```bash
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# Redis
REDIS_URL=redis://username:password@host:port

# JWT & Security
JWT_SECRET=your-jwt-secret
COOKIE_SECRET=your-cookie-secret

# CORS
ADMIN_CORS=http://localhost:7001,https://your-admin-domain.com
AUTH_CORS=http://localhost:7001,https://your-admin-domain.com
STORE_CORS=http://localhost:8000,https://your-store-domain.com

# Backend URL
BACKEND_URL=https://your-backend-domain.com

# OAuth Providers (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Email Notifications
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# Phone Auth (Optional)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number

# File Storage (Optional)
MINIO_ENDPOINT=your-minio-endpoint
MINIO_ACCESS_KEY=your-minio-access-key
MINIO_SECRET_KEY=your-minio-secret-key
MINIO_BUCKET=medusa-media

# Search (Optional)
MEILISEARCH_HOST=your-meilisearch-host
MEILISEARCH_ADMIN_KEY=your-meilisearch-admin-key
```

## 🏗️ Railway Deployment

### 1. Connect Repository
1. Go to [Railway](https://railway.app)
2. Create new project
3. Connect GitHub repository
4. Select `railway-boilerplate` repository

### 2. Configure Service
1. Select the `backend` folder as root directory
2. Railway will auto-detect Node.js
3. Set build command: `pnpm build`
4. Set start command: `pnpm start`

### 3. Add Databases
1. **PostgreSQL Database**
   - Add PostgreSQL service
   - Copy connection string to `DATABASE_URL`

2. **Redis Database**
   - Add Redis service
   - Copy connection string to `REDIS_URL`

### 4. Environment Variables
Add all required environment variables in Railway dashboard:
- Go to your service → Variables tab
- Add all variables from the list above

### 5. Deploy
1. Railway will automatically deploy on push to main branch
2. Monitor deployment logs
3. Access your backend at the provided Railway URL

## 🔧 Post-Deployment Configuration

### 1. Database Migration
```bash
# Run migrations (if needed)
pnpm medusa db:migrate
```

### 2. Admin User Creation
```bash
# Create admin user
pnpm medusa user:create --email admin@yourdomain.com --password yourpassword
```

### 3. Verify Modules
Check that all custom modules are loaded:
- Visit `/admin` to access admin dashboard
- Check module status in admin panel
- Test OAuth login (if configured)

## 📊 Module Status

### ✅ Core Modules (18)
- API Key Module
- Auth Module
- Cart Module
- Currency Module
- Customer Module
- Fulfillment Module
- Inventory Module
- Order Module
- Payment Module
- Pricing Module
- Product Module
- Promotion Module
- Region Module
- Sales Channel Module
- Stock Location Module
- Store Module
- Tax Module
- User Module

### ✅ Custom Modules (15)
- Abandoned Cart Service
- Gift Message Service
- Loyalty Points Service
- Wishlist Service
- Product Reviews Service
- Agentic Commerce Service
- Custom Item Pricing Service
- Invoice Generation Service
- First Purchase Discount Service
- Meta Product Feed Service
- Newsletter Service
- Phone Auth Service
- Product Builder Service
- Quote Management Service
- Reorder Service
- Saved Payment Methods Service

### ✅ Recipe Workflows (6)
- Product Bundle Recipe
- Commerce Automation Recipe
- Personalized Products Recipe
- Omnichannel Recipe
- OMS (Order Management System) Recipe
- POS (Point of Sale) Recipe

## 🧪 Testing

### 1. Health Check
```bash
curl https://your-backend-url.com/health
```

### 2. Admin Access
- Visit `https://your-backend-url.com/admin`
- Test login functionality
- Verify custom logo appears

### 3. API Endpoints
```bash
# Test core endpoints
curl https://your-backend-url.com/store/products
curl https://your-backend-url.com/store/regions
```

### 4. Custom Modules
Test custom module endpoints:
```bash
# Example: Test abandoned cart module
curl -X POST https://your-backend-url.com/admin/abandoned-cart/track \
  -H "Content-Type: application/json" \
  -d '{"cartId": "cart_123", "customerId": "cust_123"}'
```

## 🔍 Troubleshooting

### Common Issues

1. **Module Loading Errors**
   - Check module paths in `medusa-config.js`
   - Verify all dependencies are installed
   - Check environment variables

2. **Database Connection Issues**
   - Verify `DATABASE_URL` is correct
   - Check database permissions
   - Run migrations if needed

3. **Redis Connection Issues**
   - Verify `REDIS_URL` is correct
   - Check Redis service status
   - Test Redis connectivity

4. **OAuth Issues**
   - Verify client IDs and secrets
   - Check redirect URLs
   - Test OAuth flow

### Debug Commands
```bash
# Check module status
pnpm medusa modules:list

# Check database connection
pnpm medusa db:status

# View logs
pnpm medusa logs
```

## 📈 Monitoring

### 1. Railway Dashboard
- Monitor service health
- Check resource usage
- View deployment logs

### 2. Application Monitoring
- Set up error tracking (Sentry, etc.)
- Monitor API performance
- Track custom module usage

### 3. Database Monitoring
- Monitor database performance
- Set up alerts for high usage
- Regular backup verification

## 🚀 Next Steps

1. **Frontend Deployment**
   - Deploy Next.js storefront
   - Configure storefront to use backend URL
   - Test end-to-end functionality

2. **Custom Domain**
   - Configure custom domain in Railway
   - Update CORS settings
   - Update environment variables

3. **SSL Certificate**
   - Railway provides automatic SSL
   - Verify HTTPS is working
   - Test all endpoints over HTTPS

4. **Performance Optimization**
   - Enable Redis caching
   - Optimize database queries
   - Set up CDN for static assets

## 📞 Support

For issues with:
- **Medusa Framework**: Check [Medusa Documentation](https://docs.medusajs.com)
- **Railway Platform**: Check [Railway Documentation](https://docs.railway.app)
- **Custom Modules**: Review module documentation in `CUSTOM-MODULES-README.md`

---

**Deployment Complete!** 🎉

Your enhanced Medusa backend is now running on Railway with all custom modules and workflows ready for production use.
