import { ICustomerModuleService, IPaymentModuleService } from '@medusajs/framework/types'
import { Modules } from '@medusajs/framework/utils'

export interface SavedPaymentMethod {
  id: string
  customerId: string
  type: 'card' | 'bank_account' | 'paypal' | 'apple_pay' | 'google_pay'
  provider: 'stripe' | 'paypal' | 'square' | 'adyen'
  providerPaymentMethodId: string
  isDefault: boolean
  metadata: {
    last4?: string
    brand?: string
    expiryMonth?: number
    expiryYear?: number
    bankName?: string
    accountType?: string
    email?: string
  }
  billingAddress?: {
    firstName: string
    lastName: string
    address1: string
    address2?: string
    city: string
    postalCode: string
    countryCode: string
    phone?: string
  }
  isActive: boolean
  createdAt: Date
  lastUsedAt?: Date
  useCount: number
}

export interface PaymentMethodToken {
  id: string
  customerId: string
  paymentMethodId: string
  token: string
  expiresAt: Date
  isUsed: boolean
  createdAt: Date
}

export default class SavedPaymentMethodsService {
  constructor(
    private container: any
  ) {}

  async savePaymentMethod(
    customerId: string,
    paymentMethodData: Omit<SavedPaymentMethod, 'id' | 'customerId' | 'createdAt' | 'useCount'>
  ): Promise<SavedPaymentMethod> {
    const customerModuleService: ICustomerModuleService = this.container.resolve(Modules.CUSTOMER)
    
    try {
      const savedPaymentMethod: SavedPaymentMethod = {
        id: `payment_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        customerId,
        ...paymentMethodData,
        createdAt: new Date(),
        useCount: 0
      }

      // Get customer's existing payment methods
      const customer = await customerModuleService.retrieveCustomer(customerId)
      const savedPaymentMethods: SavedPaymentMethod[] = customer.metadata?.saved_payment_methods || []

      // If this is set as default, unset other defaults
      if (savedPaymentMethod.isDefault) {
        savedPaymentMethods.forEach((method: SavedPaymentMethod) => {
          method.isDefault = false
        })
      }

      savedPaymentMethods.push(savedPaymentMethod)

      // Update customer metadata
      await customerModuleService.updateCustomers(customerId, {
        metadata: {
          ...customer.metadata,
          saved_payment_methods: savedPaymentMethods
        }
      })

      return savedPaymentMethod
    } catch (error) {
      console.error('Error saving payment method:', error)
      throw error
    }
  }

  async getCustomerPaymentMethods(customerId: string): Promise<SavedPaymentMethod[]> {
    const customerModuleService: ICustomerModuleService = this.container.resolve(Modules.CUSTOMER)
    
    try {
      const customer = await customerModuleService.retrieveCustomer(customerId)
      return (customer.metadata?.saved_payment_methods as SavedPaymentMethod[]) || []
    } catch (error) {
      console.error('Error retrieving customer payment methods:', error)
      return []
    }
  }

  async getDefaultPaymentMethod(customerId: string): Promise<SavedPaymentMethod | null> {
    const paymentMethods = await this.getCustomerPaymentMethods(customerId)
    return paymentMethods.find(method => method.isDefault && method.isActive) || null
  }

  async setDefaultPaymentMethod(customerId: string, paymentMethodId: string): Promise<void> {
    const customerModuleService: ICustomerModuleService = this.container.resolve(Modules.CUSTOMER)
    
    try {
      const customer = await customerModuleService.retrieveCustomer(customerId)
      const savedPaymentMethods: SavedPaymentMethod[] = (customer.metadata?.saved_payment_methods as SavedPaymentMethod[]) || []

      // Find and update the payment method
      const paymentMethod = savedPaymentMethods.find((method: SavedPaymentMethod) => method.id === paymentMethodId)
      if (!paymentMethod) {
        throw new Error('Payment method not found')
      }

      // Unset all other defaults
      savedPaymentMethods.forEach((method: SavedPaymentMethod) => {
        method.isDefault = method.id === paymentMethodId
      })

      // Update customer metadata
      await customerModuleService.updateCustomers(customerId, {
        metadata: {
          ...customer.metadata,
          saved_payment_methods: savedPaymentMethods
        }
      })
    } catch (error) {
      console.error('Error setting default payment method:', error)
      throw error
    }
  }

  async deletePaymentMethod(customerId: string, paymentMethodId: string): Promise<void> {
    const customerModuleService: ICustomerModuleService = this.container.resolve(Modules.CUSTOMER)
    
    try {
      const customer = await customerModuleService.retrieveCustomer(customerId)
      const savedPaymentMethods: SavedPaymentMethod[] = (customer.metadata?.saved_payment_methods as SavedPaymentMethod[]) || []

      // Remove the payment method
      const updatedMethods = savedPaymentMethods.filter((method: SavedPaymentMethod) => method.id !== paymentMethodId)

      // Update customer metadata
      await customerModuleService.updateCustomers(customerId, {
        metadata: {
          ...customer.metadata,
          saved_payment_methods: updatedMethods
        }
      })
    } catch (error) {
      console.error('Error deleting payment method:', error)
      throw error
    }
  }

  async updatePaymentMethod(
    customerId: string,
    paymentMethodId: string,
    updates: Partial<Pick<SavedPaymentMethod, 'billingAddress' | 'isDefault' | 'isActive'>>
  ): Promise<SavedPaymentMethod> {
    const customerModuleService: ICustomerModuleService = this.container.resolve(Modules.CUSTOMER)
    
    try {
      const customer = await customerModuleService.retrieveCustomer(customerId)
      const savedPaymentMethods: SavedPaymentMethod[] = (customer.metadata?.saved_payment_methods as SavedPaymentMethod[]) || []

      const paymentMethod = savedPaymentMethods.find((method: SavedPaymentMethod) => method.id === paymentMethodId)
      if (!paymentMethod) {
        throw new Error('Payment method not found')
      }

      // Update the payment method
      Object.assign(paymentMethod, updates)

      // If setting as default, unset other defaults
      if (updates.isDefault) {
        savedPaymentMethods.forEach((method: SavedPaymentMethod) => {
          if (method.id !== paymentMethodId) {
            method.isDefault = false
          }
        })
      }

      // Update customer metadata
      await customerModuleService.updateCustomers(customerId, {
        metadata: {
          ...customer.metadata,
          saved_payment_methods: savedPaymentMethods
        }
      })

      return paymentMethod
    } catch (error) {
      console.error('Error updating payment method:', error)
      throw error
    }
  }

  async usePaymentMethod(customerId: string, paymentMethodId: string): Promise<void> {
    const customerModuleService: ICustomerModuleService = this.container.resolve(Modules.CUSTOMER)
    
    try {
      const customer = await customerModuleService.retrieveCustomer(customerId)
      const savedPaymentMethods: SavedPaymentMethod[] = (customer.metadata?.saved_payment_methods as SavedPaymentMethod[]) || []

      const paymentMethod = savedPaymentMethods.find((method: SavedPaymentMethod) => method.id === paymentMethodId)
      if (!paymentMethod) {
        throw new Error('Payment method not found')
      }

      // Update usage statistics
      paymentMethod.lastUsedAt = new Date()
      paymentMethod.useCount++

      // Update customer metadata
      await customerModuleService.updateCustomers(customerId, {
        metadata: {
          ...customer.metadata,
          saved_payment_methods: savedPaymentMethods
        }
      })
    } catch (error) {
      console.error('Error using payment method:', error)
      throw error
    }
  }

  async createPaymentToken(customerId: string, paymentMethodId: string): Promise<PaymentMethodToken> {
    try {
      const token: PaymentMethodToken = {
        id: `token_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        customerId,
        paymentMethodId,
        token: this.generateSecureToken(),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        isUsed: false,
        createdAt: new Date()
      }

      // Store token in temporary storage (Redis or similar)
      await this.savePaymentToken(token)

      return token
    } catch (error) {
      console.error('Error creating payment token:', error)
      throw error
    }
  }

