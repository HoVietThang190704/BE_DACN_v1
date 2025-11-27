import mongoose, { Document, Schema } from 'mongoose';

export interface IOTP extends Document {
  phone: string;
  otp: string;
  expiresAt: Date;
  verified: boolean;
  attempts: number;
  createdAt: Date;
}

const OTPSchema: Schema = new Schema({
  phone: {
    type: String,
    required: true,
    match: [
      /^(\+84|84|0)[1-9][0-9]{8}$/,
      'Số điện thoại không hợp lệ'
    ]
  },
  otp: {
    type: String,
    required: true,
    length: 6
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
    index: { expires: '5m' } // TTL index - auto delete after expiration
  },
  verified: {
    type: Boolean,
    default: false
  },
  attempts: {
    type: Number,
    default: 0,
    max: 5 // Maximum 5 verification attempts
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for quick lookup
OTPSchema.index({ phone: 1, createdAt: -1 });

export const OTP = mongoose.model<IOTP>('OTP', OTPSchema);
