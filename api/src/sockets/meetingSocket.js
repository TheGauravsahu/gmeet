import { Participant } from '../models/Participant.js';
import { Message } from '../models/Message.js';
import { Room } from '../models/Room.js';
import { normalizeRoomCode } from '../utils/codeGenerator.js';
import { logger } from '../utils/logger.js';
import { generateGeminiReply } from '../services/geminiService.js';

export const setupMeetingSocket = (io) => {
  // Store socket mapping: socketId -> { roomCode, participantId, displayName, isHost }
  const socketRegistry = new Map();

  // Active meeting hosts: roomCode -> hostSocketId
  const roomHosts = new Map();

  // Pending knocking guests waiting for host approval: roomCode -> Array<{ socketId, displayName, avatar, user }>
  const pendingKnocks = new Map();

  // Set of approved socket IDs per room: roomCode -> Set<socketId>
  const roomAdmittedSockets = new Map();

  // Sequential guest naming per room: roomCode -> count
  const roomGuestCounters = new Map();
  const socketAssignedGuestNames = new Map();

  /**
   * Automatically assigns sequential guest names ("Guest 1", "Guest 2"...)
   * to visitors without custom accounts or with default names
   */
  const resolveGuestDisplayName = (roomCode, socketId, user = {}, isHost = false) => {
    if (isHost) {
      return (user.displayName || '').trim() || 'Host';
    }

    const rawName = (user.displayName || '').trim();
    const lower = rawName.toLowerCase();
    const isGeneric =
      !rawName ||
      lower === 'guest' ||
      lower === 'guest participant' ||
      lower === 'you' ||
      /^guest\s*\d*$/i.test(lower);

    // If socket already has an assigned name for this room session, preserve it
    if (socketAssignedGuestNames.has(socketId)) {
      return socketAssignedGuestNames.get(socketId);
    }

    // If user provided a genuine custom name
    if (!isGeneric) {
      socketAssignedGuestNames.set(socketId, rawName);
      return rawName;
    }

    // Assign sequential "Guest 1", "Guest 2", etc.
    const currentCount = (roomGuestCounters.get(roomCode) || 0) + 1;
    roomGuestCounters.set(roomCode, currentCount);
    const assignedName = `Guest ${currentCount}`;
    socketAssignedGuestNames.set(socketId, assignedName);
    logger.info(`Assigned auto guest name '${assignedName}' to socket ${socketId} in room ${roomCode}`);
    return assignedName;
  };

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    /**
     * Helper to get active host socket for a room
     */
    const getActiveHostSocketId = (roomCode) => {
      const hostId = roomHosts.get(roomCode);
      if (!hostId) return null;
      const hostSocket = io.sockets.sockets.get(hostId);
      if (hostSocket && hostSocket.connected) {
        return hostId;
      }
      return null;
    };

    /**
     * Helper to check if a joining user is the authentic host of a room
     */
    const checkIsHost = async (roomCode, user = {}) => {
      if (user.isHost === true) return true;

      try {
        const room = await Room.findOne({ roomCode });
        if (room) {
          if (room.hostName && user.displayName) {
            if (room.hostName.trim().toLowerCase() === user.displayName.trim().toLowerCase()) {
              return true;
            }
          }
          if (room.host && user.userId && room.host.toString() === user.userId.toString()) {
            return true;
          }
          // Room exists in DB with specific host, and this user does not match
          return false;
        }
      } catch (err) {
        logger.error(`Error querying room host: ${err.message}`);
      }

      // If room not in DB, first socket in room becomes host
      const activeHost = getActiveHostSocketId(roomCode);
      if (!activeHost) return true;
      return activeHost === socket.id;
    };

    /**
     * 1. Request to Join / Knocking Event (from Lobby or pre-meeting)
     */
    socket.on('request-to-join', async ({ roomCode: rawCode, user = {} }) => {
      const roomCode = normalizeRoomCode(rawCode);
      if (!roomCode) {
        socket.emit('error-message', { message: 'Invalid room code' });
        return;
      }

      const isHost = await checkIsHost(roomCode, user);
      if (isHost) {
        roomHosts.set(roomCode, socket.id);
        if (!roomAdmittedSockets.has(roomCode)) {
          roomAdmittedSockets.set(roomCode, new Set());
        }
        roomAdmittedSockets.get(roomCode).add(socket.id);

        logger.info(`Socket ${socket.id} (${user.displayName || 'Host'}) verified as Host for room ${roomCode}`);
        socket.emit('join-approved', { isHost: true });
        return;
      }

      // Check if this specific socket is already admitted
      const assignedName = resolveGuestDisplayName(roomCode, socket.id, user, false);
      user.displayName = assignedName;

      const admittedSet = roomAdmittedSockets.get(roomCode);
      if (admittedSet && admittedSet.has(socket.id)) {
        socket.emit('join-approved', { isHost: false, assignedName });
        return;
      }

      // Guest must wait for host approval!
      const activeHostId = getActiveHostSocketId(roomCode);

      const guestInfo = {
        socketId: socket.id,
        displayName: assignedName,
        avatar: user.avatar || '',
        user,
      };

      const knocks = pendingKnocks.get(roomCode) || [];
      if (!knocks.some((k) => k.socketId === socket.id)) {
        knocks.push(guestInfo);
        pendingKnocks.set(roomCode, knocks);
      }

      logger.info(`Guest ${guestInfo.displayName} (${socket.id}) knocking for room ${roomCode}`);

      // Tell guest to wait
      socket.emit('waiting-for-host', {
        message: activeHostId
          ? 'Waiting for the meeting host to let you in...'
          : 'Waiting for the meeting host to start the call...',
      });

      // Notify host of knocking guest
      if (activeHostId) {
        io.to(activeHostId).emit('guest-knocking', guestInfo);
        io.to(activeHostId).emit('pending-knocks-updated', knocks);
      }
    });

    /**
     * Helper: Complete entering a room for any socket (host or approved guest)
     */
    const enterRoom = async (targetSocket, roomCode, user = {}, isHost = false) => {
      targetSocket.join(roomCode);

      const effectiveName = isHost
        ? ((user.displayName || '').trim() || 'Host')
        : resolveGuestDisplayName(roomCode, targetSocket.id, user, false);
      user.displayName = effectiveName;

      logger.info(`Socket ${targetSocket.id} (${effectiveName}, Host: ${isHost}) entered room: ${roomCode}`);

      targetSocket.emit('host-status', { isHost, assignedName: effectiveName });

      // If host, send current pending knocks list
      if (isHost) {
        targetSocket.emit('pending-knocks-updated', pendingKnocks.get(roomCode) || []);
      }

      // Try to find the room in DB & save participant
      let room = await Room.findOne({ roomCode });
      let participantId = null;

      if (room) {
        try {
          const participant = await Participant.create({
            room: room._id,
            roomCode,
            displayName: effectiveName,
            avatar: user.avatar || '',
            socketId: targetSocket.id,
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
      socketRegistry.set(targetSocket.id, {
        roomCode,
        participantId,
        displayName: effectiveName,
        avatar: user.avatar || '',
        peerId: user.peerId || '',
        isAudioMuted: !!user.isAudioMuted,
        isVideoMuted: !!user.isVideoMuted,
        isScreenSharing: !!user.isScreenSharing,
        isHost,
      });

      // Get list of existing peers in the room (excluding this targetSocket)
      const clientsInRoom = Array.from(io.sockets.adapter.rooms.get(roomCode) || [])
        .filter((id) => id !== targetSocket.id)
        .map((id) => {
          const meta = socketRegistry.get(id);
          return {
            socketId: id,
            peerId: meta?.peerId,
            displayName: meta?.displayName || 'Peer',
            avatar: meta?.avatar,
            isAudioMuted: meta?.isAudioMuted,
            isVideoMuted: meta?.isVideoMuted,
            isScreenSharing: !!meta?.isScreenSharing,
            isHost: !!meta?.isHost,
          };
        });

      logger.info(`Emitting existing-participants to ${targetSocket.id}: ${clientsInRoom.map((p) => p.displayName).join(', ')}`);

      // Send existing peers list to the newcomer
      targetSocket.emit('existing-participants', {
        participants: clientsInRoom,
      });

      // Broadcast to all other room members that newcomer joined
      targetSocket.to(roomCode).emit('user-joined', {
        socketId: targetSocket.id,
        peerId: user.peerId || '',
        displayName: effectiveName,
        avatar: user.avatar || '',
        isAudioMuted: !!user.isAudioMuted,
        isVideoMuted: !!user.isVideoMuted,
        isScreenSharing: !!user.isScreenSharing,
        isHost,
      });
    };

    /**
     * 2. Host Admits a Knocking Guest
     */
    socket.on('admit-guest', async ({ roomCode: rawCode, guestSocketId, displayName }) => {
      const roomCode = normalizeRoomCode(rawCode);
      if (!roomCode || !guestSocketId) return;

      const activeHostId = roomHosts.get(roomCode);
      if (activeHostId !== socket.id) {
        logger.warn(`Unauthorized admit attempt by ${socket.id} for room ${roomCode}`);
        return;
      }

      // Mark admitted for this specific room
      if (!roomAdmittedSockets.has(roomCode)) {
        roomAdmittedSockets.set(roomCode, new Set());
      }
      roomAdmittedSockets.get(roomCode).add(guestSocketId);

      // Remove from pending knocks
      let knocks = pendingKnocks.get(roomCode) || [];
      knocks = knocks.filter((k) => k.socketId !== guestSocketId);
      pendingKnocks.set(roomCode, knocks);

      const assignedName = socketAssignedGuestNames.get(guestSocketId) || displayName || 'Guest';

      logger.info(`Host ${socket.id} admitted guest ${guestSocketId} (${assignedName}) to room ${roomCode}`);

      // Notify guest that they are approved (they will emit join-room from MeetingRoomPage)
      io.to(guestSocketId).emit('join-approved', { isHost: false, assignedName });

      // Update host pending list
      socket.emit('pending-knocks-updated', knocks);
    });

    /**
     * 3. Host Admits All Pending Guests
     */
    socket.on('admit-all-guests', async ({ roomCode: rawCode }) => {
      const roomCode = normalizeRoomCode(rawCode);
      if (!roomCode) return;

      const activeHostId = roomHosts.get(roomCode);
      if (activeHostId !== socket.id) return;

      const knocks = pendingKnocks.get(roomCode) || [];
      if (!roomAdmittedSockets.has(roomCode)) {
        roomAdmittedSockets.set(roomCode, new Set());
      }
      const admittedSet = roomAdmittedSockets.get(roomCode);

      for (const k of knocks) {
        admittedSet.add(k.socketId);
        const assignedName = socketAssignedGuestNames.get(k.socketId) || k.displayName || 'Guest';
        io.to(k.socketId).emit('join-approved', { isHost: false, assignedName });
      }

      pendingKnocks.set(roomCode, []);
      socket.emit('pending-knocks-updated', []);
      logger.info(`Host ${socket.id} admitted all guests to room ${roomCode}`);
    });

    /**
     * 4. Host Denies a Knocking Guest
     */
    socket.on('deny-guest', ({ roomCode: rawCode, guestSocketId }) => {
      const roomCode = normalizeRoomCode(rawCode);
      if (!roomCode || !guestSocketId) return;

      const activeHostId = roomHosts.get(roomCode);
      if (activeHostId !== socket.id) return;

      let knocks = pendingKnocks.get(roomCode) || [];
      knocks = knocks.filter((k) => k.socketId !== guestSocketId);
      pendingKnocks.set(roomCode, knocks);

      logger.info(`Host ${socket.id} denied guest ${guestSocketId} for room ${roomCode}`);

      // Notify guest
      io.to(guestSocketId).emit('join-denied', {
        message: 'The meeting host has denied your request to join.',
      });

      socket.emit('pending-knocks-updated', knocks);
    });

    /**
     * 5. Join Room Event (Enforces host approval)
     */
    socket.on('join-room', async ({ roomCode: rawCode, user = {} }) => {
      const roomCode = normalizeRoomCode(rawCode);
      if (!roomCode) {
        socket.emit('error-message', { message: 'Invalid room code' });
        return;
      }

      const isHost = await checkIsHost(roomCode, user);
      if (isHost) {
        roomHosts.set(roomCode, socket.id);
        if (!roomAdmittedSockets.has(roomCode)) {
          roomAdmittedSockets.set(roomCode, new Set());
        }
        roomAdmittedSockets.get(roomCode).add(socket.id);
        await enterRoom(socket, roomCode, user, true);
        return;
      }

      // Guest: Verify if admitted by host
      const assignedName = resolveGuestDisplayName(roomCode, socket.id, user, false);
      user.displayName = assignedName;

      const admittedSet = roomAdmittedSockets.get(roomCode);
      const isApproved = admittedSet && admittedSet.has(socket.id);

      if (!isApproved) {
        logger.info(`Unapproved join attempt by ${socket.id} (${assignedName}) for room ${roomCode}`);

        const guestInfo = {
          socketId: socket.id,
          displayName: assignedName,
          avatar: user.avatar || '',
          user,
        };

        const knocks = pendingKnocks.get(roomCode) || [];
        if (!knocks.some((k) => k.socketId === socket.id)) {
          knocks.push(guestInfo);
          pendingKnocks.set(roomCode, knocks);
        }

        const activeHostId = getActiveHostSocketId(roomCode);

        socket.emit('waiting-for-host', {
          message: activeHostId
            ? 'Waiting for the meeting host to let you in...'
            : 'Waiting for the meeting host to start the call...',
        });

        if (activeHostId) {
          io.to(activeHostId).emit('guest-knocking', guestInfo);
          io.to(activeHostId).emit('pending-knocks-updated', knocks);
        }
        return;
      }

      // Admitted guest joins room
      await enterRoom(socket, roomCode, user, false);
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

      socket.to(reg.roomCode).emit('user-media-state-changed', {
        socketId: socket.id,
        isAudioMuted: reg.isAudioMuted,
        isVideoMuted: reg.isVideoMuted,
        isScreenSharing: reg.isScreenSharing,
      });

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
     * Host Media Control (Mute/Unmute & Turn On/Off Camera of Participants)
     */
    socket.on('host-control-media', ({ roomCode: rawCode, targetSocketId, mediaType, action }) => {
      const roomCode = normalizeRoomCode(rawCode);
      if (!roomCode || !targetSocketId || !mediaType || !action) return;

      const activeHostId = roomHosts.get(roomCode);
      if (activeHostId !== socket.id) {
        logger.warn(`Unauthorized host-control-media attempt by ${socket.id} in room ${roomCode}`);
        return;
      }

      const hostMeta = socketRegistry.get(socket.id);
      const hostName = hostMeta?.displayName || 'Host';

      logger.info(`Host ${socket.id} (${hostName}) requested ${action} ${mediaType} on ${targetSocketId}`);

      // Forward action command to target participant
      io.to(targetSocketId).emit('host-media-action', {
        mediaType,
        action,
        hostName,
      });
    });

    /**
     * Host Mutes All Participants in Room
     */
    socket.on('host-mute-all', ({ roomCode: rawCode }) => {
      const roomCode = normalizeRoomCode(rawCode);
      if (!roomCode) return;

      const activeHostId = roomHosts.get(roomCode);
      if (activeHostId !== socket.id) return;

      const hostMeta = socketRegistry.get(socket.id);
      const hostName = hostMeta?.displayName || 'Host';

      // Send mute command to everyone in the room except host
      socket.to(roomCode).emit('host-media-action', {
        mediaType: 'audio',
        action: 'mute',
        hostName,
      });

      logger.info(`Host ${socket.id} muted all participants in room ${roomCode}`);
    });

    /**
     * In-Call Chat Message + Aura AI (Gemini)
     */
    socket.on('send-message', async ({ content, apiKey, autoReply }) => {
      const reg = socketRegistry.get(socket.id);
      if (!reg || !content || !content.trim()) return;

      const trimmedContent = content.trim();
      const messagePayload = {
        socketId: socket.id,
        senderName: reg.displayName,
        senderAvatar: reg.avatar,
        content: trimmedContent,
        timestamp: new Date().toISOString(),
      };

      // Broadcast user message immediately
      io.to(reg.roomCode).emit('new-message', messagePayload);

      // Persist to MongoDB
      let room = null;
      try {
        room = await Room.findOne({ roomCode: reg.roomCode });
        if (room) {
          await Message.create({
            room: room._id,
            roomCode: reg.roomCode,
            senderName: reg.displayName,
            senderAvatar: reg.avatar,
            content: trimmedContent,
          });
        }
      } catch (err) {
        logger.error(`Error persisting message: ${err.message}`);
      }

      // Check if Aura AI should reply: only if specifically mentioned or if it's a question with autoReply enabled
      const lower = trimmedContent.toLowerCase();
      const mentionsAura = lower.includes('@aura') || lower.includes('aura') || lower.startsWith('/ai');
      const isQuestion = trimmedContent.endsWith('?') || lower.startsWith('how') || lower.startsWith('what') || lower.startsWith('why') || lower.startsWith('can you') || lower.startsWith('who');
      const shouldAiReply = mentionsAura || (autoReply && isQuestion && mentionsAura);

      if (shouldAiReply) {
        try {
          io.to(reg.roomCode).emit('aura-status', { isThinking: true });

          let recentMessages = [];
          if (room) {
            recentMessages = await Message.find({ room: room._id })
              .sort({ createdAt: -1 })
              .limit(8)
              .lean();
            recentMessages.reverse();
          }

          const aiReplyText = await generateGeminiReply({
            prompt: trimmedContent,
            history: recentMessages,
            apiKey,
            roomCode: reg.roomCode,
            senderName: reg.displayName,
          });

          const aiPayload = {
            socketId: 'aura-ai',
            senderName: 'Aura AI',
            senderAvatar: 'sparkles',
            isAi: true,
            content: aiReplyText,
            timestamp: new Date().toISOString(),
          };

          io.to(reg.roomCode).emit('new-message', aiPayload);
          io.to(reg.roomCode).emit('aura-status', { isThinking: false });

          if (room) {
            await Message.create({
              room: room._id,
              roomCode: reg.roomCode,
              senderName: 'Aura AI',
              senderAvatar: 'sparkles',
              content: aiReplyText,
              type: 'text',
            });
          }
        } catch (aiErr) {
          logger.error(`Aura AI Error: ${aiErr.message}`);
          io.to(reg.roomCode).emit('aura-status', { isThinking: false });
        }
      }
    });

    /**
     * Dedicated Direct Aura AI Query Event
     */
    socket.on('aura-ai-query', async ({ query, apiKey }) => {
      const reg = socketRegistry.get(socket.id);
      if (!reg || !query || !query.trim()) return;

      const trimmedQuery = query.trim();
      io.to(reg.roomCode).emit('aura-status', { isThinking: true });

      try {
        const room = await Room.findOne({ roomCode: reg.roomCode });
        let recentMessages = [];
        if (room) {
          recentMessages = await Message.find({ room: room._id })
            .sort({ createdAt: -1 })
            .limit(8)
            .lean();
          recentMessages.reverse();
        }

        const reply = await generateGeminiReply({
          prompt: trimmedQuery,
          history: recentMessages,
          apiKey,
          roomCode: reg.roomCode,
          senderName: reg.displayName,
        });

        const aiPayload = {
          socketId: 'aura-ai',
          senderName: 'Aura AI',
          senderAvatar: 'sparkles',
          isAi: true,
          content: reply,
          timestamp: new Date().toISOString(),
        };

        io.to(reg.roomCode).emit('new-message', aiPayload);
        io.to(reg.roomCode).emit('aura-status', { isThinking: false });

        if (room) {
          await Message.create({
            room: room._id,
            roomCode: reg.roomCode,
            senderName: 'Aura AI',
            senderAvatar: 'sparkles',
            content: reply,
            type: 'text',
          });
        }
      } catch (err) {
        logger.error(`Error in aura-ai-query: ${err.message}`);
        io.to(reg.roomCode).emit('aura-status', { isThinking: false });
      }
    });

    /**
     * Socket Disconnect / Leave
     */
    const handleLeave = async () => {
      // Check if was a pending knocker
      pendingKnocks.forEach((knocks, rCode) => {
        if (knocks.some((k) => k.socketId === socket.id)) {
          const updated = knocks.filter((k) => k.socketId !== socket.id);
          pendingKnocks.set(rCode, updated);
          const hostId = roomHosts.get(rCode);
          if (hostId) {
            io.to(hostId).emit('pending-knocks-updated', updated);
          }
        }
      });

      const reg = socketRegistry.get(socket.id);
      if (!reg) return;

      const { roomCode, participantId, displayName, isHost } = reg;
      socketRegistry.delete(socket.id);

      logger.info(`Socket disconnected: ${socket.id} (${displayName}) from room ${roomCode}`);

      // Broadcast user left
      socket.to(roomCode).emit('user-left', {
        socketId: socket.id,
        displayName,
      });

      socket.leave(roomCode);

      // If host left, designate next participant in room as new host
      if (isHost || roomHosts.get(roomCode) === socket.id) {
        const remainingSockets = Array.from(io.sockets.adapter.rooms.get(roomCode) || [])
          .filter((id) => id !== socket.id);

        if (remainingSockets.length > 0) {
          const nextHostId = remainingSockets[0];
          roomHosts.set(roomCode, nextHostId);
          const nextReg = socketRegistry.get(nextHostId);
          if (nextReg) nextReg.isHost = true;
          io.to(nextHostId).emit('host-status', { isHost: true });
          io.to(nextHostId).emit('pending-knocks-updated', pendingKnocks.get(roomCode) || []);
          logger.info(`Transferred Host role for room ${roomCode} to socket ${nextHostId}`);
        } else {
          roomHosts.delete(roomCode);
          pendingKnocks.delete(roomCode);
          roomAdmittedSockets.delete(roomCode);
          roomGuestCounters.delete(roomCode);
        }
      } else {
        const remainingSockets = Array.from(io.sockets.adapter.rooms.get(roomCode) || [])
          .filter((id) => id !== socket.id);
        if (remainingSockets.length === 0) {
          roomHosts.delete(roomCode);
          pendingKnocks.delete(roomCode);
          roomAdmittedSockets.delete(roomCode);
          roomGuestCounters.delete(roomCode);
        }
      }
      socketAssignedGuestNames.delete(socket.id);

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
