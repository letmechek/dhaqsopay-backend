import { Account } from '../models/Account.js';
import { formatAccount } from '../utils/serializers.js';

export const listAccounts = async (req, res, next) => {
  try {
    const accounts = await Account.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json({ accounts: accounts.map(formatAccount) });
  } catch (error) {
    next(error);
  }
};

export const createAccount = async (req, res, next) => {
  try {
    const { type, number, balance = 0, currency = 'USD' } = req.body;
    const account = await Account.create({
      user: req.user.id,
      type,
      name: req.body.name || type,
      number,
      balance,
      currency,
      lastSyncedAt: new Date()
    });

    res.status(201).json({ account: formatAccount(account) });
  } catch (error) {
    next(error);
  }
};

export const removeAccount = async (req, res, next) => {
  try {
    const { id } = req.params;
    const account = await Account.findOne({ _id: id, user: req.user.id });
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    await account.deleteOne();
    res.json({ message: 'Account removed' });
  } catch (error) {
    next(error);
  }
};

export const getBalance = async (req, res, next) => {
  try {
    const { id } = req.params;
    const account = await Account.findOne({ _id: id, user: req.user.id });
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    res.json({ balance: account.balance, currency: account.currency });
  } catch (error) {
    next(error);
  }
};
