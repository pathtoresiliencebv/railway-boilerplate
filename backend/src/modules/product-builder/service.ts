import { IProductModuleService, ICartModuleService } from '@medusajs/framework/types'
import { Modules } from '@medusajs/framework/utils'

export interface ProductOption {
  id: string
  name: string
  type: 'text' | 'select' | 'radio' | 'checkbox' | 'textarea' | 'file'
  required: boolean
  choices?: Array<{
    id: string
    label: string
    value: string
    priceModifier?: number
  }>
  placeholder?: string
  validation?: {
    minLength?: number
    maxLength?: number
    pattern?: string
  }
}

export interface ProductConfiguration {
  id: string
  productId: string
  customerId?: string
  options: Record<string, any>
  customizations: Record<string, any>
  calculatedPrice: number
  basePrice: number
  priceModifiers: number
  createdAt: Date
  updatedAt: Date
}

export interface ProductBuilderTemplate {
  id: string
  name: string
  description: string
  productId: string
  options: ProductOption[]
  isActive: boolean
  createdAt: Date
}

export default class ProductBuilderService {
  constructor(
    private container: any
  ) {}

  async createBuilderTemplate(templateData: Omit<ProductBuilderTemplate, 'id' | 'createdAt'>): Promise<ProductBuilderTemplate> {
    const template: ProductBuilderTemplate = {
      id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      ...templateData,
      createdAt: new Date()
    }

    // Store template in product metadata
    const productModuleService: IProductModuleService = this.container.resolve(Modules.PRODUCT)
    const product = await productModuleService.retrieveProduct(template.productId)
    
    const builderTemplates: ProductBuilderTemplate[] = (product.metadata?.builder_templates as ProductBuilderTemplate[]) || []
    builderTemplates.push(template)

    await productModuleService.updateProducts(template.productId, {
      metadata: {
        ...product.metadata,
        builder_templates: builderTemplates
      }
    })

    return template
  }

  async getBuilderTemplate(productId: string): Promise<ProductBuilderTemplate | null> {
    const productModuleService: IProductModuleService = this.container.resolve(Modules.PRODUCT)
    
    try {
      const product = await productModuleService.retrieveProduct(productId)
      const templates = product.metadata?.builder_templates || []
      
      // Return the first active template
      return (templates as ProductBuilderTemplate[]).find((template: ProductBuilderTemplate) => template.isActive) || null
    } catch (error) {
      console.error('Error retrieving builder template:', error)
      return null
    }
  }