  async validatePaymentToken(token: string): Promise<PaymentMethodToken | null> {
    try {
      const paymentToken = await this.getPaymentToken(token)
      
      if (!paymentToken) {
        return null
      }

      if (paymentToken.isUsed) {
        return null
      }

      if (paymentToken.expiresAt < new Date()) {
        return null
      }

      return paymentToken
    } catch (error) {
      console.error('Error validating payment token:', error)
      return null
    }
  }

  async usePaymentToken(token: string): Promise<PaymentMethodToken | null> {
    try {
      const paymentToken = await this.validatePaymentToken(token)
      
      if (!paymentToken) {
        return null
      }

      paymentToken.isUsed = true
      await this.updatePaymentToken(paymentToken)

      return paymentToken
    } catch (error) {
      console.error('Error using payment token:', error)
      return null
    }
  }

  async getPaymentMethodStats(customerId: string): Promise<{
    totalMethods: number
    activeMethods: number
    defaultMethod: SavedPaymentMethod | null
    mostUsedMethod: SavedPaymentMethod | null
    totalTransactions: number
  }> {
    const paymentMethods = await this.getCustomerPaymentMethods(customerId)
    
    const activeMethods = paymentMethods.filter(method => method.isActive)
    const defaultMethod = paymentMethods.find(method => method.isDefault && method.isActive) || null
    const mostUsedMethod = paymentMethods.reduce((prev, current) => 
      (current.useCount > prev.useCount) ? current : prev, paymentMethods[0]) || null
    const totalTransactions = paymentMethods.reduce((sum, method) => sum + method.useCount, 0)

    return {
      totalMethods: paymentMethods.length,
      activeMethods: activeMethods.length,
      defaultMethod,
      mostUsedMethod,
      totalTransactions
    }
  }

  private generateSecureToken(): string {
    // Generate a secure random token
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  private async savePaymentToken(token: PaymentMethodToken): Promise<void> {
    // This would save to Redis or similar temporary storage
    console.log('Saving payment token:', token.id)
  }

  private async getPaymentToken(token: string): Promise<PaymentMethodToken | null> {
    // This would retrieve from Redis or similar temporary storage
    return null
  }

  private async updatePaymentToken(token: PaymentMethodToken): Promise<void> {
    // This would update in Redis or similar temporary storage
    console.log('Updating payment token:', token.id)
  }
}
