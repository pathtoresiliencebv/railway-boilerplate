import { Module } from "@medusajs/framework/utils"
import QuoteManagementService from './service'

export const QUOTE_MANAGEMENT_MODULE = "quoteManagementService"

export default Module(QUOTE_MANAGEMENT_MODULE, {
  service: QuoteManagementService,
})
