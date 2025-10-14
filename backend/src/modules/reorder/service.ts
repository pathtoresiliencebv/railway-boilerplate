import { ICustomerModuleService, IOrderModuleService, ICartModuleService } from '@medusajs/framework/types'
import { Modules } from '@medusajs/framework/utils'

export interface ReorderItem {
  id: string
  customerId: string
  orderId: string
  items: Array<{
    variantId: string
    productId: string
    productName: string
    quantity: number
    unitPrice: number
    isAvailable: boolean
  }>
  totalItems: number
  totalValue: number
  createdAt: Date
  lastUsedAt?: Date
  useCount: number
}

export interface ReorderPreset {
  id: string
  customerId: string
  name: string
  description?: string
  items: Array<{
    variantId: string
    productId: string
    quantity: number
  }>
  isActive: boolean
  createdAt: Date
  lastUsedAt?: Date
  useCount: number
}

export default class ReorderService {
  constructor(
    private container: any
  ) {}

  async createReorderFromOrder(customerId: string, orderId: string): Promise<ReorderItem> {
    const orderModuleService: IOrderModuleService = this.container.resolve(Modules.ORDER)
    
    try {
      const order = await orderModuleService.retrieveOrder(orderId)
      
      if (order.customer_id !== customerId) {
        throw new Error('Order does not belong to this customer')
      }

      const reorderItems = order.items?.map(item => ({
        variantId: item.variant_id,
        productId: item.product_id,
        productName: item.title,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        isAvailable: true // This would check actual availability
      })) || []

      const reorderItem: ReorderItem = {
        id: `reorder_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        customerId,
        orderId,
        items: reorderItems,
        totalItems: reorderItems.reduce((sum, item) => sum + item.quantity, 0),
        totalValue: reorderItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0),
        createdAt: new Date(),
        useCount: 0
      }

      // Store reorder item
      await this.saveReorderItem(reorderItem)

      return reorderItem
    } catch (error) {
      console.error('Error creating reorder from order:', error)
      throw error
    }
  }

  async getCustomerReorderItems(customerId: string): Promise<ReorderItem[]> {
    // This would retrieve customer's reorder items from database
    return []
  }

  async addReorderToCart(reorderId: string, cartId: string): Promise<void> {
    const cartModuleService: ICartModuleService = this.container.resolve(Modules.CART)
    
    try {
      const reorderItem = await this.getReorderItem(reorderId)
      if (!reorderItem) {
        throw new Error('Reorder item not found')
      }

      // Check if customer owns this reorder item
      if (reorderItem.customerId !== cartId) {
        throw new Error('Reorder item does not belong to this customer')
      }

      // Add items to cart
      const lineItems = reorderItem.items
        .filter(item => item.isAvailable)
        .map(item => ({
          variant_id: item.variantId,
          quantity: item.quantity
        }))

      if (lineItems.length === 0) {
        throw new Error('No available items in this reorder')
      }

      await cartModuleService.addLineItems(cartId, lineItems)

      // Update reorder usage
      reorderItem.lastUsedAt = new Date()
      reorderItem.useCount++
      await this.updateReorderItem(reorderItem)

    } catch (error) {
      console.error('Error adding reorder to cart:', error)
      throw error
    }
  }

  async createReorderPreset(
    customerId: string,
    name: string,
    items: Array<{ variantId: string; productId: string; quantity: number }>,
    description?: string
  ): Promise<ReorderPreset> {
    try {
      const preset: ReorderPreset = {
        id: `preset_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        customerId,
        name,
        description,
        items,
        isActive: true,
        createdAt: new Date(),
        useCount: 0
      }

      // Store preset
      await this.saveReorderPreset(preset)

      return preset
    } catch (error) {
      console.error('Error creating reorder preset:', error)
      throw error
    }
  }

  async getCustomerReorderPresets(customerId: string): Promise<ReorderPreset[]> {
    // This would retrieve customer's reorder presets from database
    return []
  }

