import { ICustomerModuleService, IOrderModuleService } from '@medusajs/framework/types'
import { Modules } from '@medusajs/framework/utils'

export default class LoyaltyPointsService {
  constructor(
    private container: any
  ) {}

  async awardPointsForPurchase(customerId: string, orderTotal: number) {
    const customerModuleService: ICustomerModuleService = this.container.resolve(Modules.CUSTOMER)
    
    // Award 1 point per dollar spent
    const pointsToAward = Math.floor(orderTotal / 100)
    
    try {
      const customer = await customerModuleService.retrieveCustomer(customerId)
      const currentPoints = customer.metadata?.loyalty_points || 0
      const newPoints = currentPoints + pointsToAward

      await customerModuleService.updateCustomers(customerId, {
        metadata: {
          ...customer.metadata,
          loyalty_points: newPoints,
          last_points_earned: new Date().toISOString()
        }
      })

      return newPoints
    } catch (error) {
      console.error('Error awarding loyalty points:', error)
      throw error
    }
  }

  async redeemPoints(customerId: string, pointsToRedeem: number) {
    const customerModuleService: ICustomerModuleService = this.container.resolve(Modules.CUSTOMER)
    
    try {
      const customer = await customerModuleService.retrieveCustomer(customerId)
      const currentPoints = customer.metadata?.loyalty_points || 0

      if (currentPoints < pointsToRedeem) {
        throw new Error('Insufficient loyalty points')
      }

      const newPoints = currentPoints - pointsToRedeem

      await customerModuleService.updateCustomers(customerId, {
        metadata: {
          ...customer.metadata,
          loyalty_points: newPoints,
          last_points_redeemed: new Date().toISOString()
        }
      })

      return newPoints
    } catch (error) {
      console.error('Error redeeming loyalty points:', error)
      throw error
    }
  }

  async getCustomerPoints(customerId: string) {
    const customerModuleService: ICustomerModuleService = this.container.resolve(Modules.CUSTOMER)
    
    try {
      const customer = await customerModuleService.retrieveCustomer(customerId)
      return customer.metadata?.loyalty_points || 0
    } catch (error) {
      console.error('Error retrieving customer points:', error)
      throw error
    }
  }
}
