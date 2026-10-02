import { Participant } from '../models/Participant.js';
import { Message } from '../models/Message.js';
import { Transcript } from '../models/Transcript.js';
import { Room } from '../models/Room.js';
import { normalizeRoomCode } from '../utils/codeGenerator.js';
import { logger } from '../utils/logger.js';

export const setupMeetingSocket = (io) => {
  // Store socket mapping: socketId -> { roomCode, participantId, displayName }
  const socketRegistry = new Map();

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    /**
     * Join Room Event
     * Client sends: { roomCode, user: { displayName, avatar, peerId, isAudioMuted, isVideoMuted } }
     */
    socket.on('join-room', async ({ roomCode: rawCode, user = {} }) => {
      const roomCode = normalizeRoomCode(rawCode);
      if (!roomCode) {
        socket.emit('error-message', { message: 'Invalid room code' });
        return;
      }

      socket.join(roomCode);
      logger.info(`Socket ${socket.id} (${user.displayName || 'Guest'}) joined room: ${roomCode}`);

      // Try to find the room in DB
      let room = await Room.findOne({ roomCode });
      let participantId = null;

      if (room) {
        // Save or update participant session in MongoDB
        try {
          const participant = await Participant.create({
            room: room._id,
            roomCode,
            displayName: user.displayName || 'Guest',
            avatar: user.avatar || '',
            socketId: socket.id,
            peerId: user.peerId || '',
            isAudioMuted: !!user.isAudioMuted,
            isVideoMuted: !!user.isVideoMuted,
            isActive: true,
          });
          participantId = participant._id;
        } catch (err) {
          logger.error(`Error saving participant: ${err.message}`);
        }
      }

      // Track in memory
      socketRegistry.set(socket.id, {
        roomCode,
        participantId,
        displayName: user.displayName || 'Guest',
        avatar: user.avatar || '',
        peerId: user.peerId || '',
        isAudioMuted: !!user.isAudioMuted,
        isVideoMuted: !!user.isVideoMuted,
      });

      // Get list of existing peers in the room (excluding this new socket)
      const clientsInRoom = Array.from(io.sockets.adapter.rooms.get(roomCode) || [])
        .filter((id) => id !== socket.id)
        .map((id) => {
          const meta = socketRegistry.get(id);
          return {
            socketId: id,
            peerId: meta?.peerId,
            displayName: meta?.displayName || 'Peer',
            avatar: meta?.avatar,
            isAudioMuted: meta?.isAudioMuted,
            isVideoMuted: meta?.isVideoMuted,
          };
        });

      // Send existing peers list to the newcomer
      socket.emit('existing-participants', {
        participants: clientsInRoom,
      });

      // Broadcast to all other room members that newcomer joined
      socket.to(roomCode).emit('user-joined', {
        socketId: socket.id,
        peerId: user.peerId || '',
        displayName: user.displayName || 'Guest',
        avatar: user.avatar || '',
        isAudioMuted: !!user.isAudioMuted,
        isVideoMuted: !!user.isVideoMuted,
      });
    });

    /**
     * WebRTC Signaling: Offer
     */
    socket.on('webrtc-offer', ({ targetSocketId, offer }) => {
      io.to(targetSocketId).emit('webrtc-offer', {
        callerSocketId: socket.id,
        offer,
      });
    });

    /**
     * WebRTC Signaling: Answer
     */
    socket.on('webrtc-answer', ({ targetSocketId, answer }) => {
      io.to(targetSocketId).emit('webrtc-answer', {
        responderSocketId: socket.id,
        answer,
      });
    });

    /**
     * WebRTC Signaling: ICE Candidate
     */
    socket.on('ice-candidate', ({ targetSocketId, candidate }) => {
      io.to(targetSocketId).emit('ice-candidate', {
        senderSocketId: socket.id,
        candidate,
      });
    });

    /**
     * Participant Audio / Video / Screen toggle
     */
    socket.on('toggle-media-state', async ({ isAudioMuted, isVideoMuted, isScreenSharing }) => {
      const reg = socketRegistry.get(socket.id);
      if (!reg) return;

      if (isAudioMuted !== undefined) reg.isAudioMuted = isAudioMuted;
      if (isVideoMuted !== undefined) reg.isVideoMuted = isVideoMuted;
      if (isScreenSharing !== undefined) reg.isScreenSharing = isScreenSharing;

      // Broadcast to room
      socket.to(reg.roomCode).emit('user-media-state-changed', {
        socketId: socket.id,
        isAudioMuted: reg.isAudioMuted,
        isVideoMuted: reg.isVideoMuted,
        isScreenSharing: reg.isScreenSharing,
      });

      // Update in DB asynchronously
      if (reg.participantId) {
        try {
          await Participant.findByIdAndUpdate(reg.participantId, {
            ...(isAudioMuted !== undefined && { isAudioMuted }),
            ...(isVideoMuted !== undefined && { isVideoMuted }),
            ...(isScreenSharing !== undefined && { isScreenSharing }),
          });
        } catch (err) {
          logger.error(`Error updating participant state: ${err.message}`);
        }
      }
    });

    /**
     * Hand Raise
     */
    socket.on('raise-hand', ({ isHandRaised }) => {
      const reg = socketRegistry.get(socket.id);
      if (!reg) return;

      io.to(reg.roomCode).emit('user-raised-hand', {
        socketId: socket.id,
        displayName: reg.displayName,
        isHandRaised: !!isHandRaised,
      });
    });

    /**
     * In-Call Chat Message
     */
    socket.on('send-message', async ({ content }) => {
      const reg = socketRegistry.get(socket.id);
      if (!reg || !content || !content.trim()) return;

      const messagePayload = {
        socketId: socket.id,
        senderName: reg.displayName,
        senderAvatar: reg.avatar,
        content: content.trim(),
        timestamp: new Date().toISOString(),
      };

      // Broadcast immediately
      io.to(reg.roomCode).emit('new-message', messagePayload);

      // Persist to MongoDB
      try {
        const room = await Room.findOne({ roomCode: reg.roomCode });
        if (room) {
          await Message.create({
            room: room._id,
            roomCode: reg.roomCode,
            senderName: reg.displayName,
            senderAvatar: reg.avatar,
            content: content.trim(),
          });
        }
      } catch (err) {
        logger.error(`Error persisting message: ${err.message}`);
      }
    });

    /**
     * Live AI Transcript Stream
     */
    socket.on('live-transcript', async ({ speaker, text, confidence }) => {
      const reg = socketRegistry.get(socket.id);
      if (!reg || !text) return;

      const transcriptPayload = {
        speaker: speaker || reg.displayName,
        text,
        confidence: confidence || 0.98,
        timestamp: new Date().toISOString(),
      };

      // Broadcast to room members
      io.to(reg.roomCode).emit('transcript-update', transcriptPayload);

      // Persist to MongoDB
      try {
        const room = await Room.findOne({ roomCode: reg.roomCode });
        if (room) {
          await Transcript.create({
            room: room._id,
            roomCode: reg.roomCode,
            speaker: transcriptPayload.speaker,
            text: transcriptPayload.text,
            confidence: transcriptPayload.confidence,
          });
        }
      } catch (err) {
        logger.error(`Error persisting transcript: ${err.message}`);
      }
    });

    /**
     * Socket Disconnect / Leave
     */
    const handleLeave = async () => {
      const reg = socketRegistry.get(socket.id);
      if (!reg) return;

      const { roomCode, participantId, displayName } = reg;
      socketRegistry.delete(socket.id);

      logger.info(`Socket disconnected: ${socket.id} (${displayName}) from room ${roomCode}`);

      // Broadcast user left
      socket.to(roomCode).emit('user-left', {
        socketId: socket.id,
        displayName,
      });

      // Update participant in MongoDB
      if (participantId) {
        try {
          await Participant.findByIdAndUpdate(participantId, {
            isActive: false,
            leftAt: new Date(),
          });
        } catch (err) {
          logger.error(`Error updating participant on leave: ${err.message}`);
        }
      }
    };

    socket.on('leave-room', handleLeave);
    socket.on('disconnect', handleLeave);
  });
};
