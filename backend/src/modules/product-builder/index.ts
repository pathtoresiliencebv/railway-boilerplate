import { Module } from '@medusajs/utils'
import ProductBuilderService from './service'

export default Module("product-builderService", {
  service: ProductBuilderService
})
