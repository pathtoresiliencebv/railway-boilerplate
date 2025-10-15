import { Module } from '@medusajs/utils'
import FirstPurchaseDiscountService from './service'

export default Module("first-purchase-discountService", {
  service: FirstPurchaseDiscountService
})
