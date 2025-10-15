import { Module } from '@medusajs/utils'
import ProductReviewsService from './service'

export default Module("product-reviewsService", {
  service: ProductReviewsService
})
