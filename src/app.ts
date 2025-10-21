import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './config';
import { errorHandler } from './shared/middleware/errorHandler';
import { logger } from './shared/utils/logger';
import { database } from './shared/database/connection';
import { setupSwagger } from './shared/swagger/setup';
import os from 'os';
// Import routes
import { authRoutes } from './routes/auth';
import { productRoutes } from './routes/products';
import { orderRoutes } from './routes/orders';
import { userRoutes } from './routes/users';
import { categoryRoutes } from './routes/categories';

const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'dacn-fresh-food-platform',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);

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
const IP = config.NODE_IP || 'localhost';
// Start server with database connection
async function startServer() {
  try {
    // Connect to MongoDB
    await database.connect();
    
    // TODO: Seed database with sample data
    // await seedDatabase();
    
    function getLocalIp() {
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
const localIp = getLocalIp();
// Start Express server
app.listen(PORT,"0.0.0.0", () => {
  logger.info(`🚀 Fresh Food Platform API đang chạy tại http://${localIp}:${PORT}`);
  logger.info(`📊 Health check: http://${localIp}:${PORT}/health`);
  logger.info(`📖 API docs: http://${localIp}:${PORT}/api`);
  logger.info(`📚 Swagger docs: http://${localIp}:${PORT}/api/docs`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();