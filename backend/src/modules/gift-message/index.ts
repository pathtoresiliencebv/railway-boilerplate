import { Module } from '@medusajs/utils'
import GiftMessageService from './service'

export default Module("gift-messageService", {
  service: GiftMessageService
})
