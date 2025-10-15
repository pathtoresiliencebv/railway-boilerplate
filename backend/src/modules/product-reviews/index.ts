import { Module } from '@medusajs/utils'
import ProductReviewsService from './service'

export default Module('productReviewsService', {
  service: ProductReviewsService
})
