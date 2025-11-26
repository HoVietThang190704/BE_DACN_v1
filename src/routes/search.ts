import { Router, Request, Response } from 'express';
import { asyncHandler } from '../shared/middleware/errorHandler';
import { searchController } from '../di/container';

export const searchRoutes = Router();

searchRoutes.get('/', asyncHandler((req: Request, res: Response) => searchController.search(req, res)));
searchRoutes.get('/suggest', asyncHandler((req: Request, res: Response) => searchController.suggest(req, res)));
searchRoutes.get('/inspect', asyncHandler((req: Request, res: Response) => searchController.inspect(req, res)));
