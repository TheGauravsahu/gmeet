import { Transcript } from '../models/Transcript.js';
import { Room } from '../models/Room.js';
import { normalizeRoomCode } from '../utils/codeGenerator.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

/**
 * @desc    Get transcripts for a room
 * @route   GET /api/rooms/:roomCode/transcripts
 * @access  Public
 */
export const getTranscripts = async (req, res, next) => {
  try {
    const roomCode = normalizeRoomCode(req.params.roomCode);
    const limit = parseInt(req.query.limit, 10) || 100;

    const room = await Room.findOne({ roomCode });
    if (!room) {
      return sendError(res, `Room '${roomCode}' not found`, 404);
    }

    const transcripts = await Transcript.find({ room: room._id })
      .sort({ timestamp: 1 })
      .limit(limit);

    return sendSuccess(res, 'Transcripts retrieved', {
      count: transcripts.length,
      transcripts,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add transcript line/chunk
 * @route   POST /api/rooms/:roomCode/transcripts
 * @access  Public
 */
export const addTranscript = async (req, res, next) => {
  try {
    const roomCode = normalizeRoomCode(req.params.roomCode);
    const { speaker, text, confidence } = req.body;

    if (!speaker || !text) {
      return sendError(res, 'Speaker and text are required', 400);
    }

    const room = await Room.findOne({ roomCode });
    if (!room) {
      return sendError(res, `Room '${roomCode}' not found`, 404);
    }

    const transcript = await Transcript.create({
      room: room._id,
      roomCode: room.roomCode,
      speaker: speaker.trim(),
      text: text.trim(),
      confidence: confidence !== undefined ? confidence : 0.98,
    });

    return sendSuccess(res, 'Transcript logged', { transcript }, 201);
  } catch (error) {
    next(error);
  }
};
