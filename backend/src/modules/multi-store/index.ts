import { Module } from "@medusajs/framework/utils"
import Service from "./service"

export const MULTI_STORE_MODULE = "multiStoreService"

export default Module(MULTI_STORE_MODULE, {
  service: Service,
})
