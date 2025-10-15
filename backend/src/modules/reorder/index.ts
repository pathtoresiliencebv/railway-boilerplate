import { Module } from "@medusajs/framework/utils"
import ReorderService from './service'

export const REORDER_MODULE = "reorderService"

export default Module(REORDER_MODULE, {
  service: ReorderService,
})
