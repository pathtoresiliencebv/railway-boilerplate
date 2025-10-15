import { Module } from "@medusajs/framework/utils"
import SavedPaymentMethodsService from './service'

export const SAVED_PAYMENT_METHODS_MODULE = "savedPaymentMethodsService"

export default Module(SAVED_PAYMENT_METHODS_MODULE, {
  service: SavedPaymentMethodsService,
})
