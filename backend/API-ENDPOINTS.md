# 🔌 Custom Modules API Endpoints

## Overview
This document lists all API endpoints for the 15 custom modules and 6 recipe workflows implemented in the Medusa backend.

## 📋 Module Endpoints

### 1. Abandoned Cart Module
**Base Path:** `/admin/abandoned-cart`

#### Endpoints
```http
POST /admin/abandoned-cart/track
Content-Type: application/json
{
  "cartId": "cart_123",
  "customerId": "cust_123",
  "lastActivity": "2024-01-15T10:30:00Z"
}

GET /admin/abandoned-cart/list
Query: ?status=pending&limit=50&offset=0

POST /admin/abandoned-cart/remind
Content-Type: application/json
{
  "cartId": "cart_123",
  "email": "customer@example.com"
}

GET /admin/abandoned-cart/stats
```

### 2. Gift Message Module
**Base Path:** `/admin/gift-message`

#### Endpoints
```http
POST /admin/gift-message/add
Content-Type: application/json
{
  "orderId": "order_123",
  "message": "Happy Birthday!",
  "recipientName": "John Doe",
  "recipientEmail": "john@example.com"
}

GET /admin/gift-message/:orderId

PUT /admin/gift-message/:orderId
Content-Type: application/json
{
  "message": "Updated message",
  "recipientName": "Jane Doe"
}

DELETE /admin/gift-message/:orderId
```

### 3. Loyalty Points Module
**Base Path:** `/admin/loyalty-points`

#### Endpoints
```http
POST /admin/loyalty-points/award
Content-Type: application/json
{
  "customerId": "cust_123",
  "points": 100,
  "reason": "Purchase bonus"
}

POST /admin/loyalty-points/redeem
Content-Type: application/json
{
  "customerId": "cust_123",
  "points": 50,
  "reason": "Discount redemption"
}

GET /admin/loyalty-points/balance/:customerId

GET /admin/loyalty-points/history/:customerId
Query: ?limit=20&offset=0

GET /admin/loyalty-points/stats
```

### 4. Wishlist Module
**Base Path:** `/admin/wishlist`

#### Endpoints
```http
POST /admin/wishlist/add
Content-Type: application/json
{
  "customerId": "cust_123",
  "productId": "prod_123",
  "variantId": "variant_123"
}

DELETE /admin/wishlist/remove
Content-Type: application/json
{
  "customerId": "cust_123",
  "productId": "prod_123"
}

GET /admin/wishlist/:customerId

POST /admin/wishlist/share
Content-Type: application/json
{
  "customerId": "cust_123",
  "shareWith": "friend@example.com"
}

GET /admin/wishlist/stats
```

### 5. Product Reviews Module
**Base Path:** `/admin/product-reviews`

#### Endpoints
```http
POST /admin/product-reviews/create
Content-Type: application/json
{
  "productId": "prod_123",
  "customerId": "cust_123",
  "rating": 5,
  "title": "Great product!",
  "comment": "Really happy with this purchase"
}

GET /admin/product-reviews/product/:productId
Query: ?status=approved&limit=20&offset=0

PUT /admin/product-reviews/:reviewId/approve

PUT /admin/product-reviews/:reviewId/reject
Content-Type: application/json
{
  "reason": "Inappropriate content"
}

GET /admin/product-reviews/stats
```

### 6. Agentic Commerce Module
**Base Path:** `/admin/agentic-commerce`

#### Endpoints
```http
GET /admin/agentic-commerce/recommendations/:customerId
Query: ?limit=10&category=electronics

POST /admin/agentic-commerce/track-behavior
Content-Type: application/json
{
  "customerId": "cust_123",
  "action": "view_product",
  "productId": "prod_123",
  "sessionId": "session_456"
}

GET /admin/agentic-commerce/insights/:customerId

GET /admin/agentic-commerce/trending
Query: ?period=7d&category=all
```

### 7. Custom Item Pricing Module
**Base Path:** `/admin/custom-pricing`

