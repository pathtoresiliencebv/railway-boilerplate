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

  constructor(container: any) {
    // Simplified constructor - no dependencies for now
  }

  async createWebhook(data: Partial<Webhook>): Promise<Webhook> {
    const webhook: Webhook = {
      id: `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url: data.url || '',
      events: data.events || [],
      secret: data.secret || '',
      isActive: data.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    this.webhooks.set(webhook.id, webhook)
    return webhook
  }

  async retrieveWebhook(id: string): Promise<Webhook | undefined> {
    return this.webhooks.get(id)
  }

  async listWebhooks(): Promise<Webhook[]> {
    return Array.from(this.webhooks.values())
  }

  async updateWebhook(id: string, data: Partial<Webhook>): Promise<Webhook | undefined> {
    const webhook = this.webhooks.get(id)
    if (!webhook) {
      return undefined
    }

    const updatedWebhook = {
      ...webhook,
      ...data,
      updatedAt: new Date(),
    }

    this.webhooks.set(id, updatedWebhook)
    return updatedWebhook
  }

  async deleteWebhook(id: string): Promise<void> {
    this.webhooks.delete(id)
  }

  async testWebhook(id: string): Promise<void> {
    const webhook = this.webhooks.get(id)
    if (!webhook) {
      throw new Error(`Webhook with id ${id} not found`)
    }

    // Simple test - just log for now
    console.log(`Testing webhook ${id} to ${webhook.url}`)
  }
}