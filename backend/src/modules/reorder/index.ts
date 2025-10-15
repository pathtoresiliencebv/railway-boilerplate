import { Module } from '@medusajs/utils'
import ReorderService from './service'

export default Module("reorderService", {
  service: ReorderService
})
