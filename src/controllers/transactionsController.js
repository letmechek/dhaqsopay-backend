import crypto from 'crypto';
import { Account } from '../models/Account.js';
import { Transaction } from '../models/Transaction.js';
import { formatTransaction } from '../utils/serializers.js';

const FEE_RATE = 0.011;

export const listTransactions = async (req, res, next) => {
  try {
    const { status = 'all', search } = req.query;
    const filter = { user: req.user.id };
    if (status !== 'all') {
      filter.status = status;
    }
    if (search) {
      filter.reference = { $regex: search, $options: 'i' };
    }

    const transactions = await Transaction.find(filter)
      .populate('fromAccount')
      .populate('toAccount')
      .sort({ createdAt: -1 });

    res.json({ transactions: transactions.map(formatTransaction) });
  } catch (error) {
    next(error);
  }
};

export const getTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, user: req.user.id })
      .populate('fromAccount')
      .populate('toAccount');

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.json({ transaction: formatTransaction(transaction) });
  } catch (error) {
    next(error);
  }
};

export const createTransaction = async (req, res, next) => {
  try {
    const { fromAccountId, toAccountId, amount } = req.body;
    const fromAccount = await Account.findOne({ _id: fromAccountId, user: req.user.id });
    const toAccount = await Account.findOne({ _id: toAccountId, user: req.user.id });

    if (!fromAccount || !toAccount) {
      return res.status(404).json({ message: 'Accounts not found' });
    }

    const fee = Number((amount * FEE_RATE).toFixed(2));
    const total = Number(amount) + fee;
    if (fromAccount.balance < total) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    fromAccount.balance -= total;
    toAccount.balance += Number(amount);
    await fromAccount.save();
    await toAccount.save();

    const transaction = await Transaction.create({
      user: req.user.id,
      fromAccount: fromAccount.id,
      toAccount: toAccount.id,
      amount,
      fee,
      total,
      status: 'completed',
      reference: crypto.randomBytes(6).toString('hex').toUpperCase(),
      providerReference: crypto.randomBytes(4).toString('hex')
    });

    const populated = await transaction.populate(['fromAccount', 'toAccount']);

    res.status(201).json({ transaction: formatTransaction(populated) });
  } catch (error) {
    next(error);
  }
};

export const calculateFee = (req, res) => {
  const { amount = 0 } = req.body;
  const numericAmount = Number(amount) || 0;
  const fee = Number((numericAmount * FEE_RATE).toFixed(2));
  const total = numericAmount + fee;
  res.json({ amount: numericAmount, fee, total });
};
