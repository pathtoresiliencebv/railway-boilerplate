import { loadEnv, Modules, defineConfig } from '@medusajs/utils';
import {
  ADMIN_CORS,
  AUTH_CORS,
  BACKEND_URL,
  COOKIE_SECRET,
  DATABASE_URL,
  JWT_SECRET,
  REDIS_URL,
  RESEND_API_KEY,
  RESEND_FROM_EMAIL,
  SENDGRID_API_KEY,
  SENDGRID_FROM_EMAIL,
  SHOULD_DISABLE_ADMIN,
  STORE_CORS,
  STRIPE_API_KEY,
  STRIPE_WEBHOOK_SECRET,
  WORKER_MODE,
  MINIO_ENDPOINT,
  MINIO_ACCESS_KEY,
  MINIO_SECRET_KEY,
  MINIO_BUCKET,
  MEILISEARCH_HOST,
  MEILISEARCH_ADMIN_KEY,
  // OAuth Providers
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET
} from 'lib/constants';

loadEnv(process.env.NODE_ENV, process.cwd());

const medusaConfig = {
  projectConfig: {
    databaseUrl: DATABASE_URL,
    databaseLogging: false,
    redisUrl: REDIS_URL,
    workerMode: WORKER_MODE,
    http: {
      adminCors: ADMIN_CORS,
      authCors: AUTH_CORS,
      storeCors: STORE_CORS,
      jwtSecret: JWT_SECRET,
      cookieSecret: COOKIE_SECRET
    },
    build: {
      rollupOptions: {
        external: ["@medusajs/dashboard"]
      }
    }
  },
  admin: {
    backendUrl: BACKEND_URL,
    disable: SHOULD_DISABLE_ADMIN,
  },
  modules: [
    // Core Medusa v2.10.2 Modules (automatically enabled):
    // ✅ API Key Module - Built-in authentication and resource scoping
    // ✅ Auth Module - User authentication and authorization  
    // ✅ Cart Module - Shopping cart functionality
    // ✅ Currency Module - Multi-currency support
    // ✅ Customer Module - Customer management
    // ✅ Fulfillment Module - Order fulfillment
    // ✅ Inventory Module - Stock management
    // ✅ Order Module - Order processing
    // ✅ Payment Module - Payment processing (configured with Stripe below)
    // ✅ Pricing Module - Dynamic pricing
    // ✅ Product Module - Product catalog
    // ✅ Promotion Module - Discounts and promotions
    // ✅ Region Module - Geographic regions
    // ✅ Sales Channel Module - Multi-channel sales
    // ✅ Stock Location Module - Warehouse management
    // ✅ Store Module - Store configuration
    // ✅ Tax Module - Tax calculations
    // ✅ User Module - Admin user management

    // OAuth Authentication Module
    ...(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET || GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET ? [{
      key: Modules.AUTH,
      resolve: '@medusajs/auth',
      options: {
        providers: [
          ...(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET ? [{
            resolve: '@medusajs/auth-google',
            id: 'google',
            options: {
              clientId: GOOGLE_CLIENT_ID,
              clientSecret: GOOGLE_CLIENT_SECRET,
            }
          }] : []),
          ...(GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET ? [{
            resolve: '@medusajs/auth-github',
            id: 'github',
            options: {
              clientId: GITHUB_CLIENT_ID,
              clientSecret: GITHUB_CLIENT_SECRET,
            }
          }] : []),
        ]
      }
    }] : []),

    {
      key: Modules.FILE,
      resolve: '@medusajs/file',
      options: {
        providers: [
          ...(MINIO_ENDPOINT && MINIO_ACCESS_KEY && MINIO_SECRET_KEY ? [{
            resolve: './src/modules/minio-file',
            id: 'minio',
            options: {
              endPoint: MINIO_ENDPOINT,
              accessKey: MINIO_ACCESS_KEY,
              secretKey: MINIO_SECRET_KEY,
              bucket: MINIO_BUCKET // Optional, default: medusa-media
            }
          }] : [{
            resolve: '@medusajs/file-local',
            id: 'local',
            options: {
              upload_dir: 'static',
              backend_url: `${BACKEND_URL}/static`
            }
          }])
        ]
      }
    },
    ...(REDIS_URL ? [{
      key: Modules.EVENT_BUS,
      resolve: '@medusajs/event-bus-redis',
      options: {
        redisUrl: REDIS_URL
      }
    },
    {
      key: Modules.WORKFLOW_ENGINE,
      resolve: '@medusajs/workflow-engine-redis',
      options: {
        redis: {
          url: REDIS_URL,
        }
      }
    }] : []),
    ...(SENDGRID_API_KEY && SENDGRID_FROM_EMAIL || RESEND_API_KEY && RESEND_FROM_EMAIL ? [{
      key: Modules.NOTIFICATION,
      resolve: '@medusajs/notification',
      options: {
        providers: [
          ...(SENDGRID_API_KEY && SENDGRID_FROM_EMAIL ? [{
            resolve: '@medusajs/notification-sendgrid',
            id: 'sendgrid',
            options: {
              channels: ['email'],
              api_key: SENDGRID_API_KEY,
              from: SENDGRID_FROM_EMAIL,
            }
          }] : []),
          ...(RESEND_API_KEY && RESEND_FROM_EMAIL ? [{
            resolve: './src/modules/email-notifications',
            id: 'resend',
            options: {
              channels: ['email'],
              api_key: RESEND_API_KEY,
              from: RESEND_FROM_EMAIL,
            },
          }] : []),
        ]
      }
    }] : []),
    ...(STRIPE_API_KEY && STRIPE_WEBHOOK_SECRET ? [{
      key: Modules.PAYMENT,
      resolve: '@medusajs/payment',
      options: {
        providers: [
          {
            resolve: '@medusajs/payment-stripe',
            id: 'stripe',
            options: {
              apiKey: STRIPE_API_KEY,
              webhookSecret: STRIPE_WEBHOOK_SECRET,
            },
          },
        ],
      },
    }] : []),

    // Custom Feature Modules
    {
      key: 'abandonedCartService',
      resolve: './src/modules/abandoned-cart',
    },
    {
      key: 'giftMessageService', 
      resolve: './src/modules/gift-message',
    },
    {
      key: 'loyaltyPointsService',
      resolve: './src/modules/loyalty-points',
    },
    {
      key: 'wishlistService',
      resolve: './src/modules/wishlist',
    },
    {
      key: 'productReviewsService',
      resolve: './src/modules/product-reviews',
    },
    {
      key: 'agenticCommerceService',
      resolve: './src/modules/agentic-commerce',
    },
    {
      key: 'customItemPricingService',
      resolve: './src/modules/custom-item-pricing',
    },
    {
      key: 'invoiceGenerationService',
      resolve: './src/modules/invoice-generation',
    },
    {
      key: 'firstPurchaseDiscountService',
      resolve: './src/modules/first-purchase-discount',
    },
    {
      key: 'metaProductFeedService',
      resolve: './src/modules/meta-product-feed',
    },
    {
      key: 'newsletterService',
      resolve: './src/modules/newsletter',
    },
    {
      key: 'phoneAuthService',
      resolve: './src/modules/phone-auth',
    },
    {
      key: 'productBuilderService',
      resolve: './src/modules/product-builder',
    },
    {
      key: 'quoteManagementService',
      resolve: './src/modules/quote-management',
    },
    {
      key: 'reorderService',
      resolve: './src/modules/reorder',
    },
    {
      key: 'savedPaymentMethodsService',
      resolve: './src/modules/saved-payment-methods',
    }
  ],
  plugins: [
  ...(MEILISEARCH_HOST && MEILISEARCH_ADMIN_KEY ? [{
      resolve: '@rokmohar/medusa-plugin-meilisearch',
      options: {
        config: {
          host: MEILISEARCH_HOST,
          apiKey: MEILISEARCH_ADMIN_KEY
        },
        settings: {
          products: {
            type: 'products',
            enabled: true,
            fields: ['id', 'title', 'description', 'handle', 'variant_sku', 'thumbnail'],
            indexSettings: {
              searchableAttributes: ['title', 'description', 'variant_sku'],
              displayedAttributes: ['id', 'handle', 'title', 'description', 'variant_sku', 'thumbnail'],
              filterableAttributes: ['id', 'handle'],
            },
            primaryKey: 'id',
          }
        }
      }
    }] : [])
  ]
};

console.log(JSON.stringify(medusaConfig, null, 2));
export default defineConfig(medusaConfig);
