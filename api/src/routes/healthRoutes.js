import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

router.get('/', (req, res) => {
  const dbStatusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const dbState = mongoose.connection.readyState;
  const isDbHealthy = dbState === 1;

  res.status(isDbHealthy ? 200 : 503).json({
    status: isDbHealthy ? 'ok' : 'degraded',
    service: 'gmeet-api',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    database: {
      status: dbStatusMap[dbState] || 'unknown',
      connected: isDbHealthy,
      name: mongoose.connection.name || null,
    },
    system: {
      nodeVersion: process.version,
      memoryUsage: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
    },
  });
});

export default router;
