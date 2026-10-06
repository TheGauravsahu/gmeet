import { User } from '../models/User.js';
import { Room } from '../models/Room.js';
import { Participant } from '../models/Participant.js';
import { Message } from '../models/Message.js';
import { Transcript } from '../models/Transcript.js';
import { PlatformSettings } from '../models/PlatformSettings.js';
import { generateRoomCode } from '../utils/codeGenerator.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

const parsePagination = (query) => {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 50));
  return { page, limit, skip: (page - 1) * limit };
};

export const getAdminOverview = async (req, res, next) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    const [users, meetings, activeMeetings, participants, recentMeetings, meetingActivity] =
      await Promise.all([
        User.countDocuments(),
        Room.countDocuments(),
        Room.countDocuments({ status: 'active' }),
        Participant.countDocuments({ isActive: true }),
        Room.find().sort({ createdAt: -1 }).limit(6).populate('host', 'name email'),
        Room.aggregate([
          { $match: { createdAt: { $gte: sixMonthsAgo } } },
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
              },
              count: { $sum: 1 },
            },
          },
        ]),
      ]);
    const countsByMonth = new Map(
      meetingActivity.map((item) => [`${item._id.year}-${item._id.month}`, item.count])
    );
    const activity = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(sixMonthsAgo);
      date.setMonth(sixMonthsAgo.getMonth() + index);
      return {
        label: date.toLocaleDateString('en-US', { month: 'short' }),
        count: countsByMonth.get(`${date.getFullYear()}-${date.getMonth() + 1}`) || 0,
      };
    });
    return sendSuccess(res, 'Admin overview retrieved', {
      stats: { users, meetings, activeMeetings, participants },
      recentMeetings,
      activity,
    });
  } catch (error) {
    next(error);
  }
};

export const listUsers = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const search = String(req.query.search || '').trim();
    const filter = search
      ? {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
          ],
        }
      : {};
    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);
    return sendSuccess(res, 'Users retrieved', {
      users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return sendError(res, 'User not found.', 404);
    return sendSuccess(res, 'User retrieved', { user });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role = 'user' } = req.body;
    if (
      typeof name !== 'string' ||
      !name.trim() ||
      typeof email !== 'string' ||
      !email.trim() ||
      typeof password !== 'string' ||
      !password
    ) {
      return sendError(res, 'Name, email, and password are required.', 400);
    }
    if (!['user', 'admin'].includes(role)) {
      return sendError(res, 'Role must be user or admin.', 400);
    }
    if (password.length < 6) {
      return sendError(res, 'Password must be at least 6 characters long.', 400);
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (await User.exists({ email: normalizedEmail })) {
      return sendError(res, 'A user with this email already exists.', 409);
    }
    const user = await User.create({ name: name.trim(), email: normalizedEmail, password, role });
    return sendSuccess(res, 'User created', { user }, 201);
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return sendError(res, 'User not found.', 404);

    const { name, email, password, role } = req.body;
    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return sendError(res, 'Name must be a non-empty string.', 400);
      }
      user.name = name.trim();
    }
    if (email !== undefined) {
      if (typeof email !== 'string' || !email.trim()) {
        return sendError(res, 'Email must be a non-empty string.', 400);
      }
      const normalizedEmail = email.trim().toLowerCase();
      if (await User.exists({ email: normalizedEmail, _id: { $ne: user._id } })) {
        return sendError(res, 'A user with this email already exists.', 409);
      }
      user.email = normalizedEmail;
    }
    if (role !== undefined) {
      if (!['user', 'admin'].includes(role)) {
        return sendError(res, 'Role must be user or admin.', 400);
      }
      if (user.id === req.user.id && role !== 'admin') {
        return sendError(res, 'You cannot remove your own administrator access.', 400);
      }
      if (user.role === 'admin' && role !== 'admin') {
        const admins = await User.countDocuments({ role: 'admin' });
        if (admins <= 1) return sendError(res, 'The last administrator cannot be demoted.', 400);
      }
      user.role = role;
    }
    if (password !== undefined) {
      if (typeof password !== 'string' || password.length < 6) {
        return sendError(res, 'Password must be at least 6 characters long.', 400);
      }
      user.password = password;
    }
    await user.save();
    return sendSuccess(res, 'User updated', { user });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return sendError(res, 'User not found.', 404);
    if (user.id === req.user.id) return sendError(res, 'You cannot delete your own account.', 400);
    if (user.role === 'admin' && (await User.countDocuments({ role: 'admin' })) <= 1) {
      return sendError(res, 'The last administrator cannot be deleted.', 400);
    }
    await user.deleteOne();
    return sendSuccess(res, 'User deleted');
  } catch (error) {
    next(error);
  }
};

