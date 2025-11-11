import { Router, Request, Response } from 'express';
import { asyncHandler } from '../shared/middleware/errorHandler';
import { searchController } from '../di/container';

export const searchRoutes = Router();

searchRoutes.get('/', asyncHandler((req: Request, res: Response) => searchController.search(req, res)));
