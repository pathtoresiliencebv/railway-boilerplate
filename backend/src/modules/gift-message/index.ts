import { Module } from "@medusajs/framework/utils"
import GiftMessageService from './service'

export const GIFT_MESSAGE_MODULE = "giftMessageService"

export default Module(GIFT_MESSAGE_MODULE, {
  service: GiftMessageService,
})
