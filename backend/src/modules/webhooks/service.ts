import { IEventBusService } from '@medusajs/framework/types'
import { Modules } from '@medusajs/framework/utils'

export interface Webhook {
  id: string
  url: string
  events: string[]
  secret: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface WebhookPayload {
  event: string
  data: any
  timestamp: string
  webhookId: string
}

export default class WebhooksService {
  private webhooks: Map<string, Webhook> = new Map()
  private eventBusService: IEventBusService

  constructor(container: any) {
    this.eventBusService = container.resolve(Modules.EVENT_BUS)
    this.setupEventListeners()
  }

  private setupEventListeners() {
    // Listen to key events and trigger webhooks
    const events = [
      'order.placed',
      'order.updated', 
      'order.canceled',
      'product.created',
      'product.updated',
      'product.deleted',
      'customer.created',
      'customer.updated',
      'fulfillment.created',
      'fulfillment.shipped'
    ]

    events.forEach(event => {
      this.eventBusService.subscribe(event, this.handleEvent.bind(this))
    })
  }

  private async handleEvent(event: string, data: any) {
    const activeWebhooks = Array.from(this.webhooks.values()).filter(webhook => 
      webhook.isActive && webhook.events.includes(event)
    )

    for (const webhook of activeWebhooks) {
      await this.sendWebhook(webhook, event, data)
    }
  }

  async createWebhook(webhookData: {
    url: string
    events: string[]
    secret?: string
  }): Promise<Webhook> {
    const webhook: Webhook = {
      id: `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url: webhookData.url,
      events: webhookData.events,
      secret: webhookData.secret || this.generateSecret(),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.webhooks.set(webhook.id, webhook)
    return webhook
  }

  async updateWebhook(id: string, updateData: Partial<Webhook>): Promise<Webhook> {
    const webhook = this.webhooks.get(id)
    if (!webhook) {
      throw new Error(`Webhook with id ${id} not found`)
    }

    const updatedWebhook = {
      ...webhook,
      ...updateData,
      updatedAt: new Date()
    }

    this.webhooks.set(id, updatedWebhook)
    return updatedWebhook
  }

  async deleteWebhook(id: string): Promise<void> {
    if (!this.webhooks.has(id)) {
      throw new Error(`Webhook with id ${id} not found`)
    }
    this.webhooks.delete(id)
  }

  async getWebhook(id: string): Promise<Webhook | null> {
    return this.webhooks.get(id) || null
  }

  async listWebhooks(): Promise<Webhook[]> {
    return Array.from(this.webhooks.values())
  }

  async testWebhook(id: string): Promise<boolean> {
    const webhook = this.webhooks.get(id)
    if (!webhook) {
      throw new Error(`Webhook with id ${id} not found`)
    }

    const testPayload: WebhookPayload = {
      event: 'webhook.test',
      data: { message: 'This is a test webhook' },
      timestamp: new Date().toISOString(),
      webhookId: id
    }

    return await this.sendWebhook(webhook, 'webhook.test', testPayload.data)
  }

  private async sendWebhook(webhook: Webhook, event: string, data: any): Promise<boolean> {
    const payload: WebhookPayload = {
      event,
      data,
      timestamp: new Date().toISOString(),
      webhookId: webhook.id
    }

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': this.generateSignature(JSON.stringify(payload), webhook.secret),
          'X-Webhook-Event': event,
          'X-Webhook-Id': webhook.id
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        console.error(`Webhook delivery failed for ${webhook.url}: ${response.status} ${response.statusText}`)
        return false
      }

      console.log(`Webhook delivered successfully to ${webhook.url} for event ${event}`)
      return true
    } catch (error) {
      console.error(`Webhook delivery error for ${webhook.url}:`, error)
      return false
    }
  }

  private generateSecret(): string {
    return require('crypto').randomBytes(32).toString('hex')
  }

  private generateSignature(payload: string, secret: string): string {
    const crypto = require('crypto')
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex')
  }
}
