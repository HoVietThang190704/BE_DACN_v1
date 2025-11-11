import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import os from 'os';
import fs from 'fs';
import { createServer as createHttpServer, Server as HttpServer } from 'http';
import { createServer as createHttpsServer, Server as HttpsServer, ServerOptions as HttpsServerOptions } from 'https';
import { config } from './config';
import { errorHandler } from './shared/middleware/errorHandler';
import { logger } from './shared/utils/logger';
import { database } from './shared/database/connection';
import { setupSwagger } from './shared/swagger/setup';
import { SocketService } from './services/socket/SocketService';
import { setIO } from './services/socket/socketManager';
import notificationRoutes from './routes/notifications';

// Import routes
import { authRoutes } from './routes/auth';
import { productRoutes } from './routes/products';
import { orderRoutes } from './routes/orders';
import { userRoutes } from './routes/users';
import { categoryRoutes } from './routes/categories';
import cartRoutes from './routes/cart';
import wishlistRoutes from './routes/wishlist';
import { agoraRoutes } from './routes/agora';
import { livestreamRoutes } from './routes/livestreams';
import postRoutes from './routes/posts';
import commentRoutes from './routes/comments';
import productReviewRoutes from './routes/productReviews';
import { uploadRoutes } from './routes/upload';
import { shopRoutes } from './routes/shops';
import ticketRoutes from './routes/tickets';
import { searchRoutes } from './routes/search';

const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Basic health check - always responds (for Render port detection)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'dacn-fresh-food-platform',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
    port: config.PORT
  });
});

// Database health check
app.get('/health/db', (req, res) => {
  const dbReady = database.isConnectionReady();
  res.status(dbReady ? 200 : 503).json({
    status: dbReady ? 'OK' : 'DB_NOT_READY',
    database: dbReady ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Serve static files (uploads)
app.use('/uploads', express.static('uploads'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/agora', agoraRoutes);
app.use('/api/livestreams', livestreamRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/product-reviews', productReviewRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/search', searchRoutes);

// Setup Swagger documentation TRƯỚC khi định nghĩa 404 handler
setupSwagger(app);

// API documentation
app.get('/api', (req, res) => {
  res.json({
    message: '🌱 Fresh Food Platform API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      categories: '/api/categories',
      orders: '/api/orders',
      wishlist: '/api/wishlist',
      users: '/api/users',
      health: '/health'
    },
    documentation: '/api/docs'
  });
});

// Error handling
app.use(errorHandler);

// 404 handler - đặt cuối cùng để catch tất cả routes không tìm thấy
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint không tìm thấy',
    message: `${req.method} ${req.originalUrl} không tồn tại`
  });
});

const PORT = config.PORT || 3000;

// Helper function to get local IP
function getLocalIp(): string {
  const interfaces = os.networkInterfaces();
  for (const iface of Object.values(interfaces)) {
    if (!iface) continue;
    for (const config of iface) {
      if (config.family === 'IPv4' && !config.internal) {
        return config.address;
      }
    }
  }
  return 'localhost';
}

// Start server - bind port FIRST, then connect DB in background
async function startServer() {
  const localIp = getLocalIp();
  let protocol: 'http' | 'https' = 'http';
  let server: HttpServer | HttpsServer;

  try {
    // Create HTTP/HTTPS server
    if (config.SSL_KEY_PATH && config.SSL_CERT_PATH) {
      try {
        const sslOptions: HttpsServerOptions = {
          key: fs.readFileSync(config.SSL_KEY_PATH),
          cert: fs.readFileSync(config.SSL_CERT_PATH)
        };

        if (config.SSL_CA_PATH) {
          sslOptions.ca = fs.readFileSync(config.SSL_CA_PATH);
        }

        server = createHttpsServer(sslOptions, app);
        protocol = 'https';
      } catch (error) {
        logger.error('⚠️  Không thể tải SSL certificate. Chuyển sang HTTP.', error);
        server = createHttpServer(app);
      }
    } else {
      server = createHttpServer(app);
    }

    // Initialize Socket.IO
    const socketService = new SocketService(server);
    setIO(socketService.getIO());

    // CRITICAL: Start listening IMMEDIATELY so Render detects the port
    server.listen(PORT, '0.0.0.0', () => {
      logger.info(`🚀 Fresh Food Platform API đang chạy tại ${protocol}://${localIp}:${PORT}`);
      logger.info(`📊 Health check: ${protocol}://${localIp}:${PORT}/health`);
      logger.info(`📖 API docs: ${protocol}://${localIp}:${PORT}/api`);
      logger.info(`📚 Swagger docs: ${protocol}://${localIp}:${PORT}/api/docs`);
      logger.info(`💬 Socket.IO ready for realtime chat`);
    });

    // Connect to MongoDB in background (non-blocking)
    database.connect().then(() => {
      logger.info('✅ MongoDB connected successfully');
    }).catch((error) => {
      logger.error('❌ MongoDB connection failed:', error);
      logger.warn('⚠️  Server is running but database features will not work');
    });

  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();