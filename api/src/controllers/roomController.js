import { Room } from '../models/Room.js';
import { PlatformSettings } from '../models/PlatformSettings.js';
import { generateRoomCode, normalizeRoomCode, isValidRoomCode } from '../utils/codeGenerator.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

/**
 * @desc    Create a new meeting room
 * @route   POST /api/rooms
 * @access  Public / Optional Auth
 */
export const createRoom = async (req, res, next) => {
  try {
    const { title, description, customCode, settings, scheduledFor, hostName } = req.body;
    const platformSettings = await PlatformSettings.findById('platform');

    let roomCode = customCode ? normalizeRoomCode(customCode) : generateRoomCode();

    if (customCode && !isValidRoomCode(customCode)) {
      return sendError(
        res,
        'Invalid room code format. Use 3-4 hyphenated words (e.g. abc-defg-hij) or alphanumeric slug',
        400
      );
    }

    // Check if roomCode already exists
    const existingRoom = await Room.findOne({ roomCode });
    if (existingRoom && existingRoom.status === 'active') {
      // If code was auto-generated and collided, generate a new one
      if (!customCode) {
        roomCode = generateRoomCode();
      } else {
        return sendError(res, 'A meeting with this room code already exists and is active', 400);
      }
    }

    const hostUser = req.user ? req.user._id : null;
    const finalHostName = req.user ? req.user.name : hostName || 'Meeting Host';

    const room = await Room.create({
      roomCode,
      title: title || 'AURA Meeting',
      description: description || '',
      host: hostUser,
      hostName: finalHostName,
      status: scheduledFor ? 'scheduled' : 'active',
      settings: {
        ...(platformSettings?.defaultMeetingSettings || {}),
        ...(settings || {}),
      },
      maxParticipants: platformSettings?.defaultMaxParticipants || 50,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
      startedAt: scheduledFor ? null : new Date(),
    });

    return sendSuccess(
      res,
      'Meeting room created successfully',
      {
        room: {
          id: room._id,
          roomCode: room.roomCode,
          title: room.title,
          description: room.description,
          hostName: room.hostName,
          status: room.status,
          settings: room.settings,
          scheduledFor: room.scheduledFor,
          startedAt: room.startedAt,
          meetingUrl: `/meet/${room.roomCode}`,
        },
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get room info by room code
 * @route   GET /api/rooms/:roomCode
 * @access  Public
 */
export const getRoomByCode = async (req, res, next) => {
  try {
    const rawCode = req.params.roomCode;
    const roomCode = normalizeRoomCode(rawCode);

    const room = await Room.findOne({ roomCode });
    if (!room) {
      return sendError(res, `Meeting room '${roomCode}' not found`, 404);
    }

    return sendSuccess(res, 'Room details retrieved', { room });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all rooms created by current user
 * @route   GET /api/rooms
 * @access  Private
 */
export const listUserRooms = async (req, res, next) => {
  try {
    let query = {};
    if (req.user) {
      query = { $or: [{ host: req.user._id }, { hostName: req.user.name }] };
    } else if (req.query.hostName) {
      query = { hostName: req.query.hostName };
    }
    const rooms = await Room.find(query).sort({ scheduledFor: 1, createdAt: -1 }).limit(50);
    return sendSuccess(res, 'Meeting rooms retrieved', { count: rooms.length, rooms });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a meeting room
 * @route   DELETE /api/rooms/:roomCode
 * @access  Public / Optional Auth
 */
export const deleteRoom = async (req, res, next) => {
  try {
    const roomCode = normalizeRoomCode(req.params.roomCode);
    const room = await Room.findOneAndDelete({ roomCode });
    if (!room) {
      return sendError(res, `Meeting room '${roomCode}' not found`, 404);
    }
    return sendSuccess(res, 'Meeting deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update room details and settings
 * @route   PATCH /api/rooms/:roomCode
 * @access  Public / Host
 */
export const updateRoom = async (req, res, next) => {
  try {
    const roomCode = normalizeRoomCode(req.params.roomCode);
    const { title, description, settings, status } = req.body;

    const room = await Room.findOne({ roomCode });
    if (!room) {
      return sendError(res, `Room '${roomCode}' not found`, 404);
    }

    // If room has an authenticated host, verify ownership
    if (room.host && (!req.user || req.user._id.toString() !== room.host.toString())) {
      return sendError(res, 'Unauthorized to modify this room settings', 403);
    }

    if (title !== undefined) room.title = title;
    if (description !== undefined) room.description = description;
    if (status !== undefined) room.status = status;
    if (settings) {
      room.settings = { ...room.settings, ...settings };
    }

    await room.save();

    return sendSuccess(res, 'Room settings updated successfully', { room });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    End an active meeting room
 * @route   POST /api/rooms/:roomCode/end
 * @access  Public / Host
 */
export const endRoom = async (req, res, next) => {
  try {
    const roomCode = normalizeRoomCode(req.params.roomCode);

    const room = await Room.findOne({ roomCode });
    if (!room) {
      return sendError(res, `Room '${roomCode}' not found`, 404);
    }

    // Verify host ownership if applicable
    if (room.host && (!req.user || req.user._id.toString() !== room.host.toString())) {
      return sendError(res, 'Unauthorized: Only the host can end this meeting', 403);
    }

    room.status = 'ended';
    room.endedAt = new Date();
    await room.save();

    return sendSuccess(res, 'Meeting ended successfully', { room });
  } catch (error) {
    next(error);
  }
};
