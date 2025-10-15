import { Module } from '@medusajs/utils'
import MetaProductFeedService from './service'

export default Module('metaProductFeedService', {
  service: MetaProductFeedService
})
