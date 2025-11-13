import { z } from 'zod';

export const createVoucherSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  // allow both 'percent' and 'percentage' as synonyms for percent-based vouchers
  type: z.union([z.literal('fixed'), z.literal('percent'), z.literal('percentage')]),
  value: z.number().positive(),
  code: z.string().optional(),
  startsAt: z.string().optional(),
  expiresAt: z.string().optional(),
  usageLimit: z.number().int().positive().optional(),
  perUserLimit: z.number().int().positive().optional(),
  maxDiscountAmount: z.number().positive().optional()
});

export const issueVoucherSchema = z.object({ userId: z.string().min(1) });

// Accept either `cartTotal` (existing) or `orderAmount` (alias) when redeeming.
export const redeemVoucherSchema = z.object({
  code: z.string().min(1),
  orderId: z.string().optional(),
  cartTotal: z.number().nonnegative().optional(),
  orderAmount: z.number().nonnegative().optional()
}).refine(data => data.cartTotal !== undefined || data.orderAmount !== undefined, {
  message: 'Either cartTotal or orderAmount is required',
  path: ['cartTotal', 'orderAmount']
});

export const refundVoucherSchema = z.object({ orderId: z.string().min(1) });

export default {
  createVoucherSchema,
  issueVoucherSchema,
  redeemVoucherSchema,
  refundVoucherSchema
};
