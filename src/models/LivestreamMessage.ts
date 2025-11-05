import mongoose, { Schema, Document } from 'mongoose';

export interface ILivestreamMessage extends Document {
  livestreamId: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Date;
}

const LivestreamMessageSchema = new Schema({
  livestreamId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true,
    maxlength: 500
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
LivestreamMessageSchema.index({ livestreamId: 1, timestamp: -1 });

export const LivestreamMessage = mongoose.model<ILivestreamMessage>('LivestreamMessage', LivestreamMessageSchema);
