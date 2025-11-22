import mongoose from 'mongoose';

const channelConfigSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true
    },
    feePercent: {
      type: Number,
      min: 0
    },
    fxRate: {
      type: Number,
      min: 0
    },
    maxAmount: {
      type: Number,
      min: 0
    },
    settlementTimeMinutes: {
      type: Number,
      min: 0
    },
    status: {
      type: String,
      enum: ['active', 'limited', 'pilot', 'disabled'],
      default: 'active'
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
);

channelConfigSchema.index({ code: 1 });

export const ChannelConfig = mongoose.model('ChannelConfig', channelConfigSchema);
