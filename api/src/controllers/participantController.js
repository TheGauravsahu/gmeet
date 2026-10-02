import { Participant } from '../models/Participant.js';
import { Room } from '../models/Room.js';
import { normalizeRoomCode } from '../utils/codeGenerator.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

/**
 * @desc    Get active participants in a room
 * @route   GET /api/rooms/:roomCode/participants
 * @access  Public
 */
export const getRoomParticipants = async (req, res, next) => {
  try {
    const roomCode = normalizeRoomCode(req.params.roomCode);

    const room = await Room.findOne({ roomCode });
    if (!room) {
      return sendError(res, `Room '${roomCode}' not found`, 404);
    }

    const participants = await Participant.find({
      room: room._id,
      isActive: true,
    }).sort({ joinedAt: 1 });

    return sendSuccess(res, 'Active participants retrieved', {
      count: participants.length,
      participants,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Record participant joining room (REST endpoint, also mirrored via Socket)
 * @route   POST /api/rooms/:roomCode/participants/join
 * @access  Public / Optional Auth
 */
export const joinParticipant = async (req, res, next) => {
  try {
    const roomCode = normalizeRoomCode(req.params.roomCode);
    const { displayName, avatar, socketId, peerId, isAudioMuted, isVideoMuted } = req.body;

    const room = await Room.findOne({ roomCode });
    if (!room) {
      return sendError(res, `Room '${roomCode}' not found`, 404);
    }

    if (room.status === 'ended') {
      return sendError(res, 'This meeting has already ended', 400);
    }

    if (room.settings.isLocked) {
      return sendError(res, 'This room is currently locked by the host', 403);
    }

    const name = req.user ? req.user.name : displayName || 'Guest User';
    const userAvatar = req.user
      ? req.user.avatar
      : avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;

    const isHost = room.host && req.user && room.host.toString() === req.user._id.toString();

    const participant = await Participant.create({
      room: room._id,
      roomCode: room.roomCode,
      user: req.user ? req.user._id : null,
      displayName: name,
      avatar: userAvatar,
      socketId: socketId || '',
      peerId: peerId || '',
      role: isHost ? 'host' : 'participant',
      isAudioMuted: room.settings.muteOnEntry ? true : !!isAudioMuted,
      isVideoMuted: !!isVideoMuted,
      isActive: true,
    });

    return sendSuccess(res, 'Joined room successfully', { participant }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update participant media/hand state
 * @route   PATCH /api/rooms/:roomCode/participants/:participantId
 * @access  Public
 */
export const updateParticipantState = async (req, res, next) => {
  try {
    const { participantId } = req.params;
    const { isAudioMuted, isVideoMuted, isScreenSharing, isHandRaised } = req.body;

    const participant = await Participant.findById(participantId);
    if (!participant) {
      return sendError(res, 'Participant session not found', 404);
    }

    if (isAudioMuted !== undefined) participant.isAudioMuted = isAudioMuted;
    if (isVideoMuted !== undefined) participant.isVideoMuted = isVideoMuted;
    if (isScreenSharing !== undefined) participant.isScreenSharing = isScreenSharing;
    if (isHandRaised !== undefined) participant.isHandRaised = isHandRaised;

    await participant.save();

    return sendSuccess(res, 'Participant state updated', { participant });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Record participant leaving room
 * @route   POST /api/rooms/:roomCode/participants/:participantId/leave
 * @access  Public
 */
export const leaveParticipant = async (req, res, next) => {
  try {
    const { participantId } = req.params;

    const participant = await Participant.findById(participantId);
    if (!participant) {
      return sendError(res, 'Participant not found', 404);
    }

    participant.isActive = false;
    participant.leftAt = new Date();
    await participant.save();

    return sendSuccess(res, 'Participant left room', { participant });
  } catch (error) {
    next(error);
  }
};
