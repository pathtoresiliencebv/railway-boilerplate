import { IProductModuleService, IStoreModuleService } from '@medusajs/framework/types'
import { Modules } from '@medusajs/framework/utils'

export interface MetaProductFeedItem {
  id: string
  title: string
  description: string
  link: string
  image_link: string
  availability: 'in stock' | 'out of stock' | 'preorder'
  price: string
  currency: string
  brand?: string
  condition: 'new' | 'refurbished' | 'used'
  google_product_category?: string
  product_type?: string
  sale_price?: string
  sale_price_effective_date?: string
  item_group_id?: string
  custom_label_0?: string
  custom_label_1?: string
  custom_label_2?: string
  custom_label_3?: string
  custom_label_4?: string
}

export default class MetaProductFeedService {
  constructor(
    private container: any
  ) {}

  async generateProductFeed(): Promise<MetaProductFeedItem[]> {
    const productModuleService: IProductModuleService = this.container.resolve(Modules.PRODUCT)
    const storeModuleService: IStoreModuleService = this.container.resolve(Modules.STORE)
    
    try {
      const products = await productModuleService.listProducts({
        include: ['variants', 'categories', 'images']
      })
      
      const store = await storeModuleService.retrieveStore()
      const baseUrl = store.metadata?.frontend_url || process.env.FRONTEND_URL || 'https://yourstore.com'
      
      const feedItems: MetaProductFeedItem[] = []
      
      for (const product of products) {
        const feedItem = await this.convertProductToFeedItem(product, baseUrl)
        if (feedItem) {
          feedItems.push(feedItem)
        }
      }
      
      return feedItems
    } catch (error) {
      console.error('Error generating product feed:', error)
      throw error
    }
  }

  private async convertProductToFeedItem(product: any, baseUrl: string): Promise<MetaProductFeedItem | null> {
    try {
      const primaryVariant = product.variants?.[0]
      if (!primaryVariant) return null

      const primaryImage = product.images?.[0]
      const price = primaryVariant.prices?.[0]?.amount || 0
      const currency = primaryVariant.prices?.[0]?.currency_code || 'USD'
      
      const feedItem: MetaProductFeedItem = {
        id: product.id,
        title: product.title,
        description: product.description || product.title,
        link: `${baseUrl}/products/${product.handle}`,
        image_link: primaryImage?.url || `${baseUrl}/placeholder-image.jpg`,
        availability: product.status === 'published' ? 'in stock' : 'out of stock',
        price: `${(price / 100).toFixed(2)} ${currency}`,
        currency,
        brand: product.metadata?.brand || 'Your Brand',
        condition: 'new',
        google_product_category: product.metadata?.google_category || 'Apparel & Accessories',
        product_type: product.categories?.[0]?.name || 'General',
        custom_label_0: product.metadata?.custom_label_0,
        custom_label_1: product.metadata?.custom_label_1,
        custom_label_2: product.metadata?.custom_label_2,
        custom_label_3: product.metadata?.custom_label_3,
        custom_label_4: product.metadata?.custom_label_4
      }

      // Add sale price if available
      if (product.metadata?.sale_price) {
        feedItem.sale_price = product.metadata.sale_price
        feedItem.sale_price_effective_date = product.metadata.sale_price_effective_date
      }

      // Add item group ID for variants
      if (product.variants && product.variants.length > 1) {
        feedItem.item_group_id = product.id
      }

      return feedItem
    } catch (error) {
      console.error(`Error converting product ${product.id} to feed item:`, error)
      return null
    }
  }

