import mongoose from 'mongoose';
import { User } from '../models/User.js';

const normalizeWallet = wallet => ({
  id: wallet._id.toString(),
  label: wallet.label,
  address: wallet.address,
  network: wallet.network,
  isDefault: wallet.isDefault,
  createdAt: wallet.createdAt
});

const ensureUserLoaded = async userId =>
  User.findById(userId).select('savedWallets');

const findWalletById = (userDoc, walletId) => {
  if (!mongoose.Types.ObjectId.isValid(walletId)) {
    return null;
  }
  return userDoc.savedWallets.id(walletId);
};

const enforceSingleDefault = (wallets, defaultId) => {
  wallets.forEach(wallet => {
    // eslint-disable-next-line no-param-reassign
    wallet.isDefault = wallet._id.equals(defaultId);
  });
};

export const listWallets = async (req, res, next) => {
  try {
    const user = await ensureUserLoaded(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      wallets: (user?.savedWallets ?? []).map(normalizeWallet)
    });
  } catch (error) {
    next(error);
  }
};

export const createWallet = async (req, res, next) => {
  try {
    const { label, address, isDefault } = req.body;
    const trimmedAddress = typeof address === 'string' ? address.trim() : '';
    if (!trimmedAddress) {
      return res.status(400).json({ message: 'Wallet address is required' });
    }

    const normalizedAddress = trimmedAddress;
    const user = await ensureUserLoaded(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const exists = user.savedWallets.some(
      wallet => wallet.address.toLowerCase() === normalizedAddress.toLowerCase()
    );
    if (exists) {
      return res.status(400).json({ message: 'Wallet already saved' });
    }

    const walletLabel =
      typeof label === 'string' && label.trim().length > 0
        ? label.trim()
        : `Wallet ${user.savedWallets.length + 1}`;

    const wallet = user.savedWallets.create({
      label: walletLabel,
      address: normalizedAddress,
      network: 'TRON',
      isDefault: Boolean(isDefault)
    });

    user.savedWallets.push(wallet);

    if (wallet.isDefault || user.savedWallets.length === 1) {
      enforceSingleDefault(user.savedWallets, wallet._id);
    }

    await user.save();

    res.status(201).json({ wallet: normalizeWallet(wallet) });
  } catch (error) {
    next(error);
  }
};

export const updateWallet = async (req, res, next) => {
  try {
    const { walletId } = req.params;
    const { label, isDefault } = req.body;
    const user = await ensureUserLoaded(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const wallet = findWalletById(user, walletId);
    if (!wallet) {
      return res.status(404).json({ message: 'Wallet not found' });
    }

    if (typeof label === 'string') {
      wallet.label = label.trim();
    }

    if (typeof isDefault === 'boolean' && isDefault) {
      enforceSingleDefault(user.savedWallets, wallet._id);
    } else if (typeof isDefault === 'boolean' && !isDefault && wallet.isDefault) {
      // Prevent unsetting the only default without choosing another
      return res.status(400).json({ message: 'At least one wallet must remain default' });
    }

    await user.save();

    res.json({ wallet: normalizeWallet(wallet) });
  } catch (error) {
    next(error);
  }
};

export const deleteWallet = async (req, res, next) => {
  try {
    const { walletId } = req.params;
    const user = await ensureUserLoaded(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const wallet = findWalletById(user, walletId);
    if (!wallet) {
      return res.status(404).json({ message: 'Wallet not found' });
    }

    const wasDefault = wallet.isDefault;
    wallet.deleteOne();

    if (user.savedWallets.length > 0 && wasDefault) {
      enforceSingleDefault(user.savedWallets, user.savedWallets[0]._id);
    }

    await user.save();

    res.json({ message: 'Wallet removed' });
  } catch (error) {
    next(error);
  }
};
