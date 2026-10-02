import mongoose from 'mongoose';

const transcriptSchema = new mongoose.Schema(
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
    speaker: {
      type: String,
      required: [true, 'Speaker name is required'],
      trim: true,
    },
    text: {
      type: String,
      required: [true, 'Transcript text cannot be empty'],
      trim: true,
    },
    confidence: {
      type: Number,
      default: 0.98,
      min: 0,
      max: 1,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const Transcript = mongoose.model('Transcript', transcriptSchema);
