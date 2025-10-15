import { Module } from '@medusajs/utils'
import FirstPurchaseDiscountService from './service'

export default Module('firstPurchaseDiscountService', {
  service: FirstPurchaseDiscountService
})
