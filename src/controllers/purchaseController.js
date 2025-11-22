import { PurchaseRequest } from '../models/PurchaseRequest.js';
import { formatPurchaseRequest } from '../utils/serializers.js';
import { getAllChannels, getChannelByCode } from '../services/channelService.js';

const buildChannelSnapshot = channel => ({
  code: channel.code,
  name: channel.name,
  country: channel.country,
  type: channel.type,
  currencies: channel.currencies,
  fxRate: channel.fxRate,
  feePercent: channel.feePercent,
  maxAmount: channel.maxAmount,
  minAmount: channel.minAmount,
  status: channel.status,
  instructions: channel.instructions,
  settlementTimeMinutes: channel.settlementTimeMinutes
});

const normalizeCurrency = ({ channelCurrencies, fallback }) => {
  if (channelCurrencies?.length) {
    return channelCurrencies[0].toUpperCase();
  }
  return fallback;
};

const resolveFeePercent = channel => (channel.feePercent && !Number.isNaN(Number(channel.feePercent)) ? Number(channel.feePercent) : 0.03);

const resolveExchangeRate = channel =>
  channel.fxRate && !Number.isNaN(Number(channel.fxRate))
    ? Number(channel.fxRate)
    : Number(process.env.DEFAULT_USDT_RATE) || 1;

const detectCardBrand = number => {
  if (!number) return 'Card';
  if (/^4/.test(number)) return 'Visa';
  if (/^5[1-5]/.test(number) || /^2(2[2-9]|[3-7])/.test(number)) return 'Mastercard';
  if (/^3[47]/.test(number)) return 'American Express';
  if (/^6(?:011|5)/.test(number)) return 'Discover';
  return 'Card';
};

export const listPaymentChannels = async (req, res, next) => {
  try {
    const channels = (await getAllChannels()).filter(channel => channel.status !== 'disabled');
    res.json({ channels });
  } catch (error) {
    next(error);
  }
};

export const createPurchaseRequest = async (req, res, next) => {
  try {
    const {
      paymentChannelCode,
      amountFiat,
      walletAddress,
      walletId,
      walletLabel,
      customerPhone,
      notes,
      cardDetails
    } = req.body;

    const channel = await getChannelByCode(paymentChannelCode);
    if (!channel) {
      return res.status(400).json({ message: 'Unsupported payment channel' });
    }

    if (channel.status === 'disabled') {
      return res.status(400).json({ message: `${channel.name} is currently unavailable` });
    }

    const numericAmount = Number(amountFiat);
    if (!numericAmount || numericAmount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    if (channel.minAmount && numericAmount < channel.minAmount) {
      return res.status(400).json({
        message: `Minimum amount for ${channel.name} is ${channel.minAmount}`
      });
    }

    if (channel.maxAmount && numericAmount > channel.maxAmount) {
      return res.status(400).json({
        message: `Maximum amount for ${channel.name} is ${channel.maxAmount}`
      });
    }

    const existingWallet =
      walletId && req.user.savedWallets ? req.user.savedWallets.id(walletId) : null;
    if (walletId && !existingWallet) {
      return res.status(404).json({ message: 'Saved wallet not found' });
    }

    const trimmedWallet = typeof walletAddress === 'string' ? walletAddress.trim() : '';
    if (!existingWallet && !trimmedWallet) {
      return res.status(400).json({ message: 'Wallet address is required' });
    }

    const resolvedAddress = existingWallet ? existingWallet.address.trim() : trimmedWallet;
    const resolvedNetwork = existingWallet ? existingWallet.network : 'TRON';
    const resolvedLabel =
      existingWallet?.label ||
      (typeof walletLabel === 'string' && walletLabel.trim().length > 0
        ? walletLabel.trim()
        : 'Custom Wallet');

    const feePercent = Number(resolveFeePercent(channel).toFixed(6));
    const processingFeeFiat = Number((numericAmount * feePercent).toFixed(2));
    const netAmountFiat = Number((numericAmount - processingFeeFiat).toFixed(2));
    if (netAmountFiat <= 0) {
      return res.status(400).json({ message: 'Amount too low after fees' });
    }

    const effectiveRate = resolveExchangeRate(channel);
    if (!effectiveRate || effectiveRate <= 0) {
      return res.status(400).json({ message: 'Conversion rate unavailable' });
    }

    const usdtAmount = Number((netAmountFiat / effectiveRate).toFixed(2));

    let cardSnapshot = null;
    if (channel.type === 'card') {
      const details = cardDetails || {};
      const digits = (details.cardNumber || '').replace(/\D/g, '');
      if (digits.length < 12) {
        return res.status(400).json({ message: 'Card number is invalid' });
      }

      const holder = details.cardHolder ? String(details.cardHolder).trim() : '';
      if (!holder) {
        return res.status(400).json({ message: 'Card holder name is required' });
      }

      const expiryMonth = Number(details.expiryMonth);
      const expiryYear = Number(details.expiryYear);
      if (!expiryMonth || expiryMonth < 1 || expiryMonth > 12 || !expiryYear || expiryYear < 2023) {
        return res.status(400).json({ message: 'Card expiry is invalid' });
      }

      cardSnapshot = {
        brand: detectCardBrand(digits),
        last4: digits.slice(-4),
        holder,
        expiryMonth,
        expiryYear,
        email: details.email ? String(details.email).trim() : undefined
      };
    }

    const initialStatus = channel.type === 'card' ? 'awaiting_review' : undefined;

    const purchase = await PurchaseRequest.create({
      user: req.user.id,
      paymentChannelCode,
      paymentChannelSnapshot: buildChannelSnapshot(channel),
      amountFiat: numericAmount,
      fiatCurrency: normalizeCurrency({
        channelCurrencies: channel.currencies,
        fallback: req.user.preferredCurrency || 'USD'
      }),
      rate: Number(effectiveRate.toFixed(4)),
      feeFiat: processingFeeFiat,
      feePercent,
      netAmountFiat,
      usdtAmount,
      walletAddress: resolvedAddress,
      savedWalletId: existingWallet ? existingWallet._id : undefined,
      walletLabel: resolvedLabel,
      walletSource: existingWallet ? 'saved' : 'custom',
      network: resolvedNetwork,
      customerPhone: customerPhone || req.user.phone,
      notes,
      status: initialStatus,
      estimatedReleaseMinutes: channel.settlementTimeMinutes,
      cardDetails: cardSnapshot
    });

    res.status(201).json({ purchase: formatPurchaseRequest(purchase) });
  } catch (error) {
    next(error);
  }
};

export const listPurchaseRequests = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = { user: req.user.id };
    if (status && status !== 'all') {
      filter.status = status;
    }

    const purchases = await PurchaseRequest.find(filter).sort({ createdAt: -1 });

    res.json({ purchases: purchases.map(formatPurchaseRequest) });
  } catch (error) {
    next(error);
  }
};

