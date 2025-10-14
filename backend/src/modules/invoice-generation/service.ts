import { IOrderModuleService, INotificationModuleService } from '@medusajs/framework/types'
import { Modules } from '@medusajs/framework/utils'

export interface InvoiceData {
  invoiceNumber: string
  orderId: string
  customerId: string
  customerName: string
  customerEmail: string
  billingAddress: any
  items: Array<{
    name: string
    quantity: number
    unitPrice: number
    total: number
  }>
  subtotal: number
  taxAmount: number
  shippingAmount: number
  total: number
  issueDate: Date
  dueDate: Date
  status: 'draft' | 'sent' | 'paid' | 'overdue'
}

export default class InvoiceGenerationService {
  constructor(
    private container: any
  ) {}

  async generateInvoice(orderId: string): Promise<InvoiceData> {
    const orderModuleService: IOrderModuleService = this.container.resolve(Modules.ORDER)
    
    try {
      const order = await orderModuleService.retrieveOrder(orderId)
      
      const invoiceData: InvoiceData = {
        invoiceNumber: this.generateInvoiceNumber(),
        orderId: order.id,
        customerId: order.customer_id,
        customerName: `${order.customer?.first_name || ''} ${order.customer?.last_name || ''}`.trim(),
        customerEmail: order.customer?.email || '',
        billingAddress: order.billing_address,
        items: order.items?.map(item => ({
          name: item.title,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          total: item.unit_price * item.quantity
        })) || [],
        subtotal: order.subtotal || 0,
        taxAmount: order.tax_total || 0,
        shippingAmount: order.shipping_total || 0,
        total: order.total || 0,
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        status: 'draft'
      }

      // Store invoice data in order metadata
      await orderModuleService.updateOrders(orderId, {
        metadata: {
          ...order.metadata,
          invoice_data: invoiceData
        }
      })

      return invoiceData
    } catch (error) {
      console.error('Error generating invoice:', error)
      throw error
    }
  }

  async generatePDFInvoice(invoiceData: InvoiceData): Promise<string> {
    // This would integrate with a PDF generation library like puppeteer or jsPDF
    // For now, we'll return a placeholder URL
    try {
      const pdfContent = this.generateHTMLInvoice(invoiceData)
      const pdfUrl = await this.saveInvoiceToStorage(pdfContent, invoiceData.invoiceNumber)
      
      return pdfUrl
    } catch (error) {
      console.error('Error generating PDF invoice:', error)
      throw error
    }
  }

  private generateHTMLInvoice(invoiceData: InvoiceData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoiceData.invoiceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .invoice-details { margin-bottom: 20px; }
          .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .items-table th { background-color: #f2f2f2; }
          .totals { margin-top: 20px; text-align: right; }
          .footer { margin-top: 40px; text-align: center; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>INVOICE</h1>
          <h2>#${invoiceData.invoiceNumber}</h2>
        </div>
        
        <div class="invoice-details">
          <p><strong>Bill To:</strong></p>
          <p>${invoiceData.customerName}</p>
          <p>${invoiceData.customerEmail}</p>
          <p>${invoiceData.billingAddress?.address_1 || ''}</p>
          <p>${invoiceData.billingAddress?.city || ''}, ${invoiceData.billingAddress?.postal_code || ''}</p>
          <p>${invoiceData.billingAddress?.country_code || ''}</p>
        </div>
        
        <table class="items-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${invoiceData.items.map(item => `
              <tr>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>$${item.unitPrice.toFixed(2)}</td>
                <td>$${item.total.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="totals">
          <p>Subtotal: $${invoiceData.subtotal.toFixed(2)}</p>
          <p>Tax: $${invoiceData.taxAmount.toFixed(2)}</p>
          <p>Shipping: $${invoiceData.shippingAmount.toFixed(2)}</p>
          <p><strong>Total: $${invoiceData.total.toFixed(2)}</strong></p>
        </div>
        
        <div class="footer">
          <p>Invoice issued on: ${invoiceData.issueDate.toLocaleDateString()}</p>
          <p>Due date: ${invoiceData.dueDate.toLocaleDateString()}</p>
        </div>
      </body>
      </html>
    `
  }

  private async saveInvoiceToStorage(htmlContent: string, invoiceNumber: string): Promise<string> {
    // This would save to MinIO or other storage
    // For now, return a placeholder URL
    return `${process.env.BACKEND_URL}/static/invoices/${invoiceNumber}.pdf`
  }

  private generateInvoiceNumber(): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substr(2, 4).toUpperCase()
    return `INV-${timestamp}-${random}`
  }

  async sendInvoiceToCustomer(invoiceData: InvoiceData, pdfUrl: string): Promise<void> {
    const notificationModuleService: INotificationModuleService = this.container.resolve(Modules.NOTIFICATION)
    
    try {
      await notificationModuleService.createNotifications({
        to: invoiceData.customerEmail,
        channel: 'email',
        template: 'invoice',
        data: {
          emailOptions: {
            subject: `Invoice #${invoiceData.invoiceNumber}`,
            replyTo: 'billing@yourstore.com'
          },
          invoiceData,
          pdfUrl,
          customerName: invoiceData.customerName
        }
      })
    } catch (error) {
      console.error('Error sending invoice to customer:', error)
      throw error
    }
  }

  async getInvoiceByOrderId(orderId: string): Promise<InvoiceData | null> {
    const orderModuleService: IOrderModuleService = this.container.resolve(Modules.ORDER)
    
    try {
      const order = await orderModuleService.retrieveOrder(orderId)
      return order.metadata?.invoice_data || null
    } catch (error) {
      console.error('Error retrieving invoice:', error)
      return null
    }
  }

  async markInvoiceAsPaid(invoiceNumber: string): Promise<void> {
    // This would update the invoice status to 'paid'
    // Implementation depends on how invoices are stored
    console.log(`Invoice ${invoiceNumber} marked as paid`)
  }
}
