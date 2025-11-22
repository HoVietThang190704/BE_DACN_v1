import { z } from 'zod';

export const createTicketSchema = z.object({
  title: z.string().min(3).max(250),
  description: z.string().optional(),
  type: z.enum(['support','bug','feature','question','refund','other']).optional(),
  priority: z.enum(['low','medium','high','urgent']).optional(),
  relatedShopId: z.string().optional(),
  relatedOrderId: z.string().optional(),
  relatedShopReference: z.string().max(120).optional(),
  relatedOrderReference: z.string().max(120).optional(),
  attachments: z.array(z.object({ url: z.string(), filename: z.string().optional() })).optional(),
  isPublic: z.boolean().optional()
});

export const addCommentSchema = z.object({
  message: z.string().min(1),
  attachments: z.array(z.object({ url: z.string(), filename: z.string().optional() })).optional(),
  isInternal: z.boolean().optional()
});

export const assignTicketSchema = z.object({
  assignedTo: z.string().min(1)
});

export const updateStatusSchema = z.object({
  status: z.enum(['open','in_progress','on_hold','resolved','closed','rejected']),
  resolutionMessage: z.string().optional()
});
