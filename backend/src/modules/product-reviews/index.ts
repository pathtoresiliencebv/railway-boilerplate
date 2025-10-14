import { Module } from '@medusajs/utils'
import { ProductReviewsService } from './service'

export const PRODUCT_REVIEWS_MODULE = 'productReviewsService'

export default Module(PRODUCT_REVIEWS_MODULE, {
  service: ProductReviewsService,
})