#### Endpoints
```http
POST /admin/custom-pricing/rules
Content-Type: application/json
{
  "customerId": "cust_123",
  "productId": "prod_123",
  "type": "percentage",
  "value": 10,
  "startDate": "2024-01-01",
  "endDate": "2024-12-31"
}

GET /admin/custom-pricing/rules/:customerId

PUT /admin/custom-pricing/rules/:ruleId
Content-Type: application/json
{
  "value": 15,
  "isActive": true
}

DELETE /admin/custom-pricing/rules/:ruleId

GET /admin/custom-pricing/calculate
Query: ?customerId=cust_123&productId=prod_123&quantity=2
```

### 8. Invoice Generation Module
**Base Path:** `/admin/invoices`

#### Endpoints
```http
POST /admin/invoices/generate
Content-Type: application/json
{
  "orderId": "order_123",
  "template": "standard"
}

GET /admin/invoices/:invoiceId

GET /admin/invoices/order/:orderId

POST /admin/invoices/:invoiceId/send
Content-Type: application/json
{
  "email": "customer@example.com"
}

GET /admin/invoices/list
Query: ?status=paid&limit=50&offset=0

GET /admin/invoices/stats
```

### 9. First Purchase Discount Module
**Base Path:** `/admin/first-purchase`

#### Endpoints
```http
POST /admin/first-purchase/discount
Content-Type: application/json
{
  "customerId": "cust_123",
  "amount": 10,
  "type": "percentage",
  "expiresInDays": 30
}

GET /admin/first-purchase/check/:customerId

POST /admin/first-purchase/apply
Content-Type: application/json
{
  "customerId": "cust_123",
  "orderId": "order_123"
}

GET /admin/first-purchase/stats
```

### 10. Meta Product Feed Module
**Base Path:** `/admin/meta-feed`

#### Endpoints
```http
GET /admin/meta-feed/generate
Query: ?format=xml&includeImages=true

GET /admin/meta-feed/validate
Query: ?feedId=feed_123

POST /admin/meta-feed/schedule
Content-Type: application/json
{
  "frequency": "daily",
  "time": "02:00"
}

GET /admin/meta-feed/stats

GET /admin/meta-feed/download
Query: ?format=xml
```

### 11. Newsletter Module
**Base Path:** `/admin/newsletter`

#### Endpoints
```http
POST /admin/newsletter/subscribe
Content-Type: application/json
{
  "email": "user@example.com",
  "firstName": "John",
  "preferences": {
    "productUpdates": true,
    "promotions": true,
    "news": false
  }
}

DELETE /admin/newsletter/unsubscribe
Content-Type: application/json
{
  "email": "user@example.com"
}

POST /admin/newsletter/campaigns
Content-Type: application/json
{
  "name": "Summer Sale",
  "subject": "50% Off Everything!",
  "content": "<html>...</html>",
  "template": "promotion"
}

GET /admin/newsletter/campaigns
Query: ?status=draft&limit=20&offset=0

POST /admin/newsletter/campaigns/:campaignId/send

GET /admin/newsletter/stats
```

### 12. Phone Auth Module
**Base Path:** `/admin/phone-auth`

#### Endpoints
```http
POST /admin/phone-auth/send-code
Content-Type: application/json
{
  "phoneNumber": "+1234567890"
}

POST /admin/phone-auth/verify
Content-Type: application/json
{
  "phoneNumber": "+1234567890",
  "code": "123456"
}

POST /admin/phone-auth/authenticate
Content-Type: application/json
{
  "phoneNumber": "+1234567890",
  "code": "123456"
}

GET /admin/phone-auth/session/:sessionId

DELETE /admin/phone-auth/logout/:sessionId
```

### 13. Product Builder Module
**Base Path:** `/admin/product-builder`

#### Endpoints
```http
POST /admin/product-builder/templates
Content-Type: application/json
{
  "productId": "prod_123",
  "name": "Custom T-Shirt",
  "options": [
    {
      "id": "size",
      "name": "Size",
      "type": "select",
      "required": true,
      "choices": ["S", "M", "L", "XL"]
    }
  ]
}

GET /admin/product-builder/templates/:productId

POST /admin/product-builder/configurations
Content-Type: application/json
{
  "productId": "prod_123",
  "customerId": "cust_123",
  "options": {
    "size": "L",
    "color": "red"
  },
  "customizations": {
    "text": "Hello World"
  }
}

GET /admin/product-builder/configurations/:customerId

PUT /admin/product-builder/configurations/:configId
Content-Type: application/json
{
  "options": {
    "size": "XL"
  }
}
```