  async addPresetToCart(presetId: string, cartId: string): Promise<void> {
    const cartModuleService: ICartModuleService = this.container.resolve(Modules.CART)
    
    try {
      const preset = await this.getReorderPreset(presetId)
      if (!preset) {
        throw new Error('Reorder preset not found')
      }

      if (!preset.isActive) {
        throw new Error('Reorder preset is not active')
      }

      // Add items to cart
      const lineItems = preset.items.map(item => ({
        variant_id: item.variantId,
        quantity: item.quantity
      }))

      await cartModuleService.addLineItems(cartId, lineItems)

      // Update preset usage
      preset.lastUsedAt = new Date()
      preset.useCount++
      await this.updateReorderPreset(preset)

    } catch (error) {
      console.error('Error adding preset to cart:', error)
      throw error
    }
  }

  async getReorderItem(reorderId: string): Promise<ReorderItem | null> {
    // This would retrieve from database
    return null
  }

  async getReorderPreset(presetId: string): Promise<ReorderPreset | null> {
    // This would retrieve from database
    return null
  }

  async updateReorderItem(reorderItem: ReorderItem): Promise<void> {
    // This would update in database
    console.log('Updating reorder item:', reorderItem.id)
  }

  async updateReorderPreset(preset: ReorderPreset): Promise<void> {
    // This would update in database
    console.log('Updating reorder preset:', preset.id)
  }

  async saveReorderItem(reorderItem: ReorderItem): Promise<void> {
    // This would save to database
    console.log('Saving reorder item:', reorderItem.id)
  }

  async saveReorderPreset(preset: ReorderPreset): Promise<void> {
    // This would save to database
    console.log('Saving reorder preset:', preset.id)
  }

  async getReorderStats(customerId: string): Promise<{
    totalReorderItems: number
    totalPresets: number
    mostUsedReorder: ReorderItem | null
    mostUsedPreset: ReorderPreset | null
    totalSavings: number
  }> {
    // This would aggregate statistics from the database
    return {
      totalReorderItems: 0,
      totalPresets: 0,
      mostUsedReorder: null,
      mostUsedPreset: null,
      totalSavings: 0
    }
  }

  async suggestReorderItems(customerId: string, limit: number = 5): Promise<ReorderItem[]> {
    try {
      const reorderItems = await this.getCustomerReorderItems(customerId)
      
      // Sort by usage and recency
      return reorderItems
        .sort((a, b) => {
          // Prioritize by usage count, then by last used date
          if (a.useCount !== b.useCount) {
            return b.useCount - a.useCount
          }
          if (a.lastUsedAt && b.lastUsedAt) {
            return new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime()
          }
          return 0
        })
        .slice(0, limit)
    } catch (error) {
      console.error('Error suggesting reorder items:', error)
      return []
    }
  }

  async deleteReorderItem(reorderId: string, customerId: string): Promise<void> {
    try {
      const reorderItem = await this.getReorderItem(reorderId)
      if (!reorderItem || reorderItem.customerId !== customerId) {
        throw new Error('Reorder item not found or access denied')
      }

      // Delete from database
      await this.deleteReorderItemFromDB(reorderId)
    } catch (error) {
      console.error('Error deleting reorder item:', error)
      throw error
    }
  }

  async deleteReorderPreset(presetId: string, customerId: string): Promise<void> {
    try {
      const preset = await this.getReorderPreset(presetId)
      if (!preset || preset.customerId !== customerId) {
        throw new Error('Reorder preset not found or access denied')
      }

      // Delete from database
      await this.deleteReorderPresetFromDB(presetId)
    } catch (error) {
      console.error('Error deleting reorder preset:', error)
      throw error
    }
  }

  private async deleteReorderItemFromDB(reorderId: string): Promise<void> {
    // This would delete from database
    console.log('Deleting reorder item:', reorderId)
  }

  private async deleteReorderPresetFromDB(presetId: string): Promise<void> {
    // This would delete from database
    console.log('Deleting reorder preset:', presetId)
  }
}
