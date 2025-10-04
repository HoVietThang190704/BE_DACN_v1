import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  PORT: parseInt(process.env.PORT || '3000'),
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database - MongoDB
  MONGODB_URI: process.env.MONGODB_URI || (() => {
    throw new Error('MONGODB_URI environment variable is required. Please check your .env file.');
  })(),
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET || (() => {
    throw new Error('JWT_SECRET environment variable is required. Please check your .env file.');
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
  RATE_LIMIT_MAX_REQUESTS: 100
} as const;