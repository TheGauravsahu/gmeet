import mongoose from 'mongoose';

const participantSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
      index: true,
    },
    roomCode: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    displayName: {
      type: String,
      required: [true, 'Display name is required'],
      trim: true,
    },
    avatar: {
      type: String,
      default: '',
    },
    socketId: {
      type: String,
      default: '',
      index: true,
    },
    peerId: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['host', 'co-host', 'participant'],
      default: 'participant',
    },
    isAudioMuted: {
      type: Boolean,
      default: false,
    },
    isVideoMuted: {
      type: Boolean,
      default: false,
    },
    isScreenSharing: {
      type: Boolean,
      default: false,
    },
    isHandRaised: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    leftAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const Participant = mongoose.model('Participant', participantSchema);
