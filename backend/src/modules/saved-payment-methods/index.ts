import { Module } from '@medusajs/utils'
import SavedPaymentMethodsService from './service'

export default Module("saved-payment-methodsService", {
  service: SavedPaymentMethodsService
})
