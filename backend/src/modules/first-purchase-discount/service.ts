import { ICustomerModuleService, IOrderModuleService, IPromotionModuleService } from '@medusajs/framework/types'
import { Modules } from '@medusajs/framework/utils'

export interface FirstPurchaseDiscount {
  id: string
  customerId: string
  discountCode: string
  discountAmount: number
  discountType: 'percentage' | 'fixed'
  isUsed: boolean
  createdAt: Date
  expiresAt: Date
}

export default class FirstPurchaseDiscountService {
  constructor(
    private container: any
  ) {}

  async createFirstPurchaseDiscount(customerId: string, discountConfig: {
    amount: number
    type: 'percentage' | 'fixed'
    expiresInDays?: number
  }): Promise<FirstPurchaseDiscount> {
    const customerModuleService: ICustomerModuleService = this.container.resolve(Modules.CUSTOMER)
    
    try {
      // Check if customer already has a first purchase discount
      const existingDiscount = await this.getFirstPurchaseDiscount(customerId)
      if (existingDiscount && !existingDiscount.isUsed) {
        return existingDiscount
      }

      const discountCode = this.generateDiscountCode()
      const expiresAt = new Date(Date.now() + (discountConfig.expiresInDays || 30) * 24 * 60 * 60 * 1000)

      const discount: FirstPurchaseDiscount = {
        id: `fp_discount_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        customerId,
        discountCode,
        discountAmount: discountConfig.amount,
        discountType: discountConfig.type,
        isUsed: false,
        createdAt: new Date(),
        expiresAt
      }

      // Store discount in customer metadata
      const customer = await customerModuleService.retrieveCustomer(customerId)
      const firstPurchaseDiscounts = customer.metadata?.first_purchase_discounts || []
      firstPurchaseDiscounts.push(discount)

      await customerModuleService.updateCustomers(customerId, {
        metadata: {
          ...customer.metadata,
          first_purchase_discounts: firstPurchaseDiscounts
        }
      })

      return discount
    } catch (error) {
      console.error('Error creating first purchase discount:', error)
      throw error
    }
  }

  async checkFirstTimeCustomer(customerId: string): Promise<boolean> {
    const orderModuleService: IOrderModuleService = this.container.resolve(Modules.ORDER)
    
    try {
      const orders = await orderModuleService.listOrders({ 
        customer_id: customerId,
        status: ['completed', 'shipped', 'delivered']
      })
      
      return orders.length === 0
    } catch (error) {
      console.error('Error checking first time customer:', error)
      return false
    }
  }

  async getFirstPurchaseDiscount(customerId: string): Promise<FirstPurchaseDiscount | null> {
    const customerModuleService: ICustomerModuleService = this.container.resolve(Modules.CUSTOMER)
    
    try {
      const customer = await customerModuleService.retrieveCustomer(customerId)
      const discounts = customer.metadata?.first_purchase_discounts || []
      
      // Find the most recent unused discount
      const activeDiscount = discounts
        .filter((discount: FirstPurchaseDiscount) => !discount.isUsed && new Date(discount.expiresAt) > new Date())
        .sort((a: FirstPurchaseDiscount, b: FirstPurchaseDiscount) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0]
      
      return activeDiscount || null
    } catch (error) {
      console.error('Error retrieving first purchase discount:', error)
      return null
    }
  }

  async applyFirstPurchaseDiscount(customerId: string, orderTotal: number): Promise<{
    discountAmount: number
    finalTotal: number
    discountCode: string
  } | null> {
    const discount = await this.getFirstPurchaseDiscount(customerId)
    
    if (!discount) {
      return null
    }

    let discountAmount = 0
    
    if (discount.discountType === 'percentage') {
      discountAmount = (orderTotal * discount.discountAmount) / 100
    } else {
      discountAmount = Math.min(discount.discountAmount, orderTotal)
    }

    const finalTotal = Math.max(orderTotal - discountAmount, 0)

    return {
      discountAmount,
      finalTotal,
      discountCode: discount.discountCode
    }
  }

  async markDiscountAsUsed(customerId: string, discountId: string): Promise<void> {
    const customerModuleService: ICustomerModuleService = this.container.resolve(Modules.CUSTOMER)
    
    try {
      const customer = await customerModuleService.retrieveCustomer(customerId)
      const discounts = customer.metadata?.first_purchase_discounts || []
      
      const discountIndex = discounts.findIndex((d: FirstPurchaseDiscount) => d.id === discountId)
      if (discountIndex !== -1) {
        discounts[discountIndex].isUsed = true
        
        await customerModuleService.updateCustomers(customerId, {
          metadata: {
            ...customer.metadata,
            first_purchase_discounts: discounts
          }
        })
      }
    } catch (error) {
      console.error('Error marking discount as used:', error)
      throw error
    }
  }

  async autoApplyFirstPurchaseDiscount(customerId: string, orderId: string): Promise<boolean> {
    try {
      const isFirstTime = await this.checkFirstTimeCustomer(customerId)
      
      if (!isFirstTime) {
        return false
      }

      // Create a default first purchase discount
      const discount = await this.createFirstPurchaseDiscount(customerId, {
        amount: 10, // 10% discount
        type: 'percentage',
        expiresInDays: 30
      })

      // Auto-apply the discount to the order
      const orderModuleService: IOrderModuleService = this.container.resolve(Modules.ORDER)
      const order = await orderModuleService.retrieveOrder(orderId)
      
      await orderModuleService.updateOrders(orderId, {
        metadata: {
          ...order.metadata,
          first_purchase_discount_applied: true,
          first_purchase_discount_id: discount.id,
          first_purchase_discount_code: discount.discountCode
        }
      })

      return true
    } catch (error) {
      console.error('Error auto-applying first purchase discount:', error)
      return false
    }
  }

  private generateDiscountCode(): string {
    const prefix = 'WELCOME'
    const random = Math.random().toString(36).substr(2, 6).toUpperCase()
    return `${prefix}${random}`
  }

  async getDiscountStats(): Promise<{
    totalDiscountsCreated: number
    totalDiscountsUsed: number
    totalDiscountValue: number
  }> {
    // This would aggregate statistics from all customers
    // For now, return placeholder data
    return {
      totalDiscountsCreated: 0,
      totalDiscountsUsed: 0,
      totalDiscountValue: 0
    }
  }
}
