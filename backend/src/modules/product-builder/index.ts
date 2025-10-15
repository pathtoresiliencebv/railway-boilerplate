import { Module } from '@medusajs/utils'
import ProductBuilderService from './service'

export default Module('productBuilderService', {
  service: ProductBuilderService
})