### 14. Quote Management Module
**Base Path:** `/admin/quotes`

#### Endpoints
```http
POST /admin/quotes/requests
Content-Type: application/json
{
  "customerEmail": "customer@example.com",
  "customerName": "John Doe",
  "items": [
    {
      "productId": "prod_123",
      "productName": "Custom Product",
      "quantity": 10,
      "specifications": "Special requirements"
    }
  ]
}

GET /admin/quotes/requests
Query: ?status=pending&limit=20&offset=0

PUT /admin/quotes/requests/:requestId/status
Content-Type: application/json
{
  "status": "approved",
  "notes": "Approved with modifications"
}

POST /admin/quotes/responses
Content-Type: application/json
{
  "requestId": "req_123",
  "items": [
    {
      "productId": "prod_123",
      "unitPrice": 25.00,
      "totalPrice": 250.00,
      "notes": "Bulk discount applied"
    }
  ],
  "subtotal": 250.00,
  "taxAmount": 20.00,
  "totalAmount": 270.00
}

GET /admin/quotes/stats
```

### 15. Reorder Module
**Base Path:** `/admin/reorder`

#### Endpoints
```http
POST /admin/reorder/create
Content-Type: application/json
{
  "customerId": "cust_123",
  "orderId": "order_123"
}

GET /admin/reorder/items/:customerId

POST /admin/reorder/presets
Content-Type: application/json
{
  "customerId": "cust_123",
  "name": "Weekly Order",
  "items": [
    {
      "variantId": "variant_123",
      "productId": "prod_123",
      "quantity": 2
    }
  ]
}

GET /admin/reorder/presets/:customerId

POST /admin/reorder/add-to-cart
Content-Type: application/json
{
  "reorderId": "reorder_123",
  "cartId": "cart_123"
}

GET /admin/reorder/stats/:customerId
```

### 16. Saved Payment Methods Module
**Base Path:** `/admin/saved-payment-methods`

#### Endpoints
```http
POST /admin/saved-payment-methods/save
Content-Type: application/json
{
  "customerId": "cust_123",
  "type": "card",
  "provider": "stripe",
  "providerPaymentMethodId": "pm_123",
  "metadata": {
    "last4": "4242",
    "brand": "visa",
    "expiryMonth": 12,
    "expiryYear": 2025
  }
}

GET /admin/saved-payment-methods/:customerId

PUT /admin/saved-payment-methods/:methodId/set-default

DELETE /admin/saved-payment-methods/:methodId

POST /admin/saved-payment-methods/tokens
Content-Type: application/json
{
  "customerId": "cust_123",
  "paymentMethodId": "pm_123"
}

GET /admin/saved-payment-methods/stats/:customerId
```

### 17. Webhooks Module
**Base Path:** `/admin/webhooks`

#### Endpoints
```http
GET /admin/webhooks
Query: ?isActive=true&limit=20&offset=0

POST /admin/webhooks
Content-Type: application/json
{
  "url": "https://example.com/webhook",
  "events": ["order.placed", "product.created"],
  "secret": "optional-secret-key"
}

GET /admin/webhooks/:id

PUT /admin/webhooks/:id
Content-Type: application/json
{
  "url": "https://new-example.com/webhook",
  "events": ["order.placed", "order.updated"],
  "isActive": true
}

DELETE /admin/webhooks/:id

POST /admin/webhooks/:id/test
```

## 🔄 Recipe Workflow Endpoints

### 1. Product Bundle Recipe
**Base Path:** `/admin/bundles`

#### Endpoints
```http
POST /admin/bundles/create
Content-Type: application/json
{
  "customerId": "cust_123",
  "bundleId": "bundle_123",
  "quantity": 2,
  "customizations": {
    "giftWrap": true,
    "message": "Happy Birthday!"
  }
}

GET /admin/bundles/templates

POST /admin/bundles/calculate
Content-Type: application/json
{
  "bundleId": "bundle_123",
  "quantity": 2
}
```

### 2. Commerce Automation Recipe
**Base Path:** `/admin/automation`

