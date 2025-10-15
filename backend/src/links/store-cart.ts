import { defineLink } from "@medusajs/framework/utils"
import StoreModule from "@medusajs/medusa/store"
import CartModule from "@medusajs/medusa/cart"

export default defineLink(
  StoreModule.linkable.store,
  {
    linkable: CartModule.linkable.cart,
    isList: true,
  }
)
