import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import mongoose from 'mongoose';

import app from './app.js';
import { config } from './config/index.js';
import { connectDB } from './config/db.js';
import { setupMeetingSocket } from './sockets/meetingSocket.js';
import { logger } from './utils/logger.js';

// Create HTTP server
const server = http.createServer(app);

// Setup Socket.IO with CORS
const io = new SocketIOServer(server, {
  cors: {
    origin: config.corsOrigin === '*' ? '*' : config.corsOrigin.split(','),
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
});

// Attach WebRTC and meeting signaling handlers
setupMeetingSocket(io);

// Connect to Database & Start Server
const startServer = async () => {
  // Connect to MongoDB
  await connectDB();

  // Start listening
  const serverInstance = server.listen(config.port, () => {
    logger.success(
      `🚀 Server is listening on http://localhost:${config.port} (${config.nodeEnv})`
    );
    logger.info(`📡 Socket.IO signaling ready on ws://localhost:${config.port}`);
    logger.info(`🔍 Health check: http://localhost:${config.port}/api/health`);
  });

  // Graceful shutdown handling
  const shutdown = async (signal) => {
    logger.warn(`Received ${signal}. Gracefully shutting down...`);

    io.close(() => {
      logger.info('Socket.IO connections closed.');
    });

    serverInstance.close(async () => {
      logger.info('HTTP server closed.');
      try {
        await mongoose.connection.close(false);
        logger.info('MongoDB connection closed.');
        process.exit(0);
      } catch (err) {
        logger.error(`Error during MongoDB disconnection: ${err.message}`);
        process.exit(1);
      }
    });

    // Force exit after 10s if graceful shutdown times out
    setTimeout(() => {
      logger.error('Forcefully terminating process due to shutdown timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

startServer().catch((err) => {
  logger.error(`Fatal startup error: ${err.message}`);
  process.exit(1);
});
