import { Room } from '../models/Room.js';
import { Message } from '../models/Message.js';
import { normalizeRoomCode } from '../utils/codeGenerator.js';
import { generateGeminiReply } from '../services/geminiService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

/**
 * @desc    Ask Aura AI a question in the room
 * @route   POST /api/rooms/:roomCode/ai-chat
 * @access  Public / Optional Auth
 */
export const askAuraAi = async (req, res, next) => {
  try {
    const roomCode = normalizeRoomCode(req.params.roomCode);
    const { prompt, apiKey, senderName } = req.body;

    if (!prompt || !prompt.trim()) {
      return sendError(res, 'Prompt cannot be empty', 400);
    }

    const room = await Room.findOne({ roomCode });
    let recentMessages = [];
    if (room) {
      recentMessages = await Message.find({ room: room._id })
        .sort({ createdAt: -1 })
        .limit(8)
        .lean();
      recentMessages.reverse();
    }

    const reply = await generateGeminiReply({
      prompt: prompt.trim(),
      history: recentMessages,
      apiKey: apiKey || null,
      roomCode,
      senderName: senderName || (req.user ? req.user.name : 'Participant'),
    });

    // Optionally save AI reply to database
    if (room) {
      await Message.create({
        room: room._id,
        roomCode,
        senderName: 'Aura AI',
        senderAvatar: 'sparkles',
        content: reply,
        type: 'text',
      });
    }

    return sendSuccess(res, 'Aura AI replied successfully', {
      reply,
      senderName: 'Aura AI',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};
