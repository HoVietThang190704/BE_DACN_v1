import { z } from 'zod';

export const createShopSchema = z.object({
  body: z.object({
    ownerId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Owner ID không hợp lệ').optional(),
    shopName: z.string().min(1, 'Tên shop không được để trống').max(150, 'Tên shop quá dài').trim(),
    story: z.string().max(2000, 'Story quá dài').optional(),
    slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug chỉ chứa chữ thường, số và dấu gạch ngang').trim().toLowerCase().optional(),
    isActive: z.boolean().optional()
  })
});

export const updateShopSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Shop ID không hợp lệ')
  }),
  body: z.object({
    shopName: z.string().min(1,'Tên shop không được để trống').max(150,'Tên shop quá dài').trim().optional(),
    story: z.string().max(2000,'Story quá dài').optional(),
    slug: z.string().regex(/^[a-z0-9-]+$/,'Slug chỉ chứa chữ thường, số và dấu gạch ngang').trim().toLowerCase().optional(),
    isActive: z.boolean().optional()
  }).refine((v)=> Object.keys(v).length>0, { message: 'Cần ít nhất một trường để cập nhật' })
});

export type CreateShopDTO = z.infer<typeof createShopSchema>['body'];
export type UpdateShopDTO = z.infer<typeof updateShopSchema>['body'];
