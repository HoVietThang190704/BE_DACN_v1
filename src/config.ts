import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  // PORT must be a number. Use provided env PORT (Render sets this) or default to 5000.
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  NODE_IP: process.env.IP || 'localhost',
  FRONTEND_BASE_URL: process.env.FRONTEND_URL || process.env.FRONTEND_BASE_URL || 'http://localhost:3000',
  // Database - MongoDB
  MONGODB_URI: process.env.MONGODB_URI || (() => {
    console.error('❌ MONGODB_URI environment variable is required!');
    if (process.env.NODE_ENV === 'production') {
      throw new Error('MONGODB_URI is required in production');
    }
    return 'mongodb://localhost:27017/dacn_fallback';
  })(),
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET || (() => {
    console.error('❌ JWT_SECRET environment variable is required!');
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET is required in production');
    }
    return 'dev-secret-key-change-in-production';
  })(),
  JWT_EXPIRES_IN: (process.env.JWT_EXPIRES_IN || '24h') as string,
  JWT_REFRESH_EXPIRES_IN: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as string,
  
  // Upload
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  
  // External APIs
  SMS_API_KEY: process.env.SMS_API_KEY || '',
  EMAIL_SERVICE_API_KEY: process.env.EMAIL_SERVICE_API_KEY || '',
  
  // Business Logic
  STUDENT_DISCOUNT_PERCENT: 15,
  FREE_SHIPPING_THRESHOLD: 200000, // 200k VND
  LOYALTY_POINTS_RATE: 100, // 100 VND = 1 point
  
  // Rate Limiting
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: 100,
  // Agora
  AGORA_APP_ID: process.env.AGORA_APP_ID || '',
  AGORA_APP_CERT: process.env.AGORA_APP_CERT || '',
  AGORA_TOKEN_EXPIRE_SECONDS: parseInt(process.env.AGORA_TOKEN_EXPIRE_SECONDS || '3600', 10),

  // Google OAuth
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  GOOGLE_CLIENT_AUDIENCES: process.env.GOOGLE_CLIENT_AUDIENCES || '',

  // Facebook OAuth
  FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID || '',
  FACEBOOK_APP_SECRET: process.env.FACEBOOK_APP_SECRET || '',

  // VNPay
  VNPAY_TMNCODE: process.env.VNPAY_TMNCODE || '',
  VNPAY_HASH_SECRET: process.env.VNPAY_HASH_SECRET || '',
  VNPAY_PAYMENT_URL: process.env.VNPAY_PAYMENT_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
  VNPAY_RETURN_URL: process.env.VNPAY_RETURN_URL || 'http://localhost:5000/api/payments/vnpay/callback',

  // Firebase Admin (service account JSON as a single env var string)
  FIREBASE_SERVICE_ACCOUNT_JSON: process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '',
  // HTTPS (optional)
  SSL_KEY_PATH: process.env.SSL_KEY_PATH || '',
  SSL_CERT_PATH: process.env.SSL_CERT_PATH || '',
  SSL_CA_PATH: process.env.SSL_CA_PATH || '',

  // Search
  ELASTICSEARCH_NODE: process.env.ELASTICSEARCH_NODE || 'http://localhost:9201'
} as const;