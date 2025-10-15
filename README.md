<p align="center">
  <a href="https://www.medusajs.com">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://user-images.githubusercontent.com/59018053/229103275-b5e482bb-4601-46e6-8142-244f531cebdb.svg">
      <source media="(prefers-color-scheme: light)" srcset="https://user-images.githubusercontent.com/59018053/229103726-e5b529a3-9b3f-4970-8a1f-c6af37f087bf.svg">
      <img alt="Medusa logo" src="https://user-images.githubusercontent.com/59018053/229103726-e5b529a3-9b3f-4970-8a1f-c6af37f087bf.svg" width=100>
    </picture>
  </a>
  <a href="https://railway.app/template/gkU-27?referralCode=-Yg50p">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://railway.app/brand/logo-light.svg">
      <source media="(prefers-color-scheme: light)" srcset="https://railway.app/brand/logo-dark.svg">
      <img alt="Railway logo" src="https://railway.app/brand/logo-light.svg" width=100>
    </picture>
  </a>
</p>

<h2 align="center">
  Solace Medusa Starter - Storefront
</h2>

<p align="center">
  <strong>Modern Next.js Storefront for Railway Boilerplate</strong>
</p>
<h4 align="center">
  Production-ready ecommerce platform optimized for Railway deployment
</h4>
<h4 align="center">
  Backend + Storefront + PostgreSQL + Redis + MinIO + MeiliSearch
</h4>

<h2 align="center">
  <a href="https://railway.app/template/gkU-27?referralCode=-Yg50p">one-click deploy on railway!</a>
</h2>

<h1 align="center">
  Need help?<br>
  <a href="https://funkyton.com/medusajs-2-0-is-finally-here/">Step by step deploy guide, and video instructions</a>
</h1>

<p align="center">
Combine Medusa's modules for your commerce backend with the newest Next.js 14 features for a performant storefront.</p>

## About Railway Boilerplate
This Railway Boilerplate is a production-ready monorepo consisting of the officially released MedusaJS 2.0 backend and storefront application. It is a pre-configured, optimized solution specifically designed for seamless deployment on [Railway.app](https://railway.app?referralCode=-Yg50p).

**Key Features:**
- 🚀 **One-click deployment** on Railway with pre-configured services
- 🛒 **Complete ecommerce solution** with MedusaJS 2.0 backend
- 🎨 **Modern Next.js 14 storefront** with App Router
- 🗄️ **Production databases** (PostgreSQL, Redis, MinIO, MeiliSearch)
- 📧 **Email notifications** with Resend integration
- 💳 **Payment processing** with Stripe integration
- 🔍 **Advanced search** with MeiliSearch

Updated: to `version 2.10.2` 🥳

## Preconfigured 3rd party integrations

- MinIO file storage: Replaces local file storage with MinIO cloud storage, automatically creating a 'medusa-media' bucket for your media files. [README](backend/src/modules/minio-file/README.md)
- Resend email integration [Watch setup video](https://youtu.be/pbdZm26YDpE?si=LQTHWeZMLD4w3Ahw) - special thanks to [aleciavogel](https://github.com/aleciavogel) for Resend notification service, and react-email implementation! [README](backend/src/modules/email-notifications/README.md)
- Stripe payment service: [Watch setup video](https://youtu.be/dcSOpIzc1Og)
- Meilisearch integration by [Rokmohar](https://github.com/rokmohar/medusa-plugin-meilisearch): Adds powerful product search capabilities to your store. When deployed on Railway using the template, MeiliSearch is automatically configured. (For non-railway'ers: [Watch setup video](https://youtu.be/hrXcc5MjApI))

# 🚀 Railway Deployment

## Quick Start (Recommended)
1. **Click the Railway template button above** for one-click deployment
2. **Configure your environment variables** in Railway dashboard
3. **Deploy and go live** - everything is pre-configured!

## Manual Railway Setup
If you prefer manual setup:

1. **Create a new Railway project**
2. **Connect this repository** to Railway
3. **Add required services:**
   - PostgreSQL database
   - Redis cache
   - MinIO storage
   - MeiliSearch
4. **Configure environment variables** (see Environment Variables section)
5. **Deploy both backend and storefront**

## Environment Variables for Railway

### Backend Environment Variables
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

### Storefront Environment Variables
```bash
# Backend URL
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://your-backend.railway.app

# Stripe
NEXT_PUBLIC_STRIPE_KEY=your-stripe-publishable-key

# MinIO
NEXT_PUBLIC_MINIO_ENDPOINT=your-minio-endpoint
```

# Backend

### local setup
Video instructions: https://youtu.be/PPxenu7IjGM

- `cd backend/`
- `pnpm install` or `npm i`
- Rename `.env.template` ->  `.env`
- To connect to your online database from your local machine, copy the `DATABASE_URL` value auto-generated on Railway and add it to your `.env` file.
  - If connecting to a new database, for example a local one, run `pnpm ib` or `npm run ib` to seed the database.
- `pnpm dev` or `npm run dev`

### requirements
- **postgres database** (Automatic setup when using the Railway template)
- **redis** (Automatic setup when using the Railway template) - fallback to simulated redis.
- **MinIO storage** (Automatic setup when using the Railway template) - fallback to local storage.
- **Meilisearch** (Automatic setup when using the Railway template)

### commands

`cd backend/`
`npm run ib` or `pnpm ib` will initialize the backend by running migrations and seed the database with required system data.
`npm run dev` or `pnpm dev` will start the backend (and admin dashboard frontend on `localhost:9000/app`) in development mode.
`pnpm build && pnpm start` will compile the project and run from compiled source. This can be useful for reproducing issues on your cloud instance.

# Storefront

### local setup
Video instructions: https://youtu.be/PPxenu7IjGM

- `cd storefront/
- Install dependencies `npm i` or `pnpm i`
- Rename `.env.local.template` ->  `.env.local`

### requirements
- A running backend on port 9000 is required to fetch product data and other information needed to build Next.js pages.

### commands
`cd storefront/`
`npm run dev` or `pnpm dev` will run the storefront on uncompiled code, with hot-reloading as files are saved with changes.

## Useful resources
- How to setup credit card payment with Stripe payment module: https://youtu.be/dcSOpIzc1Og
- https://funkyton.com/medusajs-2-0-is-finally-here/#succuessfully-deployed-whats-next
  
<p align="center">
  <a href="https://funkyton.com/">
    <div style="text-align: center;">
      A template by,
      <br>
      <picture>
        <img alt="FUNKYTON logo" src="https://res-5.cloudinary.com/hczpmiapo/image/upload/q_auto/v1/ghost-blog-images/funkyton-logo.png" width=200>
      </picture>
    </div>
  </a>
</p>
