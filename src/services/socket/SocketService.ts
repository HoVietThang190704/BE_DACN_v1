import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { Server as HttpsServer } from 'https';
import { logger } from '../../shared/utils/logger';
import { LivestreamMessage } from '../../models/LivestreamMessage';
import { Livestream } from '../../models/Livestream';

export class SocketService {
  private io: SocketIOServer;
  private livestreamRooms: Map<string, Set<string>>;
  private broadcastInterval: NodeJS.Timeout | null = null;
  
  constructor(server: HttpServer | HttpsServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: true,
        credentials: true,
        methods: ['GET', 'POST']
      }
    });
    this.livestreamRooms = new Map();
    this.setupEventHandlers();
    // Start periodic broadcast to keep list subscribers in sync
    this.broadcastInterval = setInterval(() => this.broadcastListViewerCounts(), 5_000);
  }

  private async broadcastListViewerCounts(): Promise<void> {
    try {
      // Query live streams and build snapshot from DB + runtime viewers
      const liveStreams = await Livestream.find({ status: 'LIVE' }).select('_id viewerCount');
      const counts = liveStreams.map((doc: any) => ({ id: String((doc._id ?? '')), viewerCount: this.livestreamRooms.get(String(doc._id))?.size ?? (doc.viewerCount ?? 0) }));
      if (!counts || counts.length === 0) return;
      logger.info(`Broadcasting viewer counts to livestreams:list (${counts.length} items)`);
      this.io.to('livestreams:list').emit('livestreams:viewer-counts', counts);
    } catch (err) {
      logger.error('Error broadcasting livestreams:viewer-counts', err);
    }
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      logger.info(`🔌 Socket connected: ${socket.id}`);

      // Join livestream room
      socket.on('join-livestream', async ({ livestreamId, userId, userName }) => {
        await this.handleJoinLivestream(socket, livestreamId, userId, userName);
      });

      // Send chat message
      socket.on('send-message', async ({ livestreamId, userId, userName, message }) => {
        await this.handleSendMessage(livestreamId, userId, userName, message);
      });

      // Leave livestream room
      socket.on('leave-livestream', ({ livestreamId }) => {
        this.handleLeaveLivestream(socket, livestreamId);
      });

      socket.on('support-chat:join', ({ userId }) => {
        if (!userId) return;
        logger.info(`💬 Support chat join for user ${userId}`);
        socket.join(`support-chat:user:${userId}`);
      });

      socket.on('support-chat:leave', ({ userId }) => {
        if (!userId) return;
        logger.info(`💬 Support chat leave for user ${userId}`);
        socket.leave(`support-chat:user:${userId}`);
      });

      socket.on('support-chat:join-admin', ({ adminId }) => {
        logger.info(`💬 Support chat admin join ${adminId || 'unknown'}`);
        socket.join('support-chat:admins');
        if (adminId) {
          socket.join(`support-chat:admin:${adminId}`);
        }
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
      // Listen for list join/leave
      socket.on('livestreams:list-join', () => {
        logger.info(`🔔 Socket ${socket.id} joined livestreams:list`);
        socket.join('livestreams:list');
        // Send snapshot of viewer counts
        const counts = Array.from(this.livestreamRooms.entries()).map(([id, set]) => ({ id, viewerCount: set.size }));
        socket.emit('livestreams:viewer-counts', counts);
      });
      socket.on('livestreams:list-leave', () => {
        logger.info(`🔕 Socket ${socket.id} left livestreams:list`);
        socket.leave('livestreams:list');
      });
    });
  }

  private async handleJoinLivestream(
    socket: any,
    livestreamId: string,
    userId: string,
    userName: string
  ): Promise<void> {
    logger.info(`👤 User ${userName} (${userId}) joining livestream: ${livestreamId}`);
    socket.join(livestreamId);

    // Track viewers
    if (!this.livestreamRooms.has(livestreamId)) {
      this.livestreamRooms.set(livestreamId, new Set());
    }
    this.livestreamRooms.get(livestreamId)!.add(socket.id);

    const viewerCount = this.livestreamRooms.get(livestreamId)!.size;

    // Load chat history from database
    try {
      const messages = await LivestreamMessage.find({ livestreamId })
        .sort({ timestamp: -1 })
        .limit(100)
        .lean();

      // Send history to the joining user only
      socket.emit('chat-history', messages.map((msg: any) => ({
        id: msg._id.toString(),
        userId: msg.userId,
        userName: msg.userName,
        message: msg.message,
        timestamp: msg.timestamp.toISOString()
      })));

      logger.info(`📜 Loaded ${messages.length} messages for user ${userName}`);
    } catch (err) {
      logger.error('Error loading chat history:', err);
    }

    // Broadcast viewer count update
    this.io.to(livestreamId).emit('viewer-count', { viewerCount });
    // Also inform list subscribers in 'livestreams:list'
    this.io.to('livestreams:list').emit('livestream:viewer-count', { id: livestreamId, viewerCount });

    // Notify others user joined
    socket.to(livestreamId).emit('user-joined', {
      userName,
      message: `${userName} đã tham gia livestream`
    });
  }

  private async handleSendMessage(
    livestreamId: string,
    userId: string,
    userName: string,
    message: string
  ): Promise<void> {
    logger.info(`💬 Message from ${userName} in ${livestreamId}: ${message}`);

    try {
      // Save message to database
      const newMessage = await LivestreamMessage.create({
        livestreamId,
        userId,
        userName,
        message,
        timestamp: new Date()
      });

  const messageDoc: any = newMessage.toObject();
      const chatMessage = {
        id: messageDoc._id.toString(),
        userId: messageDoc.userId,
        userName: messageDoc.userName,
        message: messageDoc.message,
        timestamp: messageDoc.timestamp.toISOString()
      };

      // Broadcast to all in room including sender
      this.io.to(livestreamId).emit('new-message', chatMessage);
      logger.info(`💾 Message saved to database: ${messageDoc._id}`);
    } catch (err) {
      logger.error('Error saving message:', err);
    }
  }

  private handleLeaveLivestream(socket: any, livestreamId: string): void {
    logger.info(`👋 User leaving livestream: ${livestreamId}`);
    socket.leave(livestreamId);

    if (this.livestreamRooms.has(livestreamId)) {
      this.livestreamRooms.get(livestreamId)!.delete(socket.id);
      const viewerCount = this.livestreamRooms.get(livestreamId)!.size;

      // Clean up empty rooms
      if (viewerCount === 0) {
        this.livestreamRooms.delete(livestreamId);
      } else {
        this.io.to(livestreamId).emit('viewer-count', { viewerCount });
        this.io.to('livestreams:list').emit('livestream:viewer-count', { id: livestreamId, viewerCount });
      }
    }
  }

  private handleDisconnect(socket: any): void {
    logger.info(`🔌 Socket disconnected: ${socket.id}`);

    // Remove from all rooms and update viewer counts
    this.livestreamRooms.forEach((viewers, livestreamId) => {
      if (viewers.has(socket.id)) {
        viewers.delete(socket.id);
        const viewerCount = viewers.size;

        if (viewerCount === 0) {
          this.livestreamRooms.delete(livestreamId);
        } else {
          this.io.to(livestreamId).emit('viewer-count', { viewerCount });
          this.io.to('livestreams:list').emit('livestream:viewer-count', { id: livestreamId, viewerCount });
        }
      }
    });
  }

  public getIO(): SocketIOServer {
    return this.io;
  }
}
