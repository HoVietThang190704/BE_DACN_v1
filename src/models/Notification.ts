import mongoose, { Schema } from 'mongoose';

export interface INotification {
  _id?: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId; // keep simple and compatible with existing table
  type?: string;
  title: string;
  message: string;
  payload?: any;
  isRead?: boolean;
  readAt?: Date | null;
  createdAt?: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, default: 'system' },
    title: { type: String, required: true },
    message: { type: String, required: true },
    payload: { type: Schema.Types.Mixed, default: null },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
    createdAt: { type: Date, default: () => new Date() }
  },
  {
    collection: 'notifications',
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
