import { Module } from '@medusajs/utils'
import AbandonedCartService from './service'

export default Module("abandoned-cartService", {
  service: AbandonedCartService
})
