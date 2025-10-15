import { ICustomerModuleService, IProductModuleService, IPricingModuleService } from '@medusajs/framework/types'
import { Modules } from '@medusajs/framework/utils'

export interface CustomPriceRule {
  id: string
  customerId?: string
  customerGroupId?: string
  productId?: string
  categoryId?: string
  type: 'percentage' | 'fixed' | 'volume'
  value: number
  minQuantity?: number
  maxQuantity?: number
  startDate?: Date
  endDate?: Date
  isActive: boolean
}

export default class CustomItemPricingService {
  constructor(
    private container: any
  ) {}

  async createCustomPriceRule(ruleData: Omit<CustomPriceRule, 'id'>): Promise<CustomPriceRule> {
    const customerModuleService: ICustomerModuleService = this.container.resolve(Modules.CUSTOMER)
    
    try {
      const rule: CustomPriceRule = {
        id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...ruleData,
        isActive: true
      }

      // Store rule in customer metadata or create a separate pricing rules system
      if (ruleData.customerId) {
        const customer = await customerModuleService.retrieveCustomer(ruleData.customerId)
        const customPricingRules: CustomPriceRule[] = (customer.metadata?.custom_pricing_rules as CustomPriceRule[]) || []
        customPricingRules.push(rule)

        await customerModuleService.updateCustomers(ruleData.customerId, {
          metadata: {
            ...customer.metadata,
            custom_pricing_rules: customPricingRules
          }
        })
      }

      return rule
    } catch (error) {
      console.error('Error creating custom price rule:', error)
      throw error
    }
  }

  async calculateCustomPrice(customerId: string, productId: string, quantity: number, basePrice: number): Promise<number> {
    const customerModuleService: ICustomerModuleService = this.container.resolve(Modules.CUSTOMER)
    const productModuleService: IProductModuleService = this.container.resolve(Modules.PRODUCT)
    
    try {
      const customer = await customerModuleService.retrieveCustomer(customerId)
      const product = await productModuleService.retrieveProduct(productId)
      
      const customPricingRules: CustomPriceRule[] = (customer.metadata?.custom_pricing_rules as CustomPriceRule[]) || []
      const applicableRules = this.getApplicableRules(customPricingRules, productId, quantity)
      
      let finalPrice = basePrice
      
      for (const rule of applicableRules) {
        finalPrice = this.applyPriceRule(finalPrice, rule)
      }
      
      return Math.max(finalPrice, 0) // Ensure price is not negative
    } catch (error) {
      console.error('Error calculating custom price:', error)
      return basePrice
    }
  }

  private getApplicableRules(rules: CustomPriceRule[], productId: string, quantity: number): CustomPriceRule[] {
    const now = new Date()
    
    return rules.filter(rule => {
      if (!rule.isActive) return false
      
      // Check date range
      if (rule.startDate && rule.startDate > now) return false
      if (rule.endDate && rule.endDate < now) return false
      
      // Check product match
      if (rule.productId && rule.productId !== productId) return false
      
      // Check quantity range
      if (rule.minQuantity && quantity < rule.minQuantity) return false
      if (rule.maxQuantity && quantity > rule.maxQuantity) return false
      
      return true
    }).sort((a, b) => {
      // Prioritize more specific rules (product-specific over category-specific)
      if (a.productId && !b.productId) return -1
      if (!a.productId && b.productId) return 1
      return 0
    })
  }

  private applyPriceRule(price: number, rule: CustomPriceRule): number {
    switch (rule.type) {
      case 'percentage':
        return price * (1 - rule.value / 100)
      case 'fixed':
        return price - rule.value
      case 'volume':
        // Volume discount - apply percentage discount based on quantity
        const discountPercentage = Math.min(rule.value, 50) // Max 50% discount
        return price * (1 - discountPercentage / 100)
      default:
        return price
    }
  }

  async getVolumeDiscounts(productId: string): Promise<Array<{quantity: number, discount: number}>> {
    // Return volume discount tiers for a product
    return [
      { quantity: 10, discount: 5 },
      { quantity: 25, discount: 10 },
      { quantity: 50, discount: 15 },
      { quantity: 100, discount: 20 }
    ]
  }

  async getCustomerPricingRules(customerId: string): Promise<CustomPriceRule[]> {
    const customerModuleService: ICustomerModuleService = this.container.resolve(Modules.CUSTOMER)
    
    try {
      const customer = await customerModuleService.retrieveCustomer(customerId)
      return (customer.metadata?.custom_pricing_rules as CustomPriceRule[]) || []
    } catch (error) {
      console.error('Error retrieving customer pricing rules:', error)
      return []
    }
  }

  async updatePricingRule(customerId: string, ruleId: string, updates: Partial<CustomPriceRule>): Promise<CustomPriceRule | null> {
    const customerModuleService: ICustomerModuleService = this.container.resolve(Modules.CUSTOMER)
    
    try {
      const customer = await customerModuleService.retrieveCustomer(customerId)
      const customPricingRules: CustomPriceRule[] = (customer.metadata?.custom_pricing_rules as CustomPriceRule[]) || []
      
      const ruleIndex = customPricingRules.findIndex((rule: CustomPriceRule) => rule.id === ruleId)
      if (ruleIndex === -1) return null
      
      customPricingRules[ruleIndex] = { ...customPricingRules[ruleIndex], ...updates }
      
      await customerModuleService.updateCustomers(customerId, {
        metadata: {
          ...customer.metadata,
          custom_pricing_rules: customPricingRules
        }
      })
      
      return customPricingRules[ruleIndex]
    } catch (error) {
      console.error('Error updating pricing rule:', error)
      throw error
    }
  }
}
