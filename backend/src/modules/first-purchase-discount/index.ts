import { Module } from '@medusajs/utils'
import { FirstPurchaseDiscountService } from './service'

export const FIRST_PURCHASE_DISCOUNT_MODULE = 'firstPurchaseDiscountService'

export default Module(FIRST_PURCHASE_DISCOUNT_MODULE, {
  service: FirstPurchaseDiscountService,
})
