import { AbstractFulfillmentProviderService } from "@medusajs/framework/utils"
import {
  CreateFulfillmentResult,
  FulfillmentDTO,
  FulfillmentItemDTO,
  FulfillmentOption,
  FulfillmentOrderDTO,
} from "@medusajs/framework/types"

interface ShipStationOptions {
  apiKey: string
  apiSecret: string
  baseUrl?: string
  weightUnit?: 'lb' | 'oz' | 'g' | 'kg'
  dimensionUnit?: 'in' | 'cm'
}

interface ShipStationOrder {
  orderNumber: string
  orderKey: string
  orderDate: string
  paymentDate: string
  shipByDate: string
  orderStatus: string
  customerUsername: string
  customerEmail: string
  billTo: ShipStationAddress
  shipTo: ShipStationAddress
  items: ShipStationItem[]
  amountPaid: number
  taxAmount: number
  shippingAmount: number
  customerNotes: string
  internalNotes: string
  gift: boolean
  giftMessage: string
  paymentMethod: string
  requestedShippingService: string
  carrierCode: string
  serviceCode: string
  packageCode: string
  confirmation: string
  shipDate: string
  holdUntilDate: string
  weight: number
  dimensions: string
  insuranceOptions: string
  internationalOptions: string
  advancedOptions: string
  tagIds: string[]
  warehouseId: string
  orderId: number
  createDate: string
  modifyDate: string
}

interface ShipStationAddress {
  name: string
  company: string
  street1: string
  street2: string
  street3: string
  city: string
  state: string
  postalCode: string
  country: string
  phone: string
  residential: boolean
}

interface ShipStationItem {
  lineItemKey: string
  sku: string
  name: string
  imageUrl: string
  weight: number
  weightUnits: string
  quantity: number
  unitPrice: number
  location: string
  options: string
  productId: number
  fulfillmentSku: string
  adjustment: boolean
  upc: string
  createDate: string
  modifyDate: string
}

interface ShipStationLabel {
  labelId: number
  shipmentId: number
  shipmentCost: number
  insuranceCost: number
  trackingNumber: string
  labelData: string
  formData: string
  carrierCode: string
  serviceCode: string
  packageCode: string
  confirmation: string
  createdDate: string
  shipDate: string
  voided: boolean
  voidedDate: string
  marketplaceNotified: boolean
  notifyErrorMessage: string
}

class ShipStationFulfillmentService extends AbstractFulfillmentProviderService {
  static identifier = "shipstation"
  
  protected options_: ShipStationOptions
  protected baseUrl: string

  constructor(container: any, options: ShipStationOptions) {
    super()
    this.options_ = options
    this.baseUrl = options.baseUrl || 'https://ssapi.shipstation.com'
  }

  async getFulfillmentOptions(): Promise<FulfillmentOption[]> {
    return [
      {
        id: "shipstation-standard",
        name: "Standard Shipping",
        data: {
          service: "standard"
        }
      },
      {
        id: "shipstation-express", 
        name: "Express Shipping",
        data: {
          service: "express"
        }
      },
      {
        id: "shipstation-overnight",
        name: "Overnight Shipping", 
        data: {
          service: "overnight"
        }
      }
    ]
  }

  async validateFulfillmentData(
    optionData: Record<string, unknown>,
    data: Record<string, unknown>,
    context: Record<string, unknown>
  ): Promise<any> {
    // Validate required fields for ShipStation
    const requiredFields = ['orderNumber', 'shipTo', 'items']
    
    for (const field of requiredFields) {
      if (!data[field]) {
        throw new Error(`Missing required field: ${field}`)
      }
    }

    return data
  }

  async validateOption(data: Record<string, any>): Promise<boolean> {
    return data.service && typeof data.service === 'string'
  }

  async createFulfillment(
    data: Record<string, unknown>,
    items: Partial<Omit<FulfillmentItemDTO, "fulfillment">>[],
    order: Partial<FulfillmentOrderDTO> | undefined,
    fulfillment: Partial<Omit<FulfillmentDTO, "provider_id" | "data" | "items">>
  ): Promise<CreateFulfillmentResult> {
    try {
      // Convert Medusa order to ShipStation format
      const shipStationOrder = await this.convertToShipStationOrder(order, items, data)
      
      // Create order in ShipStation
      const createdOrder = await this.createShipStationOrder(shipStationOrder)
      
      // Create shipping label
      const label = await this.createShippingLabel(createdOrder.orderId, data)
      
      return {
        data: {
          orderId: createdOrder.orderId,
          trackingNumber: label.trackingNumber,
          labelUrl: label.labelData,
          carrierCode: label.carrierCode,
          serviceCode: label.serviceCode
        },
        labels: [
          {
            label_url: label.labelData,
            tracking_number: label.trackingNumber
          }
        ]
      }
    } catch (error) {
      console.error('ShipStation fulfillment error:', error)
      throw error
    }
  }

  async cancelFulfillment(fulfillmentData: Record<string, unknown>): Promise<any> {
    try {
      const orderId = fulfillmentData.orderId as number
      if (!orderId) {
        throw new Error('Order ID is required to cancel fulfillment')
      }

      // Void the shipping label in ShipStation
      await this.voidShipStationLabel(orderId)
      
      return { success: true }
    } catch (error) {
      console.error('ShipStation cancel fulfillment error:', error)
      throw error
    }
  }

