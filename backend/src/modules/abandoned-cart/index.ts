import { Module } from '@medusajs/utils'
import { AbandonedCartService } from './service'

export const ABANDONED_CART_MODULE = 'abandonedCartService'

export default Module(ABANDONED_CART_MODULE, {
  service: AbandonedCartService,
})
