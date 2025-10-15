import { Module } from '@medusajs/utils'
import InvoiceGenerationService from './service'

export default Module("invoice-generationService", {
  service: InvoiceGenerationService
})
