# 🚀 Railway Deployment Guide

## Quick Start (One-Click Deploy)

1. **Click the Railway template button** in the main README
2. **Configure your environment variables** in Railway dashboard
3. **Deploy and go live** - everything is pre-configured!

## Manual Railway Setup

### Step 1: Create Railway Project

1. Go to [Railway.app](https://railway.app?referralCode=-Yg50p)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Connect this repository

### Step 2: Add Required Services

Add these services to your Railway project:

1. **PostgreSQL Database**
   - Go to "Add Service" → "Database" → "PostgreSQL"
   - Railway will automatically create the database

2. **Redis Cache**
   - Go to "Add Service" → "Database" → "Redis"
   - Railway will automatically create the Redis instance

3. **MinIO Storage**
   - Go to "Add Service" → "Database" → "MinIO"
   - Railway will automatically create the MinIO instance

4. **MeiliSearch**
   - Go to "Add Service" → "Database" → "MeiliSearch"
   - Railway will automatically create the MeiliSearch instance

### Step 3: Deploy Backend

1. **Create a new service** for the backend
2. **Set the source** to this repository
3. **Set the root directory** to `backend/`
4. **Configure environment variables** (see below)
5. **Deploy the service**

### Step 4: Deploy Storefront

1. **Create a new service** for the storefront
2. **Set the source** to this repository
3. **Set the root directory** to `storefront/`
4. **Configure environment variables** (see below)
5. **Deploy the service**

## Environment Variables Configuration

### Backend Service Variables

```bash
# Database (from Railway PostgreSQL service)
DATABASE_URL=${{PostgreSQL.DATABASE_URL}}

# Redis (from Railway Redis service)
REDIS_URL=${{Redis.REDIS_URL}}

# MinIO Storage (from Railway MinIO service)
MINIO_ENDPOINT=${{MinIO.MINIO_ENDPOINT}}
MINIO_ACCESS_KEY=${{MinIO.MINIO_ACCESS_KEY}}
MINIO_SECRET_KEY=${{MinIO.MINIO_SECRET_KEY}}
MINIO_BUCKET=medusa-media

# MeiliSearch (from Railway MeiliSearch service)
MEILISEARCH_HOST=${{MeiliSearch.MEILISEARCH_HOST}}
MEILISEARCH_API_KEY=${{MeiliSearch.MEILISEARCH_API_KEY}}

# Email (Resend - get from Resend dashboard)
RESEND_API_KEY=your-resend-api-key

# Stripe (get from Stripe dashboard)
STRIPE_API_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret

# Optional
ADMIN_CORS=https://your-storefront.railway.app
JWT_SECRET=your-jwt-secret
COOKIE_SECRET=your-cookie-secret
```

### Storefront Service Variables

```bash
# Backend URL (from your deployed backend service)
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://your-backend.railway.app

# Stripe (get from Stripe dashboard)
NEXT_PUBLIC_STRIPE_KEY=your-stripe-publishable-key

# MinIO (from Railway MinIO service)
NEXT_PUBLIC_MINIO_ENDPOINT=${{MinIO.MINIO_ENDPOINT}}

# Optional
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your-paypal-client-id
NEXT_PUBLIC_SEARCH_APP_ID=${{MeiliSearch.MEILISEARCH_APP_ID}}
NEXT_PUBLIC_SEARCH_API_KEY=${{MeiliSearch.MEILISEARCH_API_KEY}}
NEXT_PUBLIC_INDEX_NAME=products
NEXT_PUBLIC_DEFAULT_REGION=us
```

## Post-Deployment Setup

### 1. Initialize Backend Database

After the backend is deployed, you need to initialize the database:

1. Go to your backend service in Railway
2. Go to "Deployments" tab
3. Click on the latest deployment
4. Go to "Logs" tab
5. Run the initialization command: `pnpm ib`

### 2. Configure Stripe Webhooks

1. Go to your Stripe dashboard
2. Navigate to "Webhooks"
3. Add a new webhook endpoint: `https://your-backend.railway.app/webhooks/stripe`
4. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
5. Copy the webhook secret to your backend environment variables

### 3. Configure Resend Email

1. Go to [Resend dashboard](https://resend.com)
2. Create an API key
3. Add the API key to your backend environment variables

## Troubleshooting

### Common Issues

1. **Database connection errors**
   - Check that `DATABASE_URL` is correctly set
   - Ensure PostgreSQL service is running

2. **Redis connection errors**
   - Check that `REDIS_URL` is correctly set
   - Ensure Redis service is running

3. **MinIO storage errors**
   - Check that MinIO environment variables are set
   - Ensure MinIO service is running

4. **Storefront can't connect to backend**
   - Check that `NEXT_PUBLIC_MEDUSA_BACKEND_URL` is correct
   - Ensure backend service is running and accessible

### Getting Help

- Check Railway service logs for detailed error messages
- Ensure all environment variables are properly set
- Verify that all required services are running

## Production Considerations

### Security
- Use strong, unique secrets for JWT and cookies
- Enable HTTPS for all services
- Regularly rotate API keys

### Performance
- Monitor resource usage in Railway dashboard
- Scale services as needed based on traffic
- Use Railway's auto-scaling features

### Monitoring
- Set up monitoring for all services
- Monitor database performance
- Track application metrics

## Support

For additional help:
- [Railway Documentation](https://docs.railway.app)
- [MedusaJS Documentation](https://docs.medusajs.com)
- [Next.js Documentation](https://nextjs.org/docs)
