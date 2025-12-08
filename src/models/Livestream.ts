import mongoose, { Document, Schema } from 'mongoose';

export type LivestreamStatus = 'LIVE' | 'SCHEDULED' | 'ENDED';

export interface ILivestream extends Document {
  title: string;
  description: string;
  thumbnail?: string;
  streamUrl?: string;
  hostAvatar?: string;
  status: LivestreamStatus;
  hostId?: string;
  hostName?: string;
  viewerCount: number;
  startTime?: Date;
  endTime?: Date;
  products: string[];
  productPricing?: LivestreamProductPrice[];
  channelName: string; 
  createdAt: Date;
  updatedAt: Date;
}

export interface LivestreamProductPrice {
  productId: string;
  livePrice: number;
  maxQuantity?: number;
  claimedQuantity: number;
  active: boolean;
}

const LivestreamSchema: Schema = new Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: false, default: '' },
  thumbnail: { type: String, default: '' },
  hostAvatar: { type: String, default: '' },
  streamUrl: { type: String, default: '' },
  status: { type: String, enum: ['LIVE', 'SCHEDULED', 'ENDED'], default: 'SCHEDULED' },
  hostId: { type: String, default: '' },
  hostName: { type: String, default: '' },
  viewerCount: { type: Number, default: 0 },
  startTime: { type: Date },
  endTime: { type: Date },
  products: [{ type: String }],
  productPricing: {
    type: [
      new Schema({
        productId: { type: String, required: true },
        livePrice: { type: Number, required: true, min: 0 },
        maxQuantity: { type: Number, default: null, min: 0 },
        claimedQuantity: { type: Number, default: 0, min: 0 },
        active: { type: Boolean, default: true },
      }, { _id: false })
    ],
    default: []
  },
  channelName: { type: String, required: true, index: true }
}, { timestamps: true, collection: 'livestreams' });

LivestreamSchema.index({ status: 1, createdAt: -1 });

export const Livestream = mongoose.model<ILivestream>('Livestream', LivestreamSchema);
