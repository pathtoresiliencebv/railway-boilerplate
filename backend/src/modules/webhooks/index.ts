import { Module } from "@medusajs/framework/utils"
import WebhooksService from './service'

export const WEBHOOKS_MODULE = "webhooksService"

export default Module(WEBHOOKS_MODULE, {
  service: WebhooksService,
})
