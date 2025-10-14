import { ICustomerModuleService } from '@medusajs/framework/types'
import { Modules } from '@medusajs/framework/utils'

export interface PhoneVerification {
  id: string
  phoneNumber: string
  code: string
  expiresAt: Date
  attempts: number
  isVerified: boolean
  verifiedAt?: Date
}

export interface PhoneAuthSession {
  id: string
  phoneNumber: string
  isAuthenticated: boolean
  customerId?: string
  createdAt: Date
  expiresAt: Date
}

export default class PhoneAuthService {
  constructor(
    private container: any
  ) {}

  async sendVerificationCode(phoneNumber: string): Promise<PhoneVerification> {
    try {
      // Generate 6-digit verification code
      const code = Math.floor(100000 + Math.random() * 900000).toString()
      
      const verification: PhoneVerification = {
        id: `phone_verification_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        phoneNumber: this.normalizePhoneNumber(phoneNumber),
        code,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        attempts: 0,
        isVerified: false
      }

      // Store verification in temporary storage
      await this.saveVerification(verification)

      // Send SMS via Twilio or similar service
      await this.sendSMS(phoneNumber, code)

      return verification
    } catch (error) {
      console.error('Error sending verification code:', error)
      throw error
    }
  }

  async verifyCode(phoneNumber: string, code: string): Promise<PhoneAuthSession> {
    try {
      const verification = await this.getVerification(phoneNumber)
      
      if (!verification) {
        throw new Error('No verification found for this phone number')
      }

      if (verification.isVerified) {
        throw new Error('Phone number already verified')
      }

      if (verification.expiresAt < new Date()) {
        throw new Error('Verification code has expired')
      }

      if (verification.attempts >= 3) {
        throw new Error('Too many verification attempts')
      }

      if (verification.code !== code) {
        verification.attempts++
        await this.updateVerification(verification)
        throw new Error('Invalid verification code')
      }

      // Mark as verified
      verification.isVerified = true
      verification.verifiedAt = new Date()
      await this.updateVerification(verification)

      // Create authentication session
      const session: PhoneAuthSession = {
        id: `phone_session_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        phoneNumber: verification.phoneNumber,
        isAuthenticated: true,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      }

      await this.saveSession(session)

      return session
    } catch (error) {
      console.error('Error verifying code:', error)
      throw error
    }
  }

  async authenticateWithPhone(phoneNumber: string, code: string): Promise<{
    session: PhoneAuthSession
    customer?: any
    isNewCustomer: boolean
  }> {
    try {
      const session = await this.verifyCode(phoneNumber, code)
      
      // Check if customer exists with this phone number
      const customer = await this.findCustomerByPhone(phoneNumber)
      
      if (customer) {
        session.customerId = customer.id
        await this.updateSession(session)
        
        return {
          session,
          customer,
          isNewCustomer: false
        }
      } else {
        // Create new customer with phone number
        const newCustomer = await this.createCustomerWithPhone(phoneNumber)
        session.customerId = newCustomer.id
        await this.updateSession(session)
        
        return {
          session,
          customer: newCustomer,
          isNewCustomer: true
        }
      }
    } catch (error) {
      console.error('Error authenticating with phone:', error)
      throw error
    }
  }

  async validateSession(sessionId: string): Promise<PhoneAuthSession | null> {
    try {
      const session = await this.getSession(sessionId)
      
      if (!session) {
        return null
      }

      if (session.expiresAt < new Date()) {
        await this.deleteSession(sessionId)
        return null
      }

      return session
    } catch (error) {
      console.error('Error validating session:', error)
      return null
    }
  }

  async logout(sessionId: string): Promise<void> {
    try {
      await this.deleteSession(sessionId)
    } catch (error) {
      console.error('Error logging out:', error)
      throw error
    }
  }

  private normalizePhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    const digits = phoneNumber.replace(/\D/g, '')
    
    // Add country code if not present (assuming US +1)
    if (digits.length === 10) {
      return `+1${digits}`
    } else if (digits.length === 11 && digits.startsWith('1')) {
      return `+${digits}`
    }
    
    return `+${digits}`
  }

  private async sendSMS(phoneNumber: string, code: string): Promise<void> {
    // This would integrate with Twilio, AWS SNS, or similar SMS service
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      console.log(`SMS would be sent to ${phoneNumber}: Your verification code is ${code}`)
      return
    }

    // Twilio integration would go here
    console.log(`SMS sent to ${phoneNumber}: Your verification code is ${code}`)
  }

  private async saveVerification(verification: PhoneVerification): Promise<void> {
    // This would save to Redis or similar temporary storage
    console.log('Saving verification:', verification.id)
  }

  private async getVerification(phoneNumber: string): Promise<PhoneVerification | null> {
    // This would retrieve from Redis or similar temporary storage
    return null
  }

  private async updateVerification(verification: PhoneVerification): Promise<void> {
    // This would update in Redis or similar temporary storage
    console.log('Updating verification:', verification.id)
  }

  private async saveSession(session: PhoneAuthSession): Promise<void> {
    // This would save to Redis or similar session storage
    console.log('Saving session:', session.id)
  }

  private async getSession(sessionId: string): Promise<PhoneAuthSession | null> {
    // This would retrieve from Redis or similar session storage
    return null
  }

  private async updateSession(session: PhoneAuthSession): Promise<void> {
    // This would update in Redis or similar session storage
    console.log('Updating session:', session.id)
  }

  private async deleteSession(sessionId: string): Promise<void> {
    // This would delete from Redis or similar session storage
    console.log('Deleting session:', sessionId)
  }

  private async findCustomerByPhone(phoneNumber: string): Promise<any | null> {
    const customerModuleService: ICustomerModuleService = this.container.resolve(Modules.CUSTOMER)
    
    try {
      // This would search for customers by phone number in metadata
      // For now, return null as placeholder
      return null
    } catch (error) {
      console.error('Error finding customer by phone:', error)
      return null
    }
  }

  private async createCustomerWithPhone(phoneNumber: string): Promise<any> {
    const customerModuleService: ICustomerModuleService = this.container.resolve(Modules.CUSTOMER)
    
    try {
      const customer = await customerModuleService.createCustomers({
        phone: phoneNumber,
        metadata: {
          phone_verified: true,
          phone_verified_at: new Date().toISOString()
        }
      })

      return customer
    } catch (error) {
      console.error('Error creating customer with phone:', error)
      throw error
    }
  }
}
