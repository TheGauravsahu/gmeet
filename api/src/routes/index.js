import express from 'express';
import authRoutes from './authRoutes.js';
import roomRoutes from './roomRoutes.js';
import healthRoutes from './healthRoutes.js';

const router = express.Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/rooms', roomRoutes);

export default router;
