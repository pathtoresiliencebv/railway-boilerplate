import { Module } from '@medusajs/utils'
import { CustomItemPricingService } from './service'

export const CUSTOM_ITEM_PRICING_MODULE = 'customItemPricingService'

export default Module(CUSTOM_ITEM_PRICING_MODULE, {
  service: CustomItemPricingService,
})
