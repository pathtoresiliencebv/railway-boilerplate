import { Module } from '@medusajs/utils'
import PhoneAuthService from './service'

export default Module('phoneAuthService', {
  service: PhoneAuthService
})
