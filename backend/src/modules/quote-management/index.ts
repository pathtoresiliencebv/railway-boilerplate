import { Module } from '@medusajs/utils'
import QuoteManagementService from './service'

export default Module('quoteManagementService', {
  service: QuoteManagementService
})
