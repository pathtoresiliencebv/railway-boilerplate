import { ICustomerModuleService, IProductModuleService, IOrderModuleService } from '@medusajs/framework/types'
import { Modules } from '@medusajs/framework/utils'

export interface ProductRecommendation {
  productId: string
  score: number
  reason: string
  confidence: number
}

export default class AgenticCommerceService {
  constructor(
    private container: any
  ) {}

  async getProductRecommendations(customerId: string, limit: number = 5): Promise<ProductRecommendation[]> {
    const customerModuleService: ICustomerModuleService = this.container.resolve(Modules.CUSTOMER)
    const productModuleService: IProductModuleService = this.container.resolve(Modules.PRODUCT)
    const orderModuleService: IOrderModuleService = this.container.resolve(Modules.ORDER)

    try {
      // Get customer data and order history
      const customer = await customerModuleService.retrieveCustomer(customerId)
      const orders = await orderModuleService.listOrders({ customer_id: customerId })
      
      // Analyze customer behavior
      const behaviorData = await this.analyzeCustomerBehavior(customer, orders)
      
      // Get all products for recommendation
      const products = await productModuleService.listProducts()
      
      // Generate AI-powered recommendations
      const recommendations = await this.generateRecommendations(behaviorData, products, limit)
      
      return recommendations
    } catch (error) {
      console.error('Error generating product recommendations:', error)
      throw error
    }
  }

  private async analyzeCustomerBehavior(customer: any, orders: any[]) {
    // Analyze purchase patterns, categories, price ranges, etc.
    const categories = new Set()
    const priceRanges = []
    const brands = new Set()
    
    orders.forEach(order => {
      order.items?.forEach((item: any) => {
        if (item.product?.categories) {
          item.product.categories.forEach((cat: any) => categories.add(cat.name))
        }
        if (item.product?.brand) {
          brands.add(item.product.brand)
        }
        priceRanges.push(item.unit_price)
      })
    })

    return {
      categories: Array.from(categories),
      brands: Array.from(brands),
      averagePrice: priceRanges.length > 0 ? priceRanges.reduce((a, b) => a + b, 0) / priceRanges.length : 0,
      totalOrders: orders.length,
      totalSpent: orders.reduce((sum, order) => sum + (order.total || 0), 0)
    }
  }

  private async generateRecommendations(behaviorData: any, products: any[], limit: number): Promise<ProductRecommendation[]> {
    // AI-powered recommendation algorithm
    const recommendations: ProductRecommendation[] = []
    
    for (const product of products) {
      let score = 0
      let reason = ""
      
      // Category matching
      if (product.categories?.some((cat: any) => behaviorData.categories.includes(cat.name))) {
        score += 0.3
        reason += "Based on your purchase history, "
      }
      
      // Brand preference
      if (product.brand && behaviorData.brands.includes(product.brand)) {
        score += 0.2
        reason += "from brands you love, "
      }
      
      // Price range preference
      const productPrice = product.variants?.[0]?.prices?.[0]?.amount || 0
      const priceDiff = Math.abs(productPrice - behaviorData.averagePrice)
      if (priceDiff < behaviorData.averagePrice * 0.5) {
        score += 0.2
        reason += "in your preferred price range, "
      }
      
      // Popularity boost
      if (product.metadata?.popularity_score) {
        score += product.metadata.popularity_score * 0.1
        reason += "trending item, "
      }
      
      // New customer recommendations
      if (behaviorData.totalOrders === 0) {
        score += 0.4
        reason = "Popular choice for new customers, "
      }
      
      if (score > 0.1) {
        recommendations.push({
          productId: product.id,
          score: Math.min(score, 1),
          reason: reason.slice(0, -2) + ".",
          confidence: Math.min(score * 100, 95)
        })
      }
    }
    
    // Sort by score and return top recommendations
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
  }

  async trackCustomerBehavior(customerId: string, action: string, productId?: string) {
    const customerModuleService: ICustomerModuleService = this.container.resolve(Modules.CUSTOMER)
    
    try {
      const customer = await customerModuleService.retrieveCustomer(customerId)
      const behaviorData = customer.metadata?.behavior_data || {}
      
      // Track different types of behavior
      if (!behaviorData[action]) {
        behaviorData[action] = []
      }
      
      behaviorData[action].push({
        productId,
        timestamp: new Date().toISOString(),
        sessionId: `session_${Date.now()}`
      })
      
      await customerModuleService.updateCustomers(customerId, {
        metadata: {
          ...customer.metadata,
          behavior_data: behaviorData
        }
      })
    } catch (error) {
      console.error('Error tracking customer behavior:', error)
    }
  }
}