export const listMeetings = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const [meetings, total] = await Promise.all([
      Room.find()
        .populate('host', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Room.countDocuments(),
    ]);
    return sendSuccess(res, 'Meetings retrieved', {
      meetings,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

export const getMeeting = async (req, res, next) => {
  try {
    const meeting = await Room.findOne({ roomCode: req.params.roomCode.toLowerCase() })
      .populate('host', 'name email');
    if (!meeting) return sendError(res, 'Meeting not found.', 404);
    return sendSuccess(res, 'Meeting retrieved', { meeting });
  } catch (error) {
    next(error);
  }
};

export const createMeeting = async (req, res, next) => {
  try {
    const { title, description = '', hostName, scheduledFor, maxParticipants } = req.body;
    if (!title?.trim()) return sendError(res, 'Meeting title is required.', 400);
    const participantLimit =
      maxParticipants === undefined
        ? undefined
        : Number(maxParticipants);
    if (
      participantLimit !== undefined &&
      (!Number.isInteger(participantLimit) || participantLimit < 2 || participantLimit > 500)
    ) {
      return sendError(res, 'Participant limit must be between 2 and 500.', 400);
    }
    const platformSettings = await PlatformSettings.findById('platform');
    let roomCode = generateRoomCode();
    while (await Room.exists({ roomCode })) roomCode = generateRoomCode();

    const room = await Room.create({
      roomCode,
      title: title.trim(),
      description,
      host: req.body.host || req.user._id,
      hostName: hostName?.trim() || req.user.name,
      status: scheduledFor ? 'scheduled' : 'active',
      scheduledFor: scheduledFor || null,
      startedAt: scheduledFor ? null : new Date(),
      settings: {
        ...(platformSettings?.defaultMeetingSettings || {}),
        ...(req.body.settings || {}),
      },
      maxParticipants: participantLimit || platformSettings?.defaultMaxParticipants || 50,
    });
    return sendSuccess(res, 'Meeting created', { meeting: room }, 201);
  } catch (error) {
    next(error);
  }
};

export const updateMeeting = async (req, res, next) => {
  try {
    const room = await Room.findOne({ roomCode: req.params.roomCode.toLowerCase() });
    if (!room) return sendError(res, 'Meeting not found.', 404);
    const { title, description, hostName, status, scheduledFor, maxParticipants, settings } = req.body;
    if (title !== undefined) {
      if (!title.trim()) return sendError(res, 'Meeting title cannot be empty.', 400);
      room.title = title.trim();
    }
    if (description !== undefined) room.description = description;
    if (hostName !== undefined) room.hostName = hostName.trim();
    const wasActive = room.status === 'active';
    if (maxParticipants !== undefined) {
      const participantLimit = Number(maxParticipants);
      if (!Number.isInteger(participantLimit) || participantLimit < 2 || participantLimit > 500) {
        return sendError(res, 'Participant limit must be between 2 and 500.', 400);
      }
      room.maxParticipants = participantLimit;
    }
    if (status !== undefined) {
      if (!['active', 'ended', 'scheduled'].includes(status)) {
        return sendError(res, 'Invalid meeting status.', 400);
      }
      room.status = status;
      room.endedAt = status === 'ended' ? new Date() : null;
    }
    if (scheduledFor !== undefined) room.scheduledFor = scheduledFor || null;
    if (settings !== undefined) room.settings = { ...room.settings, ...settings };
    await room.save();
    if (wasActive && room.status === 'ended') {
      req.app.get('io')?.to(room.roomCode).emit('meeting-ended-by-admin');
    }
    return sendSuccess(res, 'Meeting updated', { meeting: room });
  } catch (error) {
    next(error);
  }
};

export const deleteMeeting = async (req, res, next) => {
  try {
    const room = await Room.findOne({ roomCode: req.params.roomCode.toLowerCase() });
    if (!room) return sendError(res, 'Meeting not found.', 404);
    if (room.status === 'active') {
      req.app.get('io')?.to(room.roomCode).emit('meeting-ended-by-admin');
    }
    await Promise.all([
      Participant.deleteMany({ room: room._id }),
      Message.deleteMany({ room: room._id }),
      Transcript.deleteMany({ room: room._id }),
      room.deleteOne(),
    ]);
    return sendSuccess(res, 'Meeting and its history deleted');
  } catch (error) {
    next(error);
  }
};

export const getPlatformSettings = async (req, res, next) => {
  try {
    const settings = await PlatformSettings.findById('platform');
    return sendSuccess(res, 'Platform settings retrieved', {
      settings: settings || new PlatformSettings(),
    });
  } catch (error) {
    next(error);
  }
};

export const updatePlatformSettings = async (req, res, next) => {
  try {
    const { defaultMaxParticipants, defaultMeetingSettings } = req.body;
    const updates = {};
    if (defaultMaxParticipants !== undefined) {
      const max = Number(defaultMaxParticipants);
      if (!Number.isInteger(max) || max < 2 || max > 500) {
        return sendError(res, 'Default participant limit must be between 2 and 500.', 400);
      }
      updates.defaultMaxParticipants = max;
    }
    if (defaultMeetingSettings !== undefined) {
      const allowedKeys = [
        'isLocked',
        'muteOnEntry',
        'allowScreenShare',
        'allowChat',
        'requireHostApproval',
        'aiTranscriptionEnabled',
      ];
      if (
        typeof defaultMeetingSettings !== 'object' ||
        !defaultMeetingSettings ||
        Object.keys(defaultMeetingSettings).some((key) => !allowedKeys.includes(key)) ||
        Object.values(defaultMeetingSettings).some((value) => typeof value !== 'boolean')
      ) {
        return sendError(res, 'Meeting defaults contain invalid settings.', 400);
      }
      updates.defaultMeetingSettings = defaultMeetingSettings;
    }
    const settings = await PlatformSettings.findByIdAndUpdate(
      'platform',
      { $set: updates },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    return sendSuccess(res, 'Platform settings saved', { settings });
  } catch (error) {
    next(error);
  }
};
