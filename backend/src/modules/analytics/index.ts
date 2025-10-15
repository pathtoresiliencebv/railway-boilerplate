import { Module } from '@medusajs/utils'
import AnalyticsService from './service'

export default Module('analyticsService', {
  service: AnalyticsService
})
