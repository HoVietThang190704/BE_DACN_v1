import { Router, Request, Response } from 'express';
import { optionalAuthMiddleware } from '../shared/middleware/auth.middleware';
import { asyncHandler } from '../shared/middleware/errorHandler';
import { aiAssistantController } from '../di/container';

const aiRoutes = Router();

aiRoutes.post(
  '/chat',
  optionalAuthMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    await aiAssistantController.chat(req, res);
  })
);

export default aiRoutes;
