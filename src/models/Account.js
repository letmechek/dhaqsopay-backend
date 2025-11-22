import mongoose from 'mongoose';

const accountSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      enum: [
        'EVC',
        'Premier',
        'eDahab',
        'MPESA',
        'AirtelMoney',
        'TigoPesa',
        'MTNMoMo',
        'OrangeMoney',
        'ChipperCash',
        'Binance',
        'USDT',
        'PayPal',
        'Payeer',
        'Sahal',
        'eBesa',
        'BankTransfer',
        'Visa',
        'Mastercard'
      ],
      required: true
    },
    name: {
      type: String,
      default: function defaultName() {
        return this.type;
      }
    },
    number: {
      type: String,
      required: true
    },
    balance: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'USD'
    },
    isDefault: {
      type: Boolean,
      default: false
    },
    lastSyncedAt: Date
  },
  { timestamps: true }
);

export const Account = mongoose.model('Account', accountSchema);
