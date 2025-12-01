import { Router, Request, Response } from 'express';
import { asyncHandler } from '../shared/middleware/errorHandler';
import { supportController, supportChatController } from '../di/container';
import { authenticate } from '../shared/middleware/auth';
import { optionalAuthMiddleware } from '../shared/middleware/auth.middleware';
import { authorizeRoles } from '../shared/middleware/authorize';
import { validate } from '../shared/middleware/validate';
import { sendChatMessageSchema } from '../shared/validation/supportChat.schema';

const supportRoutes = Router();

supportRoutes.get(
  '/faqs',
  optionalAuthMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    await supportController.getFaqs(req, res);
  })
);

supportRoutes.get(
  '/faqs/search',
  optionalAuthMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    await supportController.searchFaqs(req, res);
  })
);

supportRoutes.post(
  '/faqs/:id/vote',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    await supportController.voteFaq(req, res);
  })
);

supportRoutes.get(
  '/chat/thread',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    await supportChatController.getMyThread(req, res);
  })
);

supportRoutes.post(
  '/chat/messages',
  authenticate,
  validate(sendChatMessageSchema),
  asyncHandler(async (req: Request, res: Response) => {
    await supportChatController.sendMyMessage(req, res);
  })
);

supportRoutes.patch(
  '/chat/thread/read',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    await supportChatController.markMyThreadRead(req, res);
  })
);

supportRoutes.get(
  '/chat/threads',
  authenticate,
  authorizeRoles('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    await supportChatController.listThreads(req, res);
  })
);

supportRoutes.get(
  '/chat/threads/:userId',
  authenticate,
  authorizeRoles('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    await supportChatController.getThreadByUser(req, res);
  })
);

supportRoutes.post(
  '/chat/threads/:userId/messages',
  authenticate,
  authorizeRoles('admin'),
  validate(sendChatMessageSchema),
  asyncHandler(async (req: Request, res: Response) => {
    await supportChatController.sendAdminMessage(req, res);
  })
);

supportRoutes.patch(
  '/chat/threads/:userId/read',
  authenticate,
  authorizeRoles('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    await supportChatController.markThreadReadByAdmin(req, res);
  })
);

export default supportRoutes;
