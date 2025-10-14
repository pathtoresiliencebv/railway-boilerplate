import { IOrderModuleService } from '@medusajs/framework/types'
import { Modules } from '@medusajs/framework/utils'

export default class GiftMessageService {
  constructor(
    private container: any
  ) {}

  async addGiftMessage(orderId: string, message: string, recipientName?: string) {
    const orderModuleService: IOrderModuleService = this.container.resolve(Modules.ORDER)

    try {
      const order = await orderModuleService.retrieveOrder(orderId)
      
      // Add gift message to order metadata
      const updatedOrder = await orderModuleService.updateOrders(orderId, {
        metadata: {
          ...order.metadata,
          gift_message: message,
          gift_recipient: recipientName,
          is_gift: true
        }
      })

      return updatedOrder
    } catch (error) {
      console.error('Error adding gift message:', error)
      throw error
    }
  }

  async getGiftMessage(orderId: string) {
    const orderModuleService: IOrderModuleService = this.container.resolve(Modules.ORDER)

    try {
      const order = await orderModuleService.retrieveOrder(orderId)
      return {
        message: order.metadata?.gift_message,
        recipient: order.metadata?.gift_recipient,
        isGift: order.metadata?.is_gift
      }
    } catch (error) {
      console.error('Error retrieving gift message:', error)
      throw error
    }
  }
}
