import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    fromAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: true
    },
    toAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    fee: {
      type: Number,
      required: true
    },
    total: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['completed', 'pending', 'failed', 'cancelled'],
      default: 'completed'
    },
    reference: {
      type: String,
      required: true,
      unique: true
    },
    providerReference: String,
    notes: String
  },
  { timestamps: true }
);

export const Transaction = mongoose.model('Transaction', transactionSchema);
