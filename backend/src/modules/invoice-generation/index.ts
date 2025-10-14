import { Module } from '@medusajs/utils'
import { InvoiceGenerationService } from './service'

export const INVOICE_GENERATION_MODULE = 'invoiceGenerationService'

export default Module(INVOICE_GENERATION_MODULE, {
  service: InvoiceGenerationService,
})