  async createProductConfiguration(
    productId: string,
    options: Record<string, any>,
    customizations: Record<string, any> = {},
    customerId?: string
  ): Promise<ProductConfiguration> {
    const productModuleService: IProductModuleService = this.container.resolve(Modules.PRODUCT)
    
    try {
      const product = await productModuleService.retrieveProduct(productId)
      const basePrice = Number(product.variants?.[0]?.price || 0)
      
      // Calculate price modifiers based on options
      const priceModifiers = await this.calculatePriceModifiers(productId, options)
      const calculatedPrice = basePrice + priceModifiers

      const configuration: ProductConfiguration = {
        id: `config_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        productId,
        customerId,
        options,
        customizations,
        calculatedPrice,
        basePrice,
        priceModifiers,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // Store configuration
      await this.saveConfiguration(configuration)

      return configuration
    } catch (error) {
      console.error('Error creating product configuration:', error)
      throw error
    }
  }

  async addConfigurationToCart(
    configurationId: string,
    cartId: string,
    quantity: number = 1
  ): Promise<void> {
    const cartModuleService: ICartModuleService = this.container.resolve(Modules.CART)
    
    try {
      const configuration = await this.getConfiguration(configurationId)
      if (!configuration) {
        throw new Error('Configuration not found')
      }

      // Create a custom line item with the configuration
      await cartModuleService.addLineItems(cartId, [{
        variant_id: configuration.productId,
        quantity,
        title: `Custom ${configuration.productId}`,
        unit_price: configuration.calculatedPrice,
        metadata: {
          product_configuration: configuration,
          custom_price: configuration.calculatedPrice
        }
      }])
    } catch (error) {
      console.error('Error adding configuration to cart:', error)
      throw error
    }
  }

  async updateConfiguration(
    configurationId: string,
    updates: Partial<Pick<ProductConfiguration, 'options' | 'customizations'>>
  ): Promise<ProductConfiguration> {
    try {
      const configuration = await this.getConfiguration(configurationId)
      if (!configuration) {
        throw new Error('Configuration not found')
      }

      // Update configuration
      configuration.options = { ...configuration.options, ...updates.options }
      configuration.customizations = { ...configuration.customizations, ...updates.customizations }
      configuration.updatedAt = new Date()

      // Recalculate price
      const priceModifiers = await this.calculatePriceModifiers(configuration.productId, configuration.options)
      configuration.priceModifiers = priceModifiers
      configuration.calculatedPrice = configuration.basePrice + priceModifiers

      await this.saveConfiguration(configuration)

      return configuration
    } catch (error) {
      console.error('Error updating configuration:', error)
      throw error
    }
  }

  async getConfiguration(configurationId: string): Promise<ProductConfiguration | null> {
    // This would retrieve from database
    // For now, return null as placeholder
    return null
  }

  async getCustomerConfigurations(customerId: string): Promise<ProductConfiguration[]> {
    // This would retrieve customer's saved configurations
    return []
  }

  async saveConfiguration(configuration: ProductConfiguration): Promise<void> {
    // This would save to database
    console.log('Saving configuration:', configuration.id)
  }

  private async calculatePriceModifiers(productId: string, options: Record<string, any>): Promise<number> {
    const productModuleService: IProductModuleService = this.container.resolve(Modules.PRODUCT)
    
    try {
      const product = await productModuleService.retrieveProduct(productId)
      const template = await this.getBuilderTemplate(productId)
      
      if (!template) {
        return 0
      }

      let totalModifier = 0

      for (const option of template.options) {
        const optionValue = options[option.id]
        if (!optionValue) continue

        if (option.type === 'select' || option.type === 'radio') {
          const choice = option.choices?.find(c => c.id === optionValue)
          if (choice?.priceModifier) {
            totalModifier += choice.priceModifier
          }
        } else if (option.type === 'checkbox') {
          // Handle multiple checkbox selections
          if (Array.isArray(optionValue)) {
            for (const value of optionValue) {
              const choice = option.choices?.find(c => c.id === value)
              if (choice?.priceModifier) {
                totalModifier += choice.priceModifier
              }
            }
          }
        }
      }

      return totalModifier
    } catch (error) {
      console.error('Error calculating price modifiers:', error)
      return 0
    }
  }

  async validateConfiguration(productId: string, options: Record<string, any>): Promise<{
    isValid: boolean
    errors: string[]
  }> {
    const template = await this.getBuilderTemplate(productId)
    if (!template) {
      return { isValid: true, errors: [] }
    }

    const errors: string[] = []

    for (const option of template.options) {
      const value = options[option.id]

      // Check required fields
      if (option.required && (!value || value === '')) {
        errors.push(`${option.name} is required`)
        continue
      }

      // Validate based on option type
      if (value) {
        switch (option.type) {
          case 'text':
          case 'textarea':
            if (option.validation?.minLength && value.length < option.validation.minLength) {
              errors.push(`${option.name} must be at least ${option.validation.minLength} characters`)
            }
            if (option.validation?.maxLength && value.length > option.validation.maxLength) {
              errors.push(`${option.name} must be no more than ${option.validation.maxLength} characters`)
            }
            if (option.validation?.pattern && !new RegExp(option.validation.pattern).test(value)) {
              errors.push(`${option.name} format is invalid`)
            }
            break

          case 'select':
          case 'radio':
            const validChoices = option.choices?.map(c => c.id) || []
            if (!validChoices.includes(value)) {
              errors.push(`${option.name} selection is invalid`)
            }
            break

          case 'checkbox':
            if (Array.isArray(value)) {
              const validChoices = option.choices?.map(c => c.id) || []
              for (const v of value) {
                if (!validChoices.includes(v)) {
                  errors.push(`${option.name} selection is invalid`)
                  break
                }
              }
            }
            break
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}
