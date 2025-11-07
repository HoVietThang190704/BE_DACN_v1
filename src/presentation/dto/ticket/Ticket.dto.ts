import { Ticket } from '../../../models/Ticket';
import { TicketComment } from '../../../models/TicketComment';

export interface TicketDTO {
  id: string;
  ticketNumber?: string | null;
  title: string;
  description?: string;
  type: string;
  priority: string;
  status: string;
  createdBy: string;
  assignedTo?: string | null;
  relatedShopId?: string | null;
  relatedOrderId?: string | null;
  tags?: string[];
  attachments?: any[];
  commentsCount?: number;
  slaDueAt?: string | null;
  slaBreached?: boolean;
  isPublic?: boolean;
  resolutionMessage?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export class TicketMapper {
  static toDTO(doc: any): TicketDTO {
    return {
      id: String(doc._id),
      ticketNumber: doc.ticket_number || null,
      title: doc.title,
      description: doc.description,
      type: doc.type,
      priority: doc.priority,
      status: doc.status,
      createdBy: String(doc.created_by),
      assignedTo: doc.assigned_to ? String(doc.assigned_to) : null,
      relatedShopId: doc.related_shop_id ? String(doc.related_shop_id) : null,
      relatedOrderId: doc.related_order_id ? String(doc.related_order_id) : null,
      tags: doc.tags || [],
      attachments: doc.attachments || [],
      commentsCount: doc.comments_count || 0,
      slaDueAt: doc.sla_due_at ? new Date(doc.sla_due_at).toISOString() : null,
      slaBreached: !!doc.sla_breached,
      isPublic: !!doc.is_public,
      resolutionMessage: doc.resolution_message || null,
      resolvedAt: doc.resolved_at ? new Date(doc.resolved_at).toISOString() : null,
      createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : new Date().toISOString()
    };
  }
}
