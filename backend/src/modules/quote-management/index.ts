import { Module } from '@medusajs/utils'
import QuoteManagementService from './service'

export default Module("quote-managementService", {
  service: QuoteManagementService
})
