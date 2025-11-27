import { Router } from 'express';
import { CommentController } from '../presentation/controllers/CommentController';
import { CommentRepository } from '../data/repositories/CommentRepository';
import {
  CreateCommentUseCase,
  UpdateCommentUseCase,
  DeleteCommentUseCase,
  GetCommentsByPostIdUseCase,
  GetCommentRepliesUseCase,
  ToggleLikeCommentUseCase
} from '../domain/usecases/comment';
import { authMiddleware, optionalAuthMiddleware } from '../shared/middleware/auth.middleware';

const router = Router();

// Initialize repository and use cases
const commentRepository = new CommentRepository();
const postRepository = new (require('../data/repositories/PostRepository').PostRepository)();

const createCommentUseCase = new CreateCommentUseCase(commentRepository, postRepository);
const updateCommentUseCase = new UpdateCommentUseCase(commentRepository);
const deleteCommentUseCase = new DeleteCommentUseCase(commentRepository, postRepository);
const getCommentsByPostIdUseCase = new GetCommentsByPostIdUseCase(commentRepository);
const getCommentRepliesUseCase = new GetCommentRepliesUseCase(commentRepository);
const toggleLikeCommentUseCase = new ToggleLikeCommentUseCase(commentRepository);

// Initialize controller
const commentController = new CommentController(
  createCommentUseCase,
  updateCommentUseCase,
  deleteCommentUseCase,
  getCommentsByPostIdUseCase,
  getCommentRepliesUseCase,
  toggleLikeCommentUseCase
);

// Routes
/**
 * @swagger
 * /api/comments:
 *   post:
 *     tags: [Comments]
 *     summary: Tạo bình luận mới
 *     description: Tạo bình luận trên bài viết (hỗ trợ 3 levels nested)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - postId
 *               - content
 *             properties:
 *               postId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439011"
 *               content:
 *                 type: string
 *                 example: "Bài viết hay quá!"
 *               parentCommentId:
 *                 type: string
 *                 description: ID của comment cha (nếu là reply)
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Tạo bình luận thành công
 */
router.post('/', authMiddleware, (req, res) => commentController.createComment(req, res));

/**
 * @swagger
 * /api/comments/{commentId}:
 *   put:
 *     tags: [Comments]
 *     summary: Cập nhật bình luận
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *   delete:
 *     tags: [Comments]
 *     summary: Xóa bình luận
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.put('/:commentId', authMiddleware, (req, res) => commentController.updateComment(req, res));
router.delete('/:commentId', authMiddleware, (req, res) => commentController.deleteComment(req, res));

/**
 * @swagger
 * /api/comments/post/{postId}:
 *   get:
 *     tags: [Comments]
 *     summary: Lấy bình luận của bài viết
 *     description: Lấy tất cả bình luận (3 levels nested)
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/post/:postId', optionalAuthMiddleware, (req, res) => commentController.getCommentsByPostId(req, res));

/**
 * @swagger
 * /api/comments/{commentId}/replies:
 *   get:
 *     tags: [Comments]
 *     summary: Lấy các reply của comment
 *     description: Lấy danh sách các reply (nested comments) của một comment
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của comment cha
 *     responses:
 *       200:
 *         description: Lấy replies thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get('/:commentId/replies', optionalAuthMiddleware, (req, res) => commentController.getCommentReplies(req, res));

/**
 * @swagger
 * /api/comments/{commentId}/like:
 *   post:
 *     tags: [Comments]
 *     summary: Like/Unlike comment
 *     description: Toggle trạng thái like của một comment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của comment
 *     responses:
 *       200:
 *         description: Toggle like thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     isLiked:
 *                       type: boolean
 *                     likesCount:
 *                       type: number
 */
router.post('/:commentId/like', authMiddleware, (req, res) => commentController.toggleLike(req, res));

/**
 * @swagger
 * /api/comments/upload/images:
 *   post:
 *     tags: [Comments]
 *     summary: Upload ảnh cho comment
 *     description: Upload nhiều ảnh kèm theo comment
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Upload thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     urls:
 *                       type: array
 *                       items:
 *                         type: string
 */
router.post('/upload/images', authMiddleware, (req, res) => commentController.uploadImages(req, res));

export default router;
