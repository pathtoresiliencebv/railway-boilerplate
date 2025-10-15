import { Module } from '@medusajs/utils'
import InvoiceGenerationService from './service'

export default Module('invoiceGenerationService', {
  service: InvoiceGenerationService
})
