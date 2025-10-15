import { Module } from '@medusajs/utils'
import GiftMessageService from './service'

export default Module('giftMessageService', {
  service: GiftMessageService
})
