import { Module } from "@medusajs/framework/utils"
import PhoneAuthService from './service'

export const PHONE_AUTH_MODULE = "phoneAuthService"

export default Module(PHONE_AUTH_MODULE, {
  service: PhoneAuthService,
})
