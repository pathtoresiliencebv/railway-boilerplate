import { Module } from "@medusajs/framework/utils"
import WishlistService from './service'

export const WISHLIST_MODULE = "wishlistService"

export default Module(WISHLIST_MODULE, {
  service: WishlistService,
})
