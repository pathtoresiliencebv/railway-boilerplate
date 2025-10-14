import { Module } from '@medusajs/utils'
import { AgenticCommerceService } from './service'

export const AGENTIC_COMMERCE_MODULE = 'agenticCommerceService'

export default Module(AGENTIC_COMMERCE_MODULE, {
  service: AgenticCommerceService,
})
