import { Router } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
export const router = Router();

router.use('/catalog', createProxyMiddleware({
  target: process.env.CATALOG_URL!, changeOrigin: true, pathRewrite: { '^/api/catalog': '' }
}));
router.use('/order', createProxyMiddleware({
  target: process.env.ORDER_URL!, changeOrigin: true, pathRewrite: { '^/api/order': '' }
}));
