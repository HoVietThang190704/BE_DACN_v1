import mongoose, { Schema } from 'mongoose';

const TicketCommentSchema = new Schema({
  ticket_id: { type: Schema.Types.ObjectId, ref: 'Ticket', required: true, index: true },
  author_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  message: { type: String, required: true },
  attachments: [{ url: String, filename: String, mimeType: String }],
  is_internal: { type: Boolean, default: false }
}, { timestamps: true });

export const TicketComment = mongoose.model('TicketComment', TicketCommentSchema);
