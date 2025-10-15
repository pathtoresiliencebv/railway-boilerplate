import { Module } from '@medusajs/utils'
import SavedPaymentMethodsService from './service'

export default Module('savedPaymentMethodsService', {
  service: SavedPaymentMethodsService
})
