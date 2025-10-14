import { ICartModuleService, INotificationModuleService } from '@medusajs/framework/types'
import { Modules } from '@medusajs/framework/utils'

export default class AbandonedCartService {
  constructor(
    private container: any
  ) {}

  async trackAbandonedCarts() {
    const cartModuleService: ICartModuleService = this.container.resolve(Modules.CART)
    const notificationModuleService: INotificationModuleService = this.container.resolve(Modules.NOTIFICATION)

    // Get carts that haven't been updated in 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    
    try {
      const abandonedCarts = await cartModuleService.listCarts({
        updated_at: { lt: twentyFourHoursAgo },
        completed_at: null
      })

      for (const cart of abandonedCarts) {
        if (cart.customer_id && cart.email) {
          await this.sendAbandonedCartEmail(cart, notificationModuleService)
        }
      }
    } catch (error) {
      console.error('Error tracking abandoned carts:', error)
    }
  }

  private async sendAbandonedCartEmail(cart: any, notificationService: INotificationModuleService) {
    try {
      await notificationService.createNotifications({
        to: cart.email,
        channel: 'email',
        template: 'abandoned-cart',
        data: {
          emailOptions: {
            subject: 'Complete Your Purchase',
            replyTo: 'noreply@yourstore.com'
          },
          cartItems: cart.items,
          cartTotal: cart.total,
          checkoutUrl: `${process.env.BACKEND_URL}/checkout?cart_id=${cart.id}`
        }
      })
    } catch (error) {
      console.error('Error sending abandoned cart email:', error)
    }
  }
}
