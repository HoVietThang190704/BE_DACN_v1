import { z } from 'zod';

/**
 * Validation schema for creating a category
 */
export const createCategorySchema = z.object({
  body: z.object({
    name: z.string()
      .min(1, 'Tên danh mục không được để trống')
      .max(100, 'Tên danh mục không được vượt quá 100 ký tự')
      .trim(),
    
    nameEn: z.string()
      .max(100, 'Tên tiếng Anh không được vượt quá 100 ký tự')
      .trim()
      .optional(),
    
    slug: z.string()
      .min(1, 'Slug không được để trống')
      .regex(/^[a-z0-9-]+$/, 'Slug chỉ được chứa chữ thường, số và dấu gạch ngang')
      .trim()
      .toLowerCase(),
    
    description: z.string()
      .max(500, 'Mô tả không được vượt quá 500 ký tự')
      .trim()
      .optional(),
    
    icon: z.string()
      .max(10, 'Icon không hợp lệ')
      .optional(),
    
    // allow images array; elements can be a valid URL or an empty string (Swagger may send empty values)
    images: z.array(z.union([z.string().url('URL hình ảnh không hợp lệ'), z.literal('')]))
      .max(5, 'Tối đa 5 ảnh')
      .optional(),
    
    // parentId may be a Mongo ObjectId (24 hex chars), null (root), or an empty string (treated as null from some clients)
    // parentId can be a valid ObjectId, an empty string, null, or a placeholder string 'id' sent by some clients
    parentId: z.union([
      z.string().regex(/^[0-9a-fA-F]{24}$/, 'Parent ID không hợp lệ'),
      z.literal(''),
      z.null(),
      z.literal('id')
    ])
      .optional()
      .nullable(),
    
    order: z.number()
      .int('Thứ tự phải là số nguyên')
      .min(0, 'Thứ tự phải là số không âm')
      .optional()
      .default(0),
    
    isActive: z.boolean()
      .optional()
      .default(true)
  })
});

/**
 * Validation schema for updating a category
 */
export const updateCategorySchema = z.object({
  params: z.object({
    id: z.string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Category ID không hợp lệ')
  }),
  
  body: z.object({
    name: z.string()
      .min(1, 'Tên danh mục không được để trống')
      .max(100, 'Tên danh mục không được vượt quá 100 ký tự')
      .trim()
      .optional(),
    
    nameEn: z.string()
      .max(100, 'Tên tiếng Anh không được vượt quá 100 ký tự')
      .trim()
      .optional(),
    
    slug: z.string()
      .min(1, 'Slug không được để trống')
      .regex(/^[a-z0-9-]+$/, 'Slug chỉ được chứa chữ thường, số và dấu gạch ngang')
      .trim()
      .toLowerCase()
      .optional(),
    
    description: z.string()
      .max(500, 'Mô tả không được vượt quá 500 ký tự')
      .trim()
      .optional(),
    
    icon: z.string()
      .max(10, 'Icon không hợp lệ')
      .optional(),
    
    images: z.array(z.union([z.string().url('URL hình ảnh không hợp lệ'), z.literal('')]))
      .max(5, 'Tối đa 5 ảnh')
      .optional(),
    
    parentId: z.union([
      z.string().regex(/^[0-9a-fA-F]{24}$/, 'Parent ID không hợp lệ'),
      z.literal(''),
      z.null(),
      z.literal('id')
    ])
      .optional()
      .nullable(),
    
    order: z.number()
      .int('Thứ tự phải là số nguyên')
      .min(0, 'Thứ tự phải là số không âm')
      .optional(),
    
    isActive: z.boolean()
      .optional()
  }).refine((data) => Object.keys(data).length > 0, {
    message: 'Cần ít nhất một trường để cập nhật'
  })
});

/**
 * Validation schema for deleting a category
 */
export const deleteCategorySchema = z.object({
  params: z.object({
    id: z.string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Category ID không hợp lệ')
  }),
  
  query: z.object({
    force: z.enum(['true', 'false'])
      .optional()
      .default('false')
  }).optional()
});

// Type exports
export type CreateCategoryDTO = z.infer<typeof createCategorySchema>['body'];
export type UpdateCategoryDTO = z.infer<typeof updateCategorySchema>['body'];
