import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema(
  {
    thread: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatThread',
      required: true,
      index: true
    },
    senderType: {
      type: String,
      enum: ['customer', 'admin', 'system'],
      required: true
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    body: {
      type: String,
      trim: true,
      required: true,
      maxlength: 2000
    },
    readAt: Date
  },
  { timestamps: true }
);

chatMessageSchema.index({ thread: 1, createdAt: 1 });

export const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);
