import crypto from 'crypto';
import { OTP, OTPPurpose, OTPType } from '../models/OTP';
import { logger } from '../shared/utils/logger';
import { config } from '../config';
import { EmailService } from './EmailService';

const PHONE_REGEX = /^(\+84|84|0)[1-9][0-9]{8}$/;

export class OTPService {
  /**
   * Generate a 6-digit OTP
   */
  static generateOTP(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  private static normalizeTarget(target: string, type: OTPType): string {
    if (type === 'phone') {
      return this.normalizePhone(target);
    }
    return target.trim().toLowerCase();
  }

  private static getTargetLabel(target: string, type: OTPType, purpose: OTPPurpose): string {
    return `${type}/${purpose}: ${target}`;
  }

  /**
   * Create and persist OTP for a given target (phone/email)
   */
  static async createOTP(
    target: string,
    type: OTPType = 'phone',
    purpose: OTPPurpose = 'register'
  ): Promise<{ otp: string; expiresAt: Date }> {
    try {
      const normalizedTarget = this.normalizeTarget(target, type);

      await OTP.deleteMany({ target: normalizedTarget, targetType: type, purpose });

      const otpCode = this.generateOTP();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

      const otpDoc = new OTP({
        target: normalizedTarget,
        targetType: type,
        purpose,
        otp: otpCode,
        expiresAt,
        verified: false,
        attempts: 0
      });

      await otpDoc.save();

      logger.info(`OTP created for ${this.getTargetLabel(normalizedTarget, type, purpose)}`);
      return { otp: otpCode, expiresAt };
    } catch (error) {
      logger.error('Error creating OTP:', error);
      throw new Error('Failed to create OTP');
    }
  }

  static async createPhoneOTP(
    phone: string,
    purpose: OTPPurpose = 'register'
  ): Promise<{ otp: string; expiresAt: Date }> {
    return this.createOTP(phone, 'phone', purpose);
  }

  static async createEmailOTP(
    email: string,
    purpose: OTPPurpose = 'register'
  ): Promise<{ otp: string; expiresAt: Date }> {
    return this.createOTP(email, 'email', purpose);
  }

  /**
   * Verify OTP for a given target
   */
  static async verifyOTP(
    target: string,
    otp: string,
    type: OTPType = 'phone',
    purpose: OTPPurpose = 'register'
  ): Promise<boolean> {
    try {
      const normalizedTarget = this.normalizeTarget(target, type);

      const otpDoc = await OTP.findOne({
        target: normalizedTarget,
        targetType: type,
        purpose,
        verified: false
      }).sort({ createdAt: -1 });

      if (!otpDoc) {
        logger.warn(`No OTP found for ${this.getTargetLabel(normalizedTarget, type, purpose)}`);
        return false;
      }

      if (new Date() > otpDoc.expiresAt) {
        logger.warn(`OTP expired for ${this.getTargetLabel(normalizedTarget, type, purpose)}`);
        await OTP.deleteOne({ _id: otpDoc._id });
        return false;
      }

      if (otpDoc.attempts >= 5) {
        logger.warn(`Max attempts reached for ${this.getTargetLabel(normalizedTarget, type, purpose)}`);
        await OTP.deleteOne({ _id: otpDoc._id });
        return false;
      }

      otpDoc.attempts += 1;
      await otpDoc.save();

      if (otpDoc.otp === otp) {
        otpDoc.verified = true;
        await otpDoc.save();
        logger.info(`OTP verified successfully for ${this.getTargetLabel(normalizedTarget, type, purpose)}`);
        return true;
      }

      logger.warn(`Invalid OTP for ${this.getTargetLabel(normalizedTarget, type, purpose)}`);
      return false;
    } catch (error) {
      logger.error('Error verifying OTP:', error);
      throw new Error('Failed to verify OTP');
    }
  }

  static async verifyPhoneOTP(
    phone: string,
    otp: string,
    purpose: OTPPurpose = 'register'
  ): Promise<boolean> {
    return this.verifyOTP(phone, otp, 'phone', purpose);
  }

  static async verifyEmailOTP(
    email: string,
    otp: string,
    purpose: OTPPurpose = 'register'
  ): Promise<boolean> {
    return this.verifyOTP(email, otp, 'email', purpose);
  }

  /**
   * Send OTP for phone verification (currently logged in development mode)
   */
  static async sendOTP(phone: string, otp: string): Promise<boolean> {
    return this.sendPhoneOTP(phone, otp);
  }

  static async sendPhoneOTP(phone: string, otp: string): Promise<boolean> {
    try {
      const normalizedPhone = this.normalizePhone(phone);

      console.log('\n' + '='.repeat(60));
      console.log('🔐 OTP CODE FOR TESTING');
      console.log('='.repeat(60));
      console.log(`Phone: ${normalizedPhone}`);
      console.log(`OTP: ${otp}`);
      console.log('Expires: 5 minutes');
      console.log('='.repeat(60) + '\n');

      return config.NODE_ENV === 'development' ? true : false;
    } catch (error) {
      logger.error('Error in sendPhoneOTP:', error);
      return false;
    }
  }

  static async sendEmailOTP(email: string, otp: string): Promise<boolean> {
    try {
      return await EmailService.sendOtpEmail(email.trim().toLowerCase(), otp);
    } catch (error) {
      logger.error('Error sending email OTP:', error);
      return false;
    }
  }

  static async sendPasswordResetEmailOTP(email: string, otp: string): Promise<boolean> {
    try {
      return await EmailService.sendPasswordResetOtpEmail(email.trim().toLowerCase(), otp);
    } catch (error) {
      logger.error('Error sending password reset email OTP:', error);
      return false;
    }
  }

  /**
   * Normalize phone number to consistent format (0xxxxxxxxx)
   */
  static normalizePhone(phone: string): string {
    let normalized = phone.trim();

    if (normalized.startsWith('+84')) {
      normalized = '0' + normalized.substring(3);
    } else if (normalized.startsWith('84')) {
      normalized = '0' + normalized.substring(2);
    }

    if (!PHONE_REGEX.test(normalized)) {
      throw new Error('Số điện thoại không hợp lệ');
    }

    return normalized;
  }

  /**
   * Clean up expired OTPs
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