export const getPurchaseRequest = async (req, res, next) => {
  try {
    const purchase = await PurchaseRequest.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!purchase) {
      return res.status(404).json({ message: 'Purchase request not found' });
    }

    res.json({ purchase: formatPurchaseRequest(purchase) });
  } catch (error) {
    next(error);
  }
};

export const submitPaymentProof = async (req, res, next) => {
  try {
    const { paymentReference, proof } = req.body;
    const purchase = await PurchaseRequest.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!purchase) {
      return res.status(404).json({ message: 'Purchase request not found' });
    }

    if (!purchase.isActionable) {
      return res.status(400).json({ message: 'Purchase request cannot be updated' });
    }

    if (paymentReference) {
      purchase.paymentReference = paymentReference;
    }

    if (proof?.value) {
      purchase.proof = {
        type: proof.type || 'text',
        value: proof.value,
        submittedAt: new Date()
      };
    }

    purchase.status = 'awaiting_review';
    await purchase.save();

    res.json({ purchase: formatPurchaseRequest(purchase) });
  } catch (error) {
    next(error);
  }
};

export const cancelPurchaseRequest = async (req, res, next) => {
  try {
    const purchase = await PurchaseRequest.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!purchase) {
      return res.status(404).json({ message: 'Purchase request not found' });
    }

    if (!['pending_payment', 'awaiting_review'].includes(purchase.status)) {
      return res.status(400).json({ message: 'Purchase request cannot be cancelled' });
    }

    purchase.status = 'cancelled';
    await purchase.save();

    res.json({ purchase: formatPurchaseRequest(purchase) });
  } catch (error) {
    next(error);
  }
};

export const listAllPurchaseRequests = async (req, res, next) => {
  try {
    const { status, country } = req.query;
    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (country) {
      filter['paymentChannelSnapshot.country'] = country.toUpperCase();
    }

    const purchases = await PurchaseRequest.find(filter)
      .populate('user', 'fullName phone country')
      .populate('reviewedBy', 'fullName phone')
      .sort({ createdAt: -1 });

    res.json({ purchases: purchases.map(formatPurchaseRequest) });
  } catch (error) {
    next(error);
  }
};

export const updatePurchaseStatus = async (req, res, next) => {
  try {
    const { status, notes, paymentReference } = req.body;
    const allowedStatuses = ['pending_payment', 'awaiting_review', 'approved', 'rejected', 'released', 'cancelled'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Unsupported status transition' });
    }

    const purchase = await PurchaseRequest.findById(req.params.id);
    if (!purchase) {
      return res.status(404).json({ message: 'Purchase request not found' });
    }

    if (paymentReference) {
      purchase.paymentReference = paymentReference;
    }

    if (notes) {
      purchase.notes = notes;
    }

    purchase.status = status;
    purchase.reviewedBy = req.user.id;
    purchase.reviewedAt = new Date();

    if (status === 'released') {
      purchase.releasedAt = new Date();
    }

    await purchase.save();
    await purchase.populate('user', 'fullName phone country');
    await purchase.populate('reviewedBy', 'fullName phone');

    res.json({ purchase: formatPurchaseRequest(purchase) });
  } catch (error) {
    next(error);
  }
};
