import axios from 'axios';
import { config } from '../config';
import { logger } from '../shared/utils/logger';

interface EmailPayload {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

const SENDGRID_API_URL = 'https://api.sendgrid.com/v3/mail/send';

export class EmailService {
  private static logEmailToConsole(payload: EmailPayload): void {
    console.log('\n' + '='.repeat(60));
    console.log('📧 EMAIL PREVIEW (development mode)');
    console.log('='.repeat(60));
    console.log(`To: ${payload.to}`);
    console.log(`Subject: ${payload.subject}`);
    console.log('Text content:\n' + payload.text);
    if (payload.html) {
      console.log('\nHTML content:\n' + payload.html);
    }
    console.log('='.repeat(60) + '\n');
  }

  static async sendEmail(payload: EmailPayload): Promise<boolean> {
    if (!config.EMAIL_SERVICE_API_KEY) {
      logger.warn('EMAIL_SERVICE_API_KEY is not configured. Email will not be sent.');
      if (config.NODE_ENV === 'development') {
        this.logEmailToConsole(payload);
        return true;
      }
      return false;
    }

    const fromEmail = config.EMAIL_FROM_ADDRESS || 'no-reply@dacn.local';
    const fromName = config.EMAIL_FROM_NAME || 'DACN Platform';

    const requestBody = {
      personalizations: [
        {
          to: [{ email: payload.to }]
        }
      ],
      from: {
        email: fromEmail,
        name: fromName
      },
      subject: payload.subject,
      content: [
        { type: 'text/plain', value: payload.text },
        { type: 'text/html', value: payload.html || `<p>${payload.text}</p>` }
      ]
    };

    try {
      await axios.post(SENDGRID_API_URL, requestBody, {
        headers: {
          Authorization: `Bearer ${config.EMAIL_SERVICE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      logger.info(`Email sent to ${payload.to} with subject "${payload.subject}"`);
      return true;
    } catch (error) {
      logger.error('Error sending email via SendGrid:', error);
      if (config.NODE_ENV === 'development') {
        this.logEmailToConsole(payload);
        return true;
      }
      return false;
    }
  }

  static async sendOtpEmail(email: string, otp: string): Promise<boolean> {
    const subject = 'Mã xác thực đăng ký tài khoản (OTP)';
    const text = `Mã xác thực của bạn là ${otp}. Mã sẽ hết hạn sau 5 phút.`;
    const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.5; color: #111827;">
        <h2 style="color: #16a34a;">Xác thực đăng ký tài khoản</h2>
        <p>Xin chào,</p>
        <p>Mã OTP của bạn là:</p>
        <p style="font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #111827;">${otp}</p>
        <p>Mã sẽ hết hạn sau <strong>5 phút</strong>. Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>
        <p>Nếu bạn không yêu cầu đăng ký tài khoản, vui lòng bỏ qua email này.</p>
        <p style="margin-top: 24px;">Trân trọng,<br/>Đội ngũ DACN Platform</p>
      </div>
    `;

    return this.sendEmail({ to: email, subject, text, html });
  }
}
