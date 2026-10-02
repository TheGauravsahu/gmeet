import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema(
  {
    roomCode: {
      type: String,
      required: [true, 'Room code is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    title: {
      type: String,
      default: 'AURA Meeting',
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    hostName: {
      type: String,
      default: 'Meeting Host',
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'ended', 'scheduled'],
      default: 'active',
      index: true,
    },
    settings: {
      isLocked: { type: Boolean, default: false },
      muteOnEntry: { type: Boolean, default: false },
      allowScreenShare: { type: Boolean, default: true },
      allowChat: { type: Boolean, default: true },
      requireHostApproval: { type: Boolean, default: false },
      aiTranscriptionEnabled: { type: Boolean, default: true },
    },
    scheduledFor: {
      type: Date,
      default: null,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    endedAt: {
      type: Date,
      default: null,
    },
    maxParticipants: {
      type: Number,
      default: 50,
    },
  },
  {
    timestamps: true,
  }
);

export const Room = mongoose.model('Room', roomSchema);
