import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      match: /^\+\d{9,15}$/
    },
    password: {
      type: String,
      required: true,
      minlength: 8
    },
    country: {
      type: String,
      default: 'SO',
      uppercase: true,
      minlength: 2,
      maxlength: 2
    },
    preferredCurrency: {
      type: String,
      default: 'USD',
      uppercase: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true
    },
    role: {
      type: String,
      enum: ['customer', 'admin'],
      default: 'customer'
    },
    isPhoneVerified: {
      type: Boolean,
      default: false
    },
    verificationCode: String,
    verificationCodeExpiresAt: Date,
    verificationAttempts: {
      type: Number,
      default: 3
    },
    savedWallets: [
      {
        label: {
          type: String,
          trim: true,
          maxlength: 64
        },
        address: {
          type: String,
          required: true,
          trim: true
        },
        network: {
          type: String,
          enum: ['TRON'],
          default: 'TRON'
        },
        isDefault: {
          type: Boolean,
          default: false
        },
        createdAt: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  { timestamps: true }
);

userSchema.pre('save', async function preSave(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

export const User = mongoose.model('User', userSchema);
