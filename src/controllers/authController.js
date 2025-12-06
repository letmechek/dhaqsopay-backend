import crypto from 'crypto';
import { User } from '../models/User.js';
import { createToken } from '../utils/token.js';
import { Account } from '../models/Account.js';
import { DEFAULT_ACCOUNTS_BY_COUNTRY } from '../data/defaultAccounts.js';
import { sendVerificationSMS } from '../utils/smsService.js';

const sanitizeUser = user => ({
  id: user.id,
  fullName: user.fullName,
  phone: user.phone,
  country: user.country,
  preferredCurrency: user.preferredCurrency,
  role: user.role,
  isPhoneVerified: user.isPhoneVerified
});

export const register = async (req, res, next) => {
  try {
    console.log('=== REGISTER START ===');
    console.log('Request body (sanitized):', {
      fullName: req.body?.fullName,
      phone: req.body?.phone,
      country: req.body?.country,
      preferredCurrency: req.body?.preferredCurrency
    });
    
    const { fullName, phone, password, country, preferredCurrency } = req.body;
    const normalizedPhone = typeof phone === 'string' ? phone.trim() : phone;
    const phoneDigits = normalizedPhone ? normalizedPhone.replace(/\D/g, '') : '';
    const placeholderEmail = `${phoneDigits || Date.now()}@users.dhaqsopay.local`;
    console.log('Extracted fields:', {
      fullName,
      phone: normalizedPhone,
      country,
      preferredCurrency,
      password: password ? '***' : undefined
    });

    console.log('Checking if user exists with phone:', normalizedPhone);
    const exists = await User.findOne({ phone: normalizedPhone });
    console.log('User exists?', !!exists);
    
    if (exists) {
      console.log('User already registered, returning 400');
      return res.status(400).json({ message: 'Phone number already registered' });
    }

    console.log('Creating new user...');
    const user = await User.create({
      fullName,
      phone: normalizedPhone,
      password,
      country: country?.toUpperCase(),
      preferredCurrency,
      email: placeholderEmail
    });
    console.log('User created successfully:', { id: user.id, fullName: user.fullName, phone: user.phone });

    console.log('Creating accounts for user:', user.id);
    const accountTemplates =
      DEFAULT_ACCOUNTS_BY_COUNTRY[user.country] || DEFAULT_ACCOUNTS_BY_COUNTRY.default;
    const accounts = await Account.create(
      accountTemplates.map(template => ({
        user: user.id,
        type: template.type,
        name: template.name ?? template.type,
        number: template.number,
        balance: template.balance ?? 0,
        currency: template.currency ?? 'USD',
        lastSyncedAt: new Date()
      }))
    );
    console.log('Accounts created:', accounts.length);

    console.log('Generating token...');
    const token = createToken(user);
    console.log('Token generated:', token ? 'Success' : 'Failed');

    console.log('Sending success response');
    res.status(201).json({
      user: sanitizeUser(user),
      token
    });
    console.log('=== REGISTER END ===');
  } catch (error) {
    console.error('=== REGISTER ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error details:', error);
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { phone, password } = req.body;
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const passwordMatch = await user.comparePassword(password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = createToken(user);

    res.json({
      user: sanitizeUser(user),
      token
    });
  } catch (error) {
    next(error);
  }
};

export const sendVerification = async (req, res, next) => {
  try {
    const { phone } = req.body;
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const code = crypto.randomInt(100000, 999999).toString();
    user.verificationCode = code;
    user.verificationAttempts = 3;
    user.verificationCodeExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendVerificationSMS({ to: phone, code });

    res.json({ message: 'Verification code sent', attemptsRemaining: user.verificationAttempts });
  } catch (error) {
    next(error);
  }
};

export const verifyPhone = async (req, res, next) => {
  try {
    const { phone, code } = req.body;
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.verificationCode || user.verificationAttempts <= 0) {
      return res.status(400).json({ message: 'Verification unavailable. Request a new code.' });
    }

    if (user.verificationCodeExpiresAt < new Date()) {
      return res.status(400).json({ message: 'Verification code expired. Request a new code.' });
    }

    if (user.verificationCode !== code) {
      user.verificationAttempts -= 1;
      await user.save();
      return res.status(400).json({
        message: 'Invalid verification code',
        attemptsRemaining: user.verificationAttempts
      });
    }

    user.isPhoneVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpiresAt = null;
    user.verificationAttempts = 0;
    await user.save();

    res.json({ message: 'Phone verified', user: sanitizeUser(user) });
  } catch (error) {
    next(error);
  }
};

export const skipVerification = async (req, res, next) => {
  try {
    const { phone } = req.body;
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isPhoneVerified = false;
    user.verificationCode = null;
    user.verificationCodeExpiresAt = null;
    user.verificationAttempts = 0;
    await user.save();

    res.json({ message: 'Verification skipped' });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req, res) => {
  res.json({ user: sanitizeUser(req.user) });
};

export const updateProfile = async (req, res, next) => {
  try {
    const fields = ['fullName'];
    fields.forEach(field => {
      if (req.body[field]) {
        req.user[field] = req.body[field];
      }
    });
    await req.user.save();
    res.json({ user: sanitizeUser(req.user) });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    const passwordMatch = await user.comparePassword(currentPassword);
    if (!passwordMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated' });
  } catch (error) {
    next(error);
  }
};
