import { Module } from '@medusajs/utils'
import NewsletterService from './service'

export default Module("newsletterService", {
  service: NewsletterService
})
