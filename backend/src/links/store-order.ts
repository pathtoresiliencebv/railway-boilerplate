import { defineLink } from "@medusajs/framework/utils"
import StoreModule from "@medusajs/medusa/store"
import OrderModule from "@medusajs/medusa/order"

export default defineLink(
  StoreModule.linkable.store,
  {
    linkable: OrderModule.linkable.order,
    isList: true,
  }
)
