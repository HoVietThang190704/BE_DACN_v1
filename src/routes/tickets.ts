import { Router, Request, Response } from 'express';
import { asyncHandler } from '../shared/middleware/errorHandler';
import { validate } from '../shared/middleware/validate';
import { createTicketSchema, addCommentSchema, assignTicketSchema, updateStatusSchema } from '../shared/validation/ticket.schema';
import { authorizeRoles } from '../shared/middleware/authorize';
import { repositories, ticketController } from '../di/container';
import { authenticate } from '../shared/middleware/auth';

export const ticketRoutes = Router();

/**
 * @openapi
 * /api/tickets:
 *   post:
 *     tags:
 *       - Tickets
 *     summary: Create a ticket
 *     description: Create a support ticket. The request body must include at least a title.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Sản phẩm giao thiếu"
 *               description:
 *                 type: string
 *                 example: "Thiếu 2 gói rau trong đơn hàng ORD123"
 *               type:
 *                 type: string
 *                 enum: [support, bug, feature, question, refund, other]
 *                 example: support
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *                 example: high
 *               relatedOrderId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439011"
 *               relatedShopId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439099"
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                     filename:
 *                       type: string
 *               isPublic:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Ticket created
 *       400:
 *         description: Validation error
 */
ticketRoutes.post('/', authenticate, validate(createTicketSchema), asyncHandler(async (req: Request, res: Response) => {
  await ticketController.create(req, res);
}));

/**
 * @openapi
 * /api/tickets:
 *   get:
 *     tags:
 *       - Tickets
 *     summary: List tickets (user or admin)
 *     security:
 *       - bearerAuth: []
 */
ticketRoutes.get('/', authenticate, asyncHandler(async (req: Request, res: Response) => {
  await ticketController.list(req, res);
}));

/**
 * @openapi
 * /api/tickets/{id}:
 *   get:
 *     tags:
 *       - Tickets
 *     summary: Get ticket by id
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Ticket id (ObjectId)
 *     responses:
 *       200:
 *         description: Ticket found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Ticket'
 *       404:
 *         $ref: '#/components/schemas/Error'
 */
ticketRoutes.get('/:id', authenticate, asyncHandler(async (req: Request, res: Response) => {
  await ticketController.getById(req, res);
}));

/**
 * @openapi
 * /api/tickets/{id}/comments:
 *   post:
 *     tags:
 *       - Tickets
 *     summary: Add a comment to a ticket
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Ticket id (ObjectId)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                     filename:
 *                       type: string
 *               isInternal:
 *                 type: boolean
 *           example:
 *             message: "Đã kiểm tra đơn hàng, đang liên hệ kho"
 *             attachments: []
 *             isInternal: false
 *     responses:
 *       201:
 *         description: Comment created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Comment added"
 *                 data:
 *                   $ref: '#/components/schemas/TicketComment'
 *       400:
 *         $ref: '#/components/schemas/Error'
 */
ticketRoutes.post('/:id/comments', authenticate, validate(addCommentSchema), asyncHandler(async (req: Request, res: Response) => {
  await ticketController.addComment(req, res);
}));

/**
 * @openapi
 * /api/tickets/{id}/assign:
 *   patch:
 *     tags:
 *       - Tickets
 *     summary: Assign a ticket to an agent (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Ticket id (ObjectId)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               assignedTo:
 *                 type: string
 *           example:
 *             assignedTo: "507f1f77bcf86cd799439012"
 *     responses:
 *       200:
 *         description: Ticket assigned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Ticket assigned"
 *                 data:
 *                   $ref: '#/components/schemas/Ticket'
 *       400:
 *         $ref: '#/components/schemas/Error'
 *       403:
 *         $ref: '#/components/schemas/Error'
 */
ticketRoutes.patch('/:id/assign', authenticate, authorizeRoles('admin'), validate(assignTicketSchema), asyncHandler(async (req: Request, res: Response) => {
  await ticketController.assign(req, res);
}));

/**
 * @openapi
 * /api/tickets/{id}/status:
 *   patch:
 *     tags:
 *       - Tickets
 *     summary: Update ticket status (assigned agent or admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Ticket id (ObjectId)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: ['open','in_progress','on_hold','resolved','closed','rejected']
 *               resolutionMessage:
 *                 type: string
 *           example:
 *             status: "resolved"
 *             resolutionMessage: "Đã xử lý xong"
 *     responses:
 *       200:
 *         description: Ticket status updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Ticket status updated"
 *                 data:
 *                   $ref: '#/components/schemas/Ticket'
 *       400:
 *         $ref: '#/components/schemas/Error'
 *       403:
 *         $ref: '#/components/schemas/Error'
 */
ticketRoutes.patch('/:id/status', authenticate, validate(updateStatusSchema), asyncHandler(async (req: Request, res: Response) => {
  await ticketController.updateStatus(req, res);
}));

export default ticketRoutes;