  async createReturnFulfillment(fulfillment: Record<string, unknown>): Promise<CreateFulfillmentResult> {
    // ShipStation doesn't have specific return label creation
    // This would typically create a return shipping label
    return {
      data: fulfillment,
      labels: []
    }
  }

  private async convertToShipStationOrder(
    order: Partial<FulfillmentOrderDTO> | undefined,
    items: Partial<Omit<FulfillmentItemDTO, "fulfillment">>[],
    data: Record<string, unknown>
  ): Promise<Partial<ShipStationOrder>> {
    if (!order) {
      throw new Error('Order is required')
    }

    return {
      orderNumber: order.display_id?.toString() || order.id,
      orderKey: order.id,
      orderDate: order.created_at?.toString() || new Date().toISOString(),
      paymentDate: order.created_at?.toString() || new Date().toISOString(),
      shipByDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
      orderStatus: 'awaiting_shipment',
      customerUsername: order.email || '',
      customerEmail: order.email || '',
      billTo: this.convertAddress(order.billing_address),
      shipTo: this.convertAddress(order.shipping_address),
      items: items.map(item => this.convertItem(item)),
      amountPaid: Number(order.total || 0),
      taxAmount: Number(order.tax_total || 0),
      shippingAmount: Number(order.shipping_total || 0),
      customerNotes: (order.metadata?.customer_notes as string) || '',
      internalNotes: (order.metadata?.internal_notes as string) || '',
      gift: false,
      giftMessage: '',
      paymentMethod: 'credit_card',
      requestedShippingService: data.service as string || 'standard',
      carrierCode: 'ups',
      serviceCode: 'ups_ground',
      packageCode: 'package',
      confirmation: 'none',
      shipDate: new Date().toISOString(),
      holdUntilDate: null,
      weight: this.calculateTotalWeight(items),
      dimensions: this.calculateDimensions(items),
      insuranceOptions: 'none',
      internationalOptions: 'none',
      advancedOptions: 'none',
      tagIds: [],
      warehouseId: '1'
    }
  }

  private convertAddress(address: any): ShipStationAddress {
    if (!address) {
      throw new Error('Address is required')
    }

    return {
      name: `${address.first_name || ''} ${address.last_name || ''}`.trim(),
      company: address.company || '',
      street1: address.address_1 || '',
      street2: address.address_2 || '',
      street3: '',
      city: address.city || '',
      state: address.province || '',
      postalCode: address.postal_code || '',
      country: address.country_code || '',
      phone: address.phone || '',
      residential: !address.company
    }
  }

  private convertItem(item: Partial<Omit<FulfillmentItemDTO, "fulfillment">>): ShipStationItem {
    return {
      lineItemKey: item.id || '',
      sku: (item as any).variant?.sku || '',
      name: item.title || '',
      imageUrl: (item as any).thumbnail || '',
      weight: Number((item as any).variant?.weight || 0),
      weightUnits: this.options_.weightUnit || 'lb',
      quantity: item.quantity || 1,
      unitPrice: Number((item as any).unit_price || 0),
      location: 'default',
      options: '',
      productId: 0,
      fulfillmentSku: (item as any).variant?.sku || '',
      adjustment: false,
      upc: '',
      createDate: new Date().toISOString(),
      modifyDate: new Date().toISOString()
    }
  }

  private calculateTotalWeight(items: Partial<Omit<FulfillmentItemDTO, "fulfillment">>[]): number {
    return items.reduce((total, item) => {
      const weight = Number((item as any).variant?.weight || 0)
      const quantity = Number(item.quantity || 1)
      return total + (weight * quantity)
    }, 0)
  }

  private calculateDimensions(items: Partial<Omit<FulfillmentItemDTO, "fulfillment">>[]): string {
    // Simplified dimension calculation
    // In a real implementation, you'd calculate based on item dimensions
    return '10x8x6'
  }

  private async createShipStationOrder(order: Partial<ShipStationOrder>): Promise<{ orderId: number }> {
    const response = await fetch(`${this.baseUrl}/orders/createorder`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${this.options_.apiKey}:${this.options_.apiSecret}`).toString('base64')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(order)
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`ShipStation API error: ${error}`)
    }

    const result = await response.json()
    return { orderId: result.orderId }
  }

  private async createShippingLabel(orderId: number, data: Record<string, unknown>): Promise<ShipStationLabel> {
    const labelRequest = {
      orderId: orderId,
      carrierCode: data.carrierCode || 'ups',
      serviceCode: data.serviceCode || 'ups_ground',
      packageCode: data.packageCode || 'package',
      confirmation: data.confirmation || 'none',
      shipDate: new Date().toISOString()
    }

    const response = await fetch(`${this.baseUrl}/orders/createlabelfororder`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${this.options_.apiKey}:${this.options_.apiSecret}`).toString('base64')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(labelRequest)
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`ShipStation label creation error: ${error}`)
    }

    return await response.json()
  }

  private async voidShipStationLabel(orderId: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/orders/voidlabel`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${this.options_.apiKey}:${this.options_.apiSecret}`).toString('base64')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ orderId })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`ShipStation label void error: ${error}`)
    }
  }
}

export default ShipStationFulfillmentService
