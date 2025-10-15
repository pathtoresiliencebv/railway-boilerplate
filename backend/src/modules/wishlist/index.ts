import { Module } from '@medusajs/utils'
import WishlistService from './service'

export default Module('wishlistService', {
  service: WishlistService
})
