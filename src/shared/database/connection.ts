import mongoose from 'mongoose';
import { config } from '../../config';
import { logger } from '../utils/logger';

export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private isConnected = false;

  private constructor() {}

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public async connect(): Promise<void> {
    try {
      if (this.isConnected) {
        logger.info('🔗 MongoDB connection already established');
        return;
      }

      // MongoDB connection options
      const options = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 10000, // Increase timeout
        socketTimeoutMS: 45000,
        family: 4, // Use IPv4, skip trying IPv6
        dbName: 'DAChuyenNganh' // Specify database name
      };

      logger.info('🔄 Attempting to connect to MongoDB...');
      logger.info(`📡 URI: ${config.MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`);
      
      await mongoose.connect(config.MONGODB_URI, options);

      this.isConnected = true;
      
      logger.info('🚀 Connected to MongoDB successfully');
      logger.info(`📊 Database: ${mongoose.connection.name}`);
      logger.info(`🌐 Host: ${mongoose.connection.host}:${mongoose.connection.port}`);

    } catch (error) {
      logger.error('❌ MongoDB connection error:', error);
      
      // Don't exit process in development, continue without DB
      if (config.NODE_ENV === 'development') {
        logger.warn('⚠️ Continuing without MongoDB in development mode');
        logger.warn('🔧 API will work with mock data');
        return;
      }
      
      process.exit(1);
    }
  }

  public async disconnect(): Promise<void> {
    try {
      if (!this.isConnected) {
        return;
      }

      await mongoose.disconnect();
      this.isConnected = false;
      
      logger.info('📴 Disconnected from MongoDB');
    } catch (error) {
      logger.error('❌ Error disconnecting from MongoDB:', error);
    }
  }

  public getConnection() {
    return mongoose.connection;
  }

  public isConnectionReady(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }
}

// Export singleton instance
export const database = DatabaseConnection.getInstance();

// Handle connection events
mongoose.connection.on('connected', () => {
  logger.info('🔗 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (error) => {
  logger.error('❌ Mongoose connection error:', error);
});

mongoose.connection.on('disconnected', () => {
  logger.info('📴 Mongoose disconnected from MongoDB');
});

// Handle process termination
process.on('SIGINT', async () => {
  await database.disconnect();
  process.exit(0);
});