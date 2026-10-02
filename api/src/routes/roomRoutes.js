import express from 'express';
import {
  createRoom,
  getRoomByCode,
  listUserRooms,
  updateRoom,
  endRoom,
  deleteRoom,
} from '../controllers/roomController.js';
import {
  getRoomParticipants,
  joinParticipant,
  updateParticipantState,
  leaveParticipant,
} from '../controllers/participantController.js';
import {
  getRoomMessages,
  sendRoomMessage,
} from '../controllers/messageController.js';
import {
  getTranscripts,
  addTranscript,
} from '../controllers/transcriptController.js';
import { askAuraAi } from '../controllers/aiController.js';
import { protect, optionalAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

// --- Room Endpoints ---
router.post('/', optionalAuth, createRoom);
router.get('/', optionalAuth, listUserRooms);
router.get('/:roomCode', getRoomByCode);
router.patch('/:roomCode', optionalAuth, updateRoom);
router.post('/:roomCode/end', optionalAuth, endRoom);
router.delete('/:roomCode', optionalAuth, deleteRoom);

// --- Participant Endpoints ---
router.get('/:roomCode/participants', getRoomParticipants);
router.post('/:roomCode/participants/join', optionalAuth, joinParticipant);
router.patch('/:roomCode/participants/:participantId', updateParticipantState);
router.post('/:roomCode/participants/:participantId/leave', leaveParticipant);

// --- Messages / Chat Endpoints ---
router.get('/:roomCode/messages', getRoomMessages);
router.post('/:roomCode/messages', optionalAuth, sendRoomMessage);

// --- Aura AI Endpoint ---
router.post('/:roomCode/ai-chat', optionalAuth, askAuraAi);

// --- Live Transcript Endpoints ---
router.get('/:roomCode/transcripts', getTranscripts);
router.post('/:roomCode/transcripts', addTranscript);

export default router;
