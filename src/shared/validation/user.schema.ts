import { z } from "zod";

// Schema for updating user profile
export const updateProfileSchema = z.object({
  body: z.object({
    userName: z.string()
        .min(1, "Tên người dùng không được để trống")
        .max(50, "Tên người dùng không được vượt quá 50 ký tự")
        .optional(),
    phone: z.string()
        .regex(/^(\+84|84|0)[1-9][0-9]{8}$/, "Số điện thoại không hợp lệ")
        .optional(),
    date_of_birth: z.string()
        .datetime({ message: "Định dạng ngày sinh không hợp lệ" })
        .or(z.date())
        .optional(),
    avatar: z.string()
        .url("URL avatar không hợp lệ")
        .or(z.null())
        .optional(),
    address: z.object({
      province: z.string().optional(),
      district: z.string().optional(),
      commune: z.string().optional(),
      street: z.string().optional(),
      detail: z.string().optional(),
    }).optional()
        .or(z.null()),
  }).refine((data) => Object.keys(data).length > 0, { 
      message: "Cần ít nhất một trường để cập nhật" 
  })
});

export type UpdateProfileDTO = z.infer<typeof updateProfileSchema>;