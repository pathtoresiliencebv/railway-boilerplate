# Railway Boilerplate - Backend

## 🚀 Railway Deployment (Recommended)

### One-Click Deploy
1. Use the Railway template for automatic setup
2. All services (PostgreSQL, Redis, MinIO, MeiliSearch) are pre-configured
3. Environment variables are automatically set

### Manual Railway Setup
1. Create a new Railway project
2. Add PostgreSQL, Redis, MinIO, and MeiliSearch services
3. Configure environment variables (see below)
4. Deploy the backend service

## 🛠️ Local Development Setup
Video instructions: https://youtu.be/PPxenu7IjGM

- `cd backend/`
- `pnpm install` or `npm i`
- Create `.env` file with required variables (see Environment Variables section)
- To connect to your Railway database, copy the `DATABASE_URL` value from Railway dashboard
- If using a local database, run `pnpm ib` or `npm run ib` to seed the database
- `pnpm dev` or `npm run dev`

## 📋 Requirements
- **PostgreSQL database** (Automatic setup when using the Railway template)
- **Redis cache** (Automatic setup when using the Railway template) - fallback to simulated redis
- **MinIO storage** (Automatic setup when using the Railway template) - fallback to local storage
- **MeiliSearch** (Automatic setup when using the Railway template)

## 🔧 Environment Variables

### Required Variables
```bash
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# Redis
REDIS_URL=redis://username:password@host:port

# MinIO Storage
MINIO_ENDPOINT=your-minio-endpoint
MINIO_ACCESS_KEY=your-access-key
MINIO_SECRET_KEY=your-secret-key
MINIO_BUCKET=medusa-media

# MeiliSearch
MEILISEARCH_HOST=your-meilisearch-host
MEILISEARCH_API_KEY=your-api-key

# Email (Resend)
RESEND_API_KEY=your-resend-api-key

# Stripe
STRIPE_API_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
```

### Optional Variables
```bash
# Admin Dashboard
ADMIN_CORS=your-frontend-url

# JWT
JWT_SECRET=your-jwt-secret

# Cookie
COOKIE_SECRET=your-cookie-secret
```

### commands

`cd backend/`
`npm run ib` or `pnpm ib` will initialize the backend by running migrations and seed the database with required system data.
`npm run dev` or `pnpm dev` will start the backend (and admin dashboard frontend on `localhost:9000/app`) in development mode.
`pnpm build && pnpm start` will compile the project and run from compiled source. This can be useful for reproducing issues on your cloud instance.
# Force Railway deployment with correct commit
# Force Railway deployment with fixed module exports
