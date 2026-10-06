import express from 'express';
import { protect, requireAdmin } from '../middlewares/authMiddleware.js';
import {
  getAdminOverview,
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  listMeetings,
  getMeeting,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  getPlatformSettings,
  updatePlatformSettings,
} from '../controllers/adminController.js';

const router = express.Router();

router.use(protect, requireAdmin);
router.get('/overview', getAdminOverview);
router.get('/users', listUsers);
router.get('/users/:userId', getUser);
router.post('/users', createUser);
router.patch('/users/:userId', updateUser);
router.delete('/users/:userId', deleteUser);
router.get('/meetings', listMeetings);
router.get('/meetings/:roomCode', getMeeting);
router.post('/meetings', createMeeting);
router.patch('/meetings/:roomCode', updateMeeting);
router.delete('/meetings/:roomCode', deleteMeeting);
router.get('/settings', getPlatformSettings);
router.put('/settings', updatePlatformSettings);

export default router;
