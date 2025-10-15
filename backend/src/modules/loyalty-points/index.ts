import { Module } from '@medusajs/utils'
import LoyaltyPointsService from './service'

export default Module("loyalty-pointsService", {
  service: LoyaltyPointsService
})