  async generateXMLFeed(): Promise<string> {
    const feedItems = await this.generateProductFeed()
    
    const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>'
    const rssHeader = `
      <rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
        <channel>
          <title>Product Feed</title>
          <link>${process.env.FRONTEND_URL || 'https://yourstore.com'}</link>
          <description>Product feed for Facebook/Instagram Shopping</description>
    `
    
    const items = feedItems.map(item => `
      <item>
        <g:id>${item.id}</g:id>
        <g:title>${this.escapeXml(item.title)}</g:title>
        <g:description>${this.escapeXml(item.description)}</g:description>
        <g:link>${item.link}</g:link>
        <g:image_link>${item.image_link}</g:image_link>
        <g:availability>${item.availability}</g:availability>
        <g:price>${item.price}</g:price>
        <g:currency_code>${item.currency}</g:currency_code>
        <g:brand>${this.escapeXml(item.brand || '')}</g:brand>
        <g:condition>${item.condition}</g:condition>
        <g:google_product_category>${this.escapeXml(item.google_product_category || '')}</g:google_product_category>
        <g:product_type>${this.escapeXml(item.product_type || '')}</g:product_type>
        ${item.sale_price ? `<g:sale_price>${item.sale_price}</g:sale_price>` : ''}
        ${item.sale_price_effective_date ? `<g:sale_price_effective_date>${item.sale_price_effective_date}</g:sale_price_effective_date>` : ''}
        ${item.item_group_id ? `<g:item_group_id>${item.item_group_id}</g:item_group_id>` : ''}
        ${item.custom_label_0 ? `<g:custom_label_0>${this.escapeXml(item.custom_label_0)}</g:custom_label_0>` : ''}
        ${item.custom_label_1 ? `<g:custom_label_1>${this.escapeXml(item.custom_label_1)}</g:custom_label_1>` : ''}
        ${item.custom_label_2 ? `<g:custom_label_2>${this.escapeXml(item.custom_label_2)}</g:custom_label_2>` : ''}
        ${item.custom_label_3 ? `<g:custom_label_3>${this.escapeXml(item.custom_label_3)}</g:custom_label_3>` : ''}
        ${item.custom_label_4 ? `<g:custom_label_4>${this.escapeXml(item.custom_label_4)}</g:custom_label_4>` : ''}
      </item>
    `).join('')
    
    const rssFooter = `
        </channel>
      </rss>
    `
    
    return xmlHeader + rssHeader + items + rssFooter
  }

  private escapeXml(str: string): string {
    if (!str) return ''
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  async saveFeedToStorage(xmlContent: string): Promise<string> {
    // This would save to MinIO or other storage
    // For now, return a placeholder URL
    const filename = `meta-product-feed-${Date.now()}.xml`
    return `${process.env.BACKEND_URL}/static/feeds/${filename}`
  }

  async scheduleFeedUpdate(): Promise<void> {
    // This would set up a cron job or scheduled task
    // to automatically update the feed
    console.log('Scheduling feed update...')
  }

  async getFeedStats(): Promise<{
    totalProducts: number
    lastUpdated: Date
    feedUrl: string
  }> {
    const feedItems = await this.generateProductFeed()
    
    return {
      totalProducts: feedItems.length,
      lastUpdated: new Date(),
      feedUrl: `${process.env.BACKEND_URL}/api/feeds/meta-products.xml`
    }
  }

  async validateFeed(): Promise<{
    isValid: boolean
    errors: string[]
    warnings: string[]
  }> {
    const feedItems = await this.generateProductFeed()
    const errors: string[] = []
    const warnings: string[] = []
    
    for (const item of feedItems) {
      // Required fields validation
      if (!item.id) errors.push(`Missing ID for item: ${item.title}`)
      if (!item.title) errors.push(`Missing title for item: ${item.id}`)
      if (!item.description) errors.push(`Missing description for item: ${item.id}`)
      if (!item.link) errors.push(`Missing link for item: ${item.id}`)
      if (!item.image_link) errors.push(`Missing image for item: ${item.id}`)
      if (!item.price) errors.push(`Missing price for item: ${item.id}`)
      
      // Price format validation
      if (item.price && !item.price.match(/^\d+\.\d{2} [A-Z]{3}$/)) {
        warnings.push(`Invalid price format for item ${item.id}: ${item.price}`)
      }
      
      // URL validation
      if (item.link && !this.isValidUrl(item.link)) {
        errors.push(`Invalid link for item ${item.id}: ${item.link}`)
      }
      
      if (item.image_link && !this.isValidUrl(item.image_link)) {
        errors.push(`Invalid image link for item ${item.id}: ${item.image_link}`)
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }
}
