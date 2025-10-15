import { Module } from "@medusajs/framework/utils"
import LoyaltyPointsService from './service'

export const LOYALTY_POINTS_MODULE = "loyaltyPointsService"

export default Module(LOYALTY_POINTS_MODULE, {
  service: LoyaltyPointsService,
})
