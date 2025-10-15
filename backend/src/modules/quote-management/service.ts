import { ICustomerModuleService, IOrderModuleService, INotificationModuleService } from '@medusajs/framework/types'
import { Modules } from '@medusajs/framework/utils'

export interface QuoteRequest {
  id: string
  customerId?: string
  customerEmail: string
  customerName: string
  company?: string
  phone?: string
  message?: string
  items: Array<{
    productId: string
    productName: string
    quantity: number
    specifications?: string
    requestedPrice?: number
  }>
  status: 'pending' | 'reviewing' | 'approved' | 'rejected' | 'expired'
  totalAmount?: number
  validUntil?: Date
  createdAt: Date
  updatedAt: Date
  reviewedAt?: Date
  reviewedBy?: string
  notes?: string
}

export interface QuoteResponse {
  id: string
  quoteRequestId: string
  items: Array<{
    productId: string
    productName: string
    quantity: number
    unitPrice: number
    totalPrice: number
    specifications?: string
    notes?: string
  }>
  subtotal: number
  taxAmount: number
  discountAmount: number
  totalAmount: number
  validUntil: Date
  terms: string
  createdAt: Date
  createdBy: string
}

export default class QuoteManagementService {
  constructor(
    private container: any
  ) {}

  async createQuoteRequest(requestData: Omit<QuoteRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<QuoteRequest> {
    try {
      const quoteRequest: QuoteRequest = {
        id: `quote_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        ...requestData,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // Store quote request
      await this.saveQuoteRequest(quoteRequest)

      // Send notification to admin
      await this.notifyAdminOfNewQuote(quoteRequest)

      // Send confirmation to customer
      await this.sendQuoteConfirmation(quoteRequest)

      return quoteRequest
    } catch (error) {
      console.error('Error creating quote request:', error)
      throw error
    }
  }

  async getQuoteRequest(quoteId: string): Promise<QuoteRequest | null> {
    // This would retrieve from database
    return null
  }

  async getCustomerQuoteRequests(customerId: string): Promise<QuoteRequest[]> {
    // This would retrieve customer's quote requests
    return []
  }

  async getAllQuoteRequests(status?: QuoteRequest['status']): Promise<QuoteRequest[]> {
    // This would retrieve all quote requests with optional status filter
    return []
  }

  async updateQuoteRequestStatus(
    quoteId: string,
    status: QuoteRequest['status'],
    reviewedBy: string,
    notes?: string
  ): Promise<QuoteRequest> {
    try {
      const quoteRequest = await this.getQuoteRequest(quoteId)
      if (!quoteRequest) {
        throw new Error('Quote request not found')
      }

      quoteRequest.status = status
      quoteRequest.reviewedAt = new Date()
      quoteRequest.reviewedBy = reviewedBy
      quoteRequest.notes = notes
      quoteRequest.updatedAt = new Date()

      await this.saveQuoteRequest(quoteRequest)

      // Send status update to customer
      await this.sendStatusUpdate(quoteRequest)

      return quoteRequest
    } catch (error) {
      console.error('Error updating quote request status:', error)
      throw error
    }
  }

  async createQuoteResponse(
    quoteRequestId: string,
    responseData: Omit<QuoteResponse, 'id' | 'quoteRequestId' | 'createdAt' | 'createdBy'>
  ): Promise<QuoteResponse> {
    try {
      const quoteRequest = await this.getQuoteRequest(quoteRequestId)
      if (!quoteRequest) {
        throw new Error('Quote request not found')
      }

      const quoteResponse: QuoteResponse = {
        id: `response_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        quoteRequestId,
        ...responseData,
        createdAt: new Date(),
        createdBy: 'admin' // This would be the actual admin user ID
      }

      // Store quote response
      await this.saveQuoteResponse(quoteResponse)

      // Update quote request status
      await this.updateQuoteRequestStatus(quoteRequestId, 'approved', 'admin')

      // Send quote response to customer
      await this.sendQuoteResponse(quoteRequest, quoteResponse)

      return quoteResponse
    } catch (error) {
      console.error('Error creating quote response:', error)
      throw error
    }
  }

  async convertQuoteToOrder(quoteResponseId: string, customerId: string): Promise<string> {
    const orderModuleService: IOrderModuleService = this.container.resolve(Modules.ORDER)
    
    try {
      const quoteResponse = await this.getQuoteResponse(quoteResponseId)
      if (!quoteResponse) {
        throw new Error('Quote response not found')
      }

      // Check if quote is still valid
      if (quoteResponse.validUntil < new Date()) {
        throw new Error('Quote has expired')
      }

      // Create order from quote
      const order = await orderModuleService.createOrders({
        customer_id: customerId,
        items: quoteResponse.items.map(item => ({
          variant_id: item.productId,
          quantity: item.quantity,
          title: item.productName,
          unit_price: item.unitPrice
        })),
        metadata: {
          quote_response_id: quoteResponseId,
          quote_request_id: quoteResponse.quoteRequestId,
          custom_pricing: true
        }
      })

      return order.id
    } catch (error) {
      console.error('Error converting quote to order:', error)
      throw error
    }
  }

  async getQuoteResponse(responseId: string): Promise<QuoteResponse | null> {
    // This would retrieve from database
    return null
  }

  async getQuoteStats(): Promise<{
    totalRequests: number
    pendingRequests: number
    approvedRequests: number
    rejectedRequests: number
    averageResponseTime: number
  }> {
    // This would aggregate statistics from the database
    return {
      totalRequests: 0,
      pendingRequests: 0,
      approvedRequests: 0,
      rejectedRequests: 0,
      averageResponseTime: 0
    }
  }

  private async saveQuoteRequest(quoteRequest: QuoteRequest): Promise<void> {
    // This would save to database
    console.log('Saving quote request:', quoteRequest.id)
  }

  private async saveQuoteResponse(quoteResponse: QuoteResponse): Promise<void> {
    // This would save to database
    console.log('Saving quote response:', quoteResponse.id)
  }

  private async notifyAdminOfNewQuote(quoteRequest: QuoteRequest): Promise<void> {
    const notificationModuleService: INotificationModuleService = this.container.resolve(Modules.NOTIFICATION)
    
    try {
      await notificationModuleService.createNotifications({
        to: 'admin@yourstore.com', // This would be the admin email
        channel: 'email',
        template: 'new-quote-request',
        data: {
          emailOptions: {
            subject: `New Quote Request #${quoteRequest.id}`
          },
          quoteRequest
        }
      })
    } catch (error) {
      console.error('Error notifying admin of new quote:', error)
    }
  }

  private async sendQuoteConfirmation(quoteRequest: QuoteRequest): Promise<void> {
    const notificationModuleService: INotificationModuleService = this.container.resolve(Modules.NOTIFICATION)
    
    try {
      await notificationModuleService.createNotifications({
        to: quoteRequest.customerEmail,
        channel: 'email',
        template: 'quote-request-confirmation',
        data: {
          emailOptions: {
            subject: `Quote Request Received #${quoteRequest.id}`
          },
          quoteRequest
        }
      })
    } catch (error) {
      console.error('Error sending quote confirmation:', error)
    }
  }

  private async sendStatusUpdate(quoteRequest: QuoteRequest): Promise<void> {
    const notificationModuleService: INotificationModuleService = this.container.resolve(Modules.NOTIFICATION)
    
    try {
      await notificationModuleService.createNotifications({
        to: quoteRequest.customerEmail,
        channel: 'email',
        template: 'quote-status-update',
        data: {
          emailOptions: {
            subject: `Quote Request Update #${quoteRequest.id}`
          },
          quoteRequest
        }
      })
    } catch (error) {
      console.error('Error sending status update:', error)
    }
  }

  private async sendQuoteResponse(quoteRequest: QuoteRequest, quoteResponse: QuoteResponse): Promise<void> {
    const notificationModuleService: INotificationModuleService = this.container.resolve(Modules.NOTIFICATION)
    
    try {
      await notificationModuleService.createNotifications({
        to: quoteRequest.customerEmail,
        channel: 'email',
        template: 'quote-response',
        data: {
          emailOptions: {
            subject: `Your Quote Response #${quoteRequest.id}`
          },
          quoteRequest,
          quoteResponse
        }
      })
    } catch (error) {
      console.error('Error sending quote response:', error)
    }
  }
}
