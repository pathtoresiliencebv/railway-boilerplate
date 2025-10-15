import { Module } from "@medusajs/framework/utils"
import ProductBuilderService from './service'

export const PRODUCT_BUILDER_MODULE = "productBuilderService"

export default Module(PRODUCT_BUILDER_MODULE, {
  service: ProductBuilderService,
})
