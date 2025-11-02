import { z } from 'zod';

export const cartValidation = {
  addItem: z.object({
    body: z.object({
      productId: z.string().min(1, 'productId is required'),
      shopId: z.string().optional(),
      quantity: z.number().int().min(1).default(1),
      unit: z.string().optional(),
      price: z.number().nonnegative().optional(),
      title: z.string().optional(),
      thumbnail: z.string().optional(),
      attrs: z.any().optional()
    })
  }),

  updateItem: z.object({
    params: z.object({
      itemId: z.string().min(1)
    }),
    body: z.object({
      quantity: z.number().int().min(1).optional(),
      unit: z.string().optional(),
      price: z.number().nonnegative().optional(),
      attrs: z.any().optional()
    }).partial()
  })
};
