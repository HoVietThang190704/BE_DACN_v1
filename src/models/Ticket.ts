import mongoose, { Schema, Document } from 'mongoose';

export interface ITicket extends Document {
  ticket_number?: string | null;
  title: string;
  description?: string;
  type: 'support'|'bug'|'feature'|'question'|'refund'|'other';
  priority: 'low'|'medium'|'high'|'urgent';
  status: 'open'|'in_progress'|'on_hold'|'resolved'|'closed'|'rejected';
  created_by: mongoose.Types.ObjectId;
  assigned_to?: mongoose.Types.ObjectId | null;
  related_shop_id?: mongoose.Types.ObjectId | null;
  related_shop_reference?: string | null;
  related_order_id?: mongoose.Types.ObjectId | null;
  related_order_reference?: string | null;
  tags?: string[];
  attachments?: Array<any>;
  comments_count?: number;
  is_public?: boolean;
  resolution_message?: string | null;
  resolved_at?: Date | null;
  // is_active removed from schema
  createdAt: Date;
  updatedAt: Date;
}

const TicketSchema = new Schema<ITicket>({
  ticket_number: { type: String, unique: true, sparse: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 250 },
  description: { type: String, default: '' },
  type: { type: String, enum: ['support','bug','feature','question','refund','other'], default: 'support', index: true },
  priority: { type: String, enum: ['low','medium','high','urgent'], default: 'medium', index: true },
  status: { type: String, enum: ['open','in_progress','on_hold','resolved','closed','rejected'], default: 'open', index: true },
  created_by: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  assigned_to: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  related_shop_id: { type: Schema.Types.ObjectId, ref: 'Shop', default: null, index: true },
  related_shop_reference: { type: String, default: null, trim: true },
  related_order_id: { type: Schema.Types.ObjectId, ref: 'Order', default: null, index: true },
  related_order_reference: { type: String, default: null, trim: true },
  tags: [String],
  attachments: [{ url: String, filename: String, mimeType: String, size: Number, uploaded_by: { type: Schema.Types.ObjectId, ref: 'User' }, uploaded_at: Date }],
  comments_count: { type: Number, default: 0 },
  // NOTE: removed unused fields (sla_breached, read_by, is_active) to simplify schema
  is_public: { type: Boolean, default: true },
  resolution_message: { type: String, default: null },
  resolved_at: { type: Date, default: null }
}, { timestamps: true });

TicketSchema.index({ title: 'text', description: 'text' });

export const Ticket = mongoose.model<ITicket>('Ticket', TicketSchema);
