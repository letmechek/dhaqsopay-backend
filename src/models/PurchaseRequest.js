import mongoose from 'mongoose';

const proofSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['text', 'image', 'file'],
      default: 'text'
    },
    value: String,
    submittedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const purchaseRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    paymentChannelCode: {
      type: String,
      required: true
    },
    paymentChannelSnapshot: {
      type: Object,
      required: true
    },
    amountFiat: {
      type: Number,
      required: true
    },
    fiatCurrency: {
      type: String,
      required: true,
      uppercase: true
    },
    rate: {
      type: Number,
      required: true
    },
    usdtAmount: {
      type: Number,
      required: true
    },
    walletAddress: {
      type: String,
      required: true
    },
    savedWalletId: {
      type: mongoose.Schema.Types.ObjectId
    },
    walletLabel: String,
    walletSource: {
      type: String,
      enum: ['custom', 'saved'],
      default: 'custom'
    },
    network: {
      type: String,
      enum: ['TRON'],
      default: 'TRON'
    },
    cardDetails: {
      brand: String,
      last4: String,
      holder: String,
      expiryMonth: Number,
      expiryYear: Number,
      email: String
    },
    feeFiat: {
      type: Number,
      required: true,
      default: 0
    },
    feePercent: {
      type: Number,
      required: true,
      default: 0.03
    },
    netAmountFiat: {
      type: Number,
      required: true,
      default: 0
    },
    customerPhone: String,
    paymentReference: String,
    notes: String,
    proof: proofSchema,
    status: {
      type: String,
      enum: ['pending_payment', 'awaiting_review', 'approved', 'rejected', 'released', 'cancelled'],
      default: 'pending_payment'
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date,
    releasedAt: Date,
    estimatedReleaseMinutes: Number
  },
  { timestamps: true }
);

purchaseRequestSchema.virtual('isActionable').get(function isActionable() {
  return ['pending_payment', 'awaiting_review'].includes(this.status);
});

export const PurchaseRequest = mongoose.model('PurchaseRequest', purchaseRequestSchema);
