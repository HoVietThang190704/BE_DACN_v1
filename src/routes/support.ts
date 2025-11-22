import { Router, Request, Response } from 'express';
import { asyncHandler } from '../shared/middleware/errorHandler';
import { supportController } from '../di/container';
import { authenticate } from '../shared/middleware/auth';
import { optionalAuthMiddleware } from '../shared/middleware/auth.middleware';

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

export default supportRoutes;
