import crypto from 'crypto';
import { OTP } from '../models/OTP';
import { logger } from '../shared/utils/logger';
import { config } from '../config';

export class OTPService {
  /**
   * Generate a 6-digit OTP
   */
  static generateOTP(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Create and save OTP for a phone number
   */
  static async createOTP(phone: string): Promise<{ otp: string; expiresAt: Date }> {
    try {
      // Normalize phone number (remove +84, 84 prefix, ensure starts with 0)
      const normalizedPhone = this.normalizePhone(phone);

      // Delete any existing OTP for this phone
      await OTP.deleteMany({ phone: normalizedPhone });

      // Generate new OTP
      const otpCode = this.generateOTP();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      // Save to database
      const otpDoc = new OTP({
        phone: normalizedPhone,
        otp: otpCode,
        expiresAt,
        verified: false,
        attempts: 0
      });

      await otpDoc.save();

      logger.info(`OTP created for phone: ${normalizedPhone}`);
      return { otp: otpCode, expiresAt };
    } catch (error) {
      logger.error('Error creating OTP:', error);
      throw new Error('Failed to create OTP');
    }
  }

  /**
   * Verify OTP for a phone number
   */
  static async verifyOTP(phone: string, otp: string): Promise<boolean> {
    try {
      const normalizedPhone = this.normalizePhone(phone);

      // Find the most recent OTP for this phone
      const otpDoc = await OTP.findOne({
        phone: normalizedPhone,
        verified: false
      }).sort({ createdAt: -1 });

      if (!otpDoc) {
        logger.warn(`No OTP found for phone: ${normalizedPhone}`);
        return false;
      }

      // Check if OTP is expired
      if (new Date() > otpDoc.expiresAt) {
        logger.warn(`OTP expired for phone: ${normalizedPhone}`);
        await OTP.deleteOne({ _id: otpDoc._id });
        return false;
      }

      // Check attempts
      if (otpDoc.attempts >= 5) {
        logger.warn(`Max attempts reached for phone: ${normalizedPhone}`);
        await OTP.deleteOne({ _id: otpDoc._id });
        return false;
      }

      // Increment attempts
      otpDoc.attempts += 1;
      await otpDoc.save();

      // Verify OTP
      if (otpDoc.otp === otp) {
        otpDoc.verified = true;
        await otpDoc.save();
        logger.info(`OTP verified successfully for phone: ${normalizedPhone}`);
        return true;
      }

      logger.warn(`Invalid OTP for phone: ${normalizedPhone}`);
      return false;
    } catch (error) {
      logger.error('Error verifying OTP:', error);
      throw new Error('Failed to verify OTP');
    }
  }

  /**
   * Send OTP via SMS using SpeedSMS (Vietnam)
   */
  static async sendOTP(phone: string, otp: string): Promise<boolean> {
    try {
      const normalizedPhone = this.normalizePhone(phone);

      // Log OTP in development for easy testing
      console.log('\n' + '='.repeat(60));
      console.log('🔐 OTP CODE FOR TESTING');
      console.log('='.repeat(60));
      console.log(`Phone: ${normalizedPhone}`);
      console.log(`OTP: ${otp}`);
      console.log(`Expires: 5 minutes`);
      console.log('='.repeat(60) + '\n');

      // Since SMS sending is handled by Firebase on the client, we no longer
      // send via external SMS providers from the backend. Keep returning true
      // in development to allow flows to proceed when OTPs are logged.
      return config.NODE_ENV === 'development' ? true : false;
    } catch (error) {
      logger.error('Error in sendOTP (removed external providers):', error);
      return false;
    }
  }

  /**
   * Normalize phone number to consistent format (0xxxxxxxxx)
   */
  static normalizePhone(phone: string): string {
    let normalized = phone.trim();
    
    // Remove +84 or 84 prefix
    if (normalized.startsWith('+84')) {
      normalized = '0' + normalized.substring(3);
    } else if (normalized.startsWith('84')) {
      normalized = '0' + normalized.substring(2);
    }
    
    return normalized;
  }

  /**
   * Clean up expired OTPs (optional maintenance task)
   */
  static async cleanupExpiredOTPs(): Promise<void> {
    try {
      const result = await OTP.deleteMany({
        expiresAt: { $lt: new Date() }
      });
      logger.info(`Cleaned up ${result.deletedCount} expired OTPs`);
    } catch (error) {
      logger.error('Error cleaning up OTPs:', error);
    }
  }
}
