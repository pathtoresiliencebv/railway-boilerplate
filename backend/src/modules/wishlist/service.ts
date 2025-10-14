import { ICustomerModuleService, IProductModuleService } from '@medusajs/framework/types'
import { Modules } from '@medusajs/framework/utils'

export default class WishlistService {
  constructor(
    private container: any
  ) {}

  async addToWishlist(customerId: string, productId: string) {
    const customerModuleService: ICustomerModuleService = this.container.resolve(Modules.CUSTOMER)
    
    try {
      const customer = await customerModuleService.retrieveCustomer(customerId)
      const wishlist = customer.metadata?.wishlist || []
      
      if (!wishlist.includes(productId)) {
        wishlist.push(productId)
        
        await customerModuleService.updateCustomers(customerId, {
          metadata: {
            ...customer.metadata,
            wishlist: wishlist
          }
        })
      }

      return wishlist
    } catch (error) {
      console.error('Error adding to wishlist:', error)
      throw error
    }
  }

  async removeFromWishlist(customerId: string, productId: string) {
    const customerModuleService: ICustomerModuleService = this.container.resolve(Modules.CUSTOMER)
    
    try {
      const customer = await customerModuleService.retrieveCustomer(customerId)
      const wishlist = customer.metadata?.wishlist || []
      const updatedWishlist = wishlist.filter((id: string) => id !== productId)
      
      await customerModuleService.updateCustomers(customerId, {
        metadata: {
          ...customer.metadata,
          wishlist: updatedWishlist
        }
      })

      return updatedWishlist
    } catch (error) {
      console.error('Error removing from wishlist:', error)
      throw error
    }
  }

  async getWishlist(customerId: string) {
    const customerModuleService: ICustomerModuleService = this.container.resolve(Modules.CUSTOMER)
    const productModuleService: IProductModuleService = this.container.resolve(Modules.PRODUCT)
    
    try {
      const customer = await customerModuleService.retrieveCustomer(customerId)
      const wishlistIds = customer.metadata?.wishlist || []
      
      const products = await Promise.all(
        wishlistIds.map(async (productId: string) => {
          try {
            return await productModuleService.retrieveProduct(productId)
          } catch (error) {
            console.error(`Error retrieving product ${productId}:`, error)
            return null
          }
        })
      )

      return products.filter(Boolean)
    } catch (error) {
      console.error('Error retrieving wishlist:', error)
      throw error
    }
  }
}
