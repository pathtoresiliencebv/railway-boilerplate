import { Module } from '@medusajs/utils'
import CustomItemPricingService from './service'

export default Module('customItemPricingService', {
  service: CustomItemPricingService
})
