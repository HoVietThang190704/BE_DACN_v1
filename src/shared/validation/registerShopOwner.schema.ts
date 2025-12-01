import { z } from 'zod';

export const reviewRegisterShopOwnerSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID không hợp lệ')
  }),
  body: z.object({
    status: z.enum(['approved', 'rejected'], { message: 'Trạng thái không hợp lệ' }),
    reviewMessage: z.string().max(500).optional().nullable()
  })
});

export const listRegisterShopOwnerQuerySchema = z.object({
  query: z.object({
    status: z.enum(['pending', 'approved', 'rejected']).optional(),
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional()
  })
});
