import mongoose from 'mongoose';

const chatThreadSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    subject: {
      type: String,
      trim: true,
      default: 'Support chat'
    },
    status: {
      type: String,
      enum: ['open', 'waiting_agent', 'waiting_customer', 'resolved', 'closed'],
      default: 'open',
      index: true
    },
    lastMessageAt: {
      type: Date,
      default: Date.now
    },
    lastMessageSnippet: {
      type: String,
      maxlength: 280
    },
    lastSender: {
      type: String,
      enum: ['customer', 'admin', 'system'],
      default: 'customer'
    },
    messagesCount: {
      type: Number,
      default: 0
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
);

chatThreadSchema.index({ lastMessageAt: -1 });

export const ChatThread = mongoose.model('ChatThread', chatThreadSchema);
