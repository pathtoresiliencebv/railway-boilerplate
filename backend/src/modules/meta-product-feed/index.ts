import { Module } from "@medusajs/framework/utils"
import MetaProductFeedService from './service'

export const META_PRODUCT_FEED_MODULE = "metaProductFeedService"

export default Module(META_PRODUCT_FEED_MODULE, {
  service: MetaProductFeedService,
})
