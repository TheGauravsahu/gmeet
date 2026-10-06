import mongoose from 'mongoose';

const platformSettingsSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: 'platform',
    },
    defaultMaxParticipants: {
      type: Number,
      min: 2,
      max: 500,
      default: 50,
    },
    defaultMeetingSettings: {
      isLocked: { type: Boolean, default: false },
      muteOnEntry: { type: Boolean, default: false },
      allowScreenShare: { type: Boolean, default: true },
      allowChat: { type: Boolean, default: true },
      requireHostApproval: { type: Boolean, default: true },
      aiTranscriptionEnabled: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

export const PlatformSettings = mongoose.model('PlatformSettings', platformSettingsSchema);
