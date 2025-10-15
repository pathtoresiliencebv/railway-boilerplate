import { Module } from '@medusajs/utils'
import CustomItemPricingService from './service'

export default Module("custom-item-pricingService", {
  service: CustomItemPricingService
})
