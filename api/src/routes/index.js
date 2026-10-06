import express from 'express';
import authRoutes from './authRoutes.js';
import roomRoutes from './roomRoutes.js';
import healthRoutes from './healthRoutes.js';
import adminRoutes from './adminRoutes.js';

const router = express.Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/rooms', roomRoutes);
router.use('/admin', adminRoutes);

export default router;
