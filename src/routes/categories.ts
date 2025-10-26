import { Router, Request, Response } from 'express';
import { asyncHandler } from '../shared/middleware/errorHandler';
import { categoryController } from '../di/container';

export const categoryRoutes = Router();

/**
 * @swagger
 * /api/categories/admin/categories:
 *   post:
 *     summary: Thêm danh mục mới (admin)
 *     tags: [Categories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Danh mục đã được tạo thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 description:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 */
let nextCategoryId = 1;
categoryRoutes.post('/admin/categories', (req, res) => {
  const { name, description } = req.body;
  const id = nextCategoryId++;
  res.status(201).json({
    id,
    name,
    description,
    createdAt: new Date()
  });
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Category ID
 *           example: "507f1f77bcf86cd799439011"
 *         name:
 *           type: string
 *           description: Tên danh mục (tiếng Việt)
 *           example: "Rau củ quả"
 *         nameEn:
 *           type: string
 *           description: Tên danh mục (tiếng Anh)
 *           example: "Vegetables"
 *         slug:
 *           type: string
 *           description: URL-friendly slug
 *           example: "rau-cu-qua"
 *         description:
 *           type: string
 *           description: Mô tả danh mục
 *           example: "Các loại rau củ quả tươi sạch"
 *         icon:
 *           type: string
 *           description: Icon của danh mục
 *           example: "🥬"
 *         image:
 *           type: string
 *           description: Hình ảnh đại diện
 *           example: "https://example.com/category.jpg"
 *         parentId:
 *           type: string
 *           nullable: true
 *           description: ID danh mục cha (null nếu là root)
 *           example: null
 *         level:
 *           type: integer
 *           description: Cấp độ trong cây (0 = root)
 *           example: 0
 *         order:
 *           type: integer
 *           description: Thứ tự hiển thị
 *           example: 1
 *         isActive:
 *           type: boolean
 *           description: Trạng thái kích hoạt
 *           example: true
 *         productCount:
 *           type: integer
 *           description: Số lượng sản phẩm trong danh mục
 *           example: 25
 *         children:
 *           type: array
 *           description: Danh mục con (đa cấp)
 *           items:
 *             $ref: '#/components/schemas/Category'
 *         totalProducts:
 *           type: integer
 *           description: Tổng số sản phẩm bao gồm cả danh mục con
 *           example: 150
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Thời gian tạo
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Thời gian cập nhật
 *     
 *     CategoryBreadcrumb:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
 *         name:
 *           type: string
 *           example: "Rau củ quả"
 *         slug:
 *           type: string
 *           example: "rau-cu-qua"
 *         level:
 *           type: integer
 *           example: 0
 */

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Lấy danh sách danh mục theo cấu trúc cây (Đa cấp)
 *     description: |
 *       Trả về cấu trúc cây phân cấp của tất cả danh mục.
 *       - Hỗ trợ đa cấp (unlimited levels)
 *       - Mỗi danh mục có thể chứa danh mục con trong thuộc tính `children`
 *       - Tự động tính tổng số sản phẩm bao gồm cả danh mục con
 *     tags: [Categories]
 *     parameters:
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Có bao gồm danh mục không hoạt động hay không
 *     responses:
 *       200:
 *         description: Danh sách danh mục thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   description: Mảng các danh mục gốc với cấu trúc cây đầy đủ
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       description: Tổng số danh mục root
 *                       example: 5
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *             example:
 *               success: true
 *               data:
 *                 - id: "507f1f77bcf86cd799439011"
 *                   name: "Rau củ quả"
 *                   nameEn: "Vegetables"
 *                   slug: "rau-cu-qua"
 *                   description: "Các loại rau củ quả tươi sạch"
 *                   icon: "🥬"
 *                   image: null
 *                   parentId: null
 *                   level: 0
 *                   order: 1
 *                   isActive: true
 *                   productCount: 15
 *                   totalProducts: 150
 *                   children:
 *                     - id: "507f1f77bcf86cd799439012"
 *                       name: "Rau ăn lá"
 *                       nameEn: "Leafy Vegetables"
 *                       slug: "rau-an-la"
 *                       description: "Rau cải, xà lách, rau muống..."
 *                       icon: "🥬"
 *                       parentId: "507f1f77bcf86cd799439011"
 *                       level: 1
 *                       order: 1
 *                       isActive: true
 *                       productCount: 45
 *                       totalProducts: 45
 *                       children: []
 *                       createdAt: "2025-10-21T10:00:00.000Z"
 *                       updatedAt: "2025-10-21T10:00:00.000Z"
 *                     - id: "507f1f77bcf86cd799439013"
 *                       name: "Rau ăn củ"
 *                       nameEn: "Root Vegetables"
 *                       slug: "rau-an-cu"
 *                       description: "Cà rốt, củ cải, khoai tây..."
 *                       icon: "🥕"
 *                       parentId: "507f1f77bcf86cd799439011"
 *                       level: 1
 *                       order: 2
 *                       isActive: true
 *                       productCount: 35
 *                       totalProducts: 35
 *                       children: []
 *                       createdAt: "2025-10-21T10:00:00.000Z"
 *                       updatedAt: "2025-10-21T10:00:00.000Z"
 *                   createdAt: "2025-10-21T10:00:00.000Z"
 *                   updatedAt: "2025-10-21T10:00:00.000Z"
 *                 - id: "507f1f77bcf86cd799439014"
 *                   name: "Trái cây"
 *                   nameEn: "Fruits"
 *                   slug: "trai-cay"
 *                   description: "Các loại trái cây tươi"
 *                   icon: "🍎"
 *                   parentId: null
 *                   level: 0
 *                   order: 2
 *                   isActive: true
 *                   productCount: 20
 *                   totalProducts: 80
 *                   children:
 *                     - id: "507f1f77bcf86cd799439015"
 *                       name: "Trái cây nhiệt đới"
 *                       nameEn: "Tropical Fruits"
 *                       slug: "trai-cay-nhiet-doi"
 *                       description: "Xoài, dứa, chuối..."
 *                       icon: "🥭"
 *                       parentId: "507f1f77bcf86cd799439014"
 *                       level: 1
 *                       order: 1
 *                       isActive: true
 *                       productCount: 30
 *                       totalProducts: 30
 *                       children: []
 *                       createdAt: "2025-10-21T10:00:00.000Z"
 *                       updatedAt: "2025-10-21T10:00:00.000Z"
 *                   createdAt: "2025-10-21T10:00:00.000Z"
 *                   updatedAt: "2025-10-21T10:00:00.000Z"
 *               meta:
 *                 total: 2
 *                 timestamp: "2025-10-21T10:00:00.000Z"
 *       500:
 *         description: Lỗi server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
categoryRoutes.get('/', asyncHandler(async (req: Request, res: Response) => {
  await categoryController.getCategoriesTree(req, res);
}));

/**
 * @swagger
 * /api/categories/{id}:
 *   get:
 *     summary: Lấy thông tin chi tiết danh mục theo ID
 *     description: Trả về thông tin chi tiết của một danh mục cụ thể
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của danh mục
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Lấy thông tin danh mục thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *       404:
 *         description: Không tìm thấy danh mục
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Lỗi server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
categoryRoutes.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  await categoryController.getCategoryById(req, res);
}));

/**
 * @swagger
 * /api/categories/{id}/breadcrumb:
 *   get:
 *     summary: Lấy đường dẫn breadcrumb từ root đến danh mục
 *     description: |
 *       Trả về mảng các danh mục từ root (cấp 0) đến danh mục hiện tại,
 *       hữu ích cho việc hiển thị breadcrumb navigation
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của danh mục
 *         example: "507f1f77bcf86cd799439012"
 *     responses:
 *       200:
 *         description: Lấy breadcrumb thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CategoryBreadcrumb'
 *             example:
 *               success: true
 *               data:
 *                 - id: "507f1f77bcf86cd799439011"
 *                   name: "Rau củ quả"
 *                   slug: "rau-cu-qua"
 *                   level: 0
 *                 - id: "507f1f77bcf86cd799439012"
 *                   name: "Rau ăn lá"
 *                   slug: "rau-an-la"
 *                   level: 1
 *       404:
 *         description: Không tìm thấy danh mục
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Lỗi server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
categoryRoutes.get('/:id/breadcrumb', asyncHandler(async (req: Request, res: Response) => {
  await categoryController.getCategoryBreadcrumb(req, res);
}));