#### Endpoints
```http
POST /admin/automation/rules
Content-Type: application/json
{
  "name": "Welcome New Customer",
  "trigger": "customer_registered",
  "conditions": {
    "customer_type": "new"
  },
  "actions": [
    {
      "type": "send_email",
      "config": {
        "template": "welcome"
      }
    }
  ]
}

GET /admin/automation/rules

POST /admin/automation/execute
Content-Type: application/json
{
  "trigger": "order_created",
  "triggerData": {
    "orderId": "order_123",
    "customerId": "cust_123"
  }
}

GET /admin/automation/executions
Query: ?status=completed&limit=20&offset=0
```

### 3. Personalized Products Recipe
**Base Path:** `/admin/personalized-products`

#### Endpoints
```http
POST /admin/personalized-products/configure
Content-Type: application/json
{
  "productId": "prod_123",
  "customerId": "cust_123",
  "personalizations": {
    "engraving": "Happy Birthday!",
    "color": "red"
  },
  "customizations": {
    "giftBox": true
  }
}

GET /admin/personalized-products/templates/:productId

POST /admin/personalized-products/preview
Content-Type: application/json
{
  "productId": "prod_123",
  "personalizations": {
    "engraving": "Sample Text"
  }
}

GET /admin/personalized-products/configurations/:customerId
```

### 4. Omnichannel Recipe
**Base Path:** `/admin/omnichannel`

#### Endpoints
```http
POST /admin/omnichannel/sync-inventory
Content-Type: application/json
{
  "productId": "prod_123",
  "variantId": "variant_123",
  "quantityChange": -5
}

POST /admin/omnichannel/sync-customer
Content-Type: application/json
{
  "customerId": "cust_123",
  "channelId": "online",
  "customerData": {
    "preferences": {
      "language": "en",
      "currency": "USD"
    }
  }
}

POST /admin/omnichannel/process-order
Content-Type: application/json
{
  "orderId": "order_123",
  "channelId": "store_1",
  "customerId": "cust_123"
}

GET /admin/omnichannel/reports
Query: ?startDate=2024-01-01&endDate=2024-01-31&channelId=online
```

### 5. OMS Recipe
**Base Path:** `/admin/oms`

#### Endpoints
```http
POST /admin/oms/route-order
Content-Type: application/json
{
  "orderId": "order_123",
  "items": [
    {
      "productId": "prod_123",
      "variantId": "variant_123",
      "quantity": 2
    }
  ],
  "priority": "high"
}

GET /admin/oms/warehouses

POST /admin/oms/optimize-routing
Content-Type: application/json
{
  "orderId": "order_123",
  "items": [
    {
      "productId": "prod_123",
      "variantId": "variant_123",
      "quantity": 2
    }
  ]
}

GET /admin/oms/order-routes/:orderId
```

### 6. POS Recipe
**Base Path:** `/admin/pos`

#### Endpoints
```http
POST /admin/pos/process-order
Content-Type: application/json
{
  "deviceId": "pos_001",
  "customerId": "cust_123",
  "items": [
    {
      "productId": "prod_123",
      "variantId": "variant_123",
      "quantity": 1,
      "unitPrice": 25.00
    }
  ],
  "paymentMethod": "cash"
}

POST /admin/pos/process-payment
Content-Type: application/json
{
  "posOrderId": "pos_order_123",
  "paymentMethod": "card",
  "amount": 25.00
}

POST /admin/pos/generate-receipt
Content-Type: application/json
{
  "posOrderId": "pos_order_123",
  "deviceId": "pos_001"
}

POST /admin/pos/sync-inventory
Content-Type: application/json
{
  "deviceId": "pos_001",
  "productId": "prod_123",
  "variantId": "variant_123",
  "quantityChange": -1
}

POST /admin/pos/process-refund
Content-Type: application/json
{
  "posOrderId": "pos_order_123",
  "refundAmount": 25.00,
  "reason": "Customer request"
}
```

## 🔐 Authentication

All admin endpoints require authentication. Include the admin JWT token in the Authorization header:

```http
Authorization: Bearer <admin_jwt_token>
```

## 📊 Response Formats

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input parameters",
    "details": { ... }
  }
}
```

## 🧪 Testing

Use the provided endpoints to test all custom modules and workflows. Each module includes comprehensive error handling and validation.

---

**API Documentation Complete!** 🎉

All 15 custom modules and 6 recipe workflows are now documented with their respective API endpoints for easy integration and testing.
