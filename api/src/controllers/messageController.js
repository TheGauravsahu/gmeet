import { Message } from '../models/Message.js';
import { Room } from '../models/Room.js';
import { normalizeRoomCode } from '../utils/codeGenerator.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

/**
 * @desc    Get chat messages for a room
 * @route   GET /api/rooms/:roomCode/messages
 * @access  Public
 */
export const getRoomMessages = async (req, res, next) => {
  try {
    const roomCode = normalizeRoomCode(req.params.roomCode);
    const limit = parseInt(req.query.limit, 10) || 50;

    const room = await Room.findOne({ roomCode });
    if (!room) {
      return sendError(res, `Room '${roomCode}' not found`, 404);
    }

    const messages = await Message.find({ room: room._id })
      .sort({ createdAt: 1 })
      .limit(limit);

    return sendSuccess(res, 'Room messages retrieved', {
      count: messages.length,
      messages,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Post a chat message in a room
 * @route   POST /api/rooms/:roomCode/messages
 * @access  Public / Optional Auth
 */
export const sendRoomMessage = async (req, res, next) => {
  try {
    const roomCode = normalizeRoomCode(req.params.roomCode);
    const { content, senderName, senderAvatar, type } = req.body;

    if (!content || !content.trim()) {
      return sendError(res, 'Message content cannot be empty', 400);
    }

    const room = await Room.findOne({ roomCode });
    if (!room) {
      return sendError(res, `Room '${roomCode}' not found`, 404);
    }

    if (room.settings && room.settings.allowChat === false) {
      return sendError(res, 'Chat is disabled in this meeting', 403);
    }

    const name = req.user ? req.user.name : senderName || 'Guest';
    const avatar = req.user ? req.user.avatar : senderAvatar || '';

    const message = await Message.create({
      room: room._id,
      roomCode: room.roomCode,
      sender: req.user ? req.user._id : null,
      senderName: name,
      senderAvatar: avatar,
      content: content.trim(),
      type: type || 'text',
    });

    return sendSuccess(res, 'Message sent successfully', { message }, 201);
  } catch (error) {
    next(error);
  }
};
