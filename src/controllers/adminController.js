import mongoose from 'mongoose';
import { PurchaseRequest } from '../models/PurchaseRequest.js';
import { Transaction } from '../models/Transaction.js';
import { User } from '../models/User.js';
import { ChannelConfig } from '../models/ChannelConfig.js';
import { ChatThread } from '../models/ChatThread.js';
import { formatPurchaseRequest } from '../utils/serializers.js';
import { getAllChannels, getChannelByCode, upsertChannelConfig } from '../services/channelService.js';

const ONE_HOUR_MS = 60 * 60 * 1000;
const ONE_DAY_MS = 24 * ONE_HOUR_MS;

const startOfDayUtc = date => {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  return d;
};

const buildTrendSeries = async () => {
  const now = new Date();
  const lookbackStart = new Date(now.getTime() - 13 * ONE_DAY_MS);

  const buckets = await PurchaseRequest.aggregate([
    {
      $match: {
        createdAt: { $gte: lookbackStart }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        totalFiat: { $sum: '$amountFiat' }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
    }
  ]);

  const mapped = new Map(
    buckets.map(item => {
      const date = new Date(Date.UTC(item._id.year, item._id.month - 1, item._id.day));
      const label = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      return [startOfDayUtc(date).getTime(), { label, value: item.totalFiat }];
    })
  );

  return Array.from({ length: 14 }).map((_, index) => {
    const day = new Date(lookbackStart.getTime() + index * ONE_DAY_MS);
    const key = startOfDayUtc(day).getTime();
    const label = day.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const entry = mapped.get(key);
    return {
      label,
      value: Number(entry?.value ?? 0)
    };
  });
};

export const getAdminSummary = async (req, res, next) => {
  try {
    const now = new Date();
    const last24h = new Date(now.getTime() - ONE_DAY_MS);
    const last30d = new Date(now.getTime() - 30 * ONE_DAY_MS);

    const [
      openPurchases,
      pendingRelease,
      disputes,
      channels,
      supportAwaitingAgent,
      supportAwaitingCustomer
    ] = await Promise.all([
      PurchaseRequest.countDocuments({ status: { $in: ['pending_payment', 'awaiting_review', 'approved'] } }),
      PurchaseRequest.countDocuments({ status: { $in: ['awaiting_review', 'approved'] } }),
      PurchaseRequest.countDocuments({ status: 'rejected' }),
      getAllChannels(),
      ChatThread.countDocuments({ status: { $in: ['waiting_agent'] } }),
      ChatThread.countDocuments({ status: 'waiting_customer' })
    ]);

    const [volumeAgg] = await PurchaseRequest.aggregate([
      {
        $match: {
          createdAt: { $gte: last24h }
        }
      },
      {
        $group: {
          _id: null,
          totalVolume24h: { $sum: '$amountFiat' },
          totalRevenue24h: { $sum: '$feeFiat' }
        }
      }
    ]);

    const releaseAgg = await PurchaseRequest.aggregate([
      {
        $match: {
          releasedAt: { $exists: true, $ne: null }
        }
      },
      {
        $project: {
          releaseMinutes: {
            $divide: [{ $subtract: ['$releasedAt', '$createdAt'] }, ONE_HOUR_MS / 60]
          }
        }
      },
      {
        $group: {
          _id: null,
          averageReleaseMinutes: { $avg: '$releaseMinutes' }
        }
      }
    ]);

    const activeChannels = await PurchaseRequest.distinct('paymentChannelCode', {
      createdAt: { $gte: last30d }
    });

    const trend = await buildTrendSeries();

    res.json({
      openPurchases,
      pendingRelease,
      totalVolume24h: volumeAgg?.totalVolume24h ?? 0,
      totalRevenue24h: volumeAgg?.totalRevenue24h ?? 0,
      averageReleaseMinutes: releaseAgg[0]?.averageReleaseMinutes
        ? Number(releaseAgg[0].averageReleaseMinutes.toFixed(1))
        : 0,
      activeChannels:
        channels.filter(channel => channel.status !== 'disabled').length || activeChannels.length,
      disputes,
      openSupportThreads: supportAwaitingAgent,
      supportWaitingCustomer: supportAwaitingCustomer,
      trend
    });
  } catch (error) {
    next(error);
  }
};

export const getRecentActivity = async (req, res, next) => {
  try {
    const [purchases, supportThreads] = await Promise.all([
      PurchaseRequest.find({})
        .populate('user', 'fullName country')
        .sort({ updatedAt: -1 })
        .limit(10),
      ChatThread.find({})
        .populate('user', 'fullName country')
        .sort({ lastMessageAt: -1 })
        .limit(5)
    ]);

    const purchaseItems = purchases.map(purchase => ({
      id: purchase.id,
      title: `${purchase.usdtAmount.toFixed(2)} USDT • ${purchase.paymentChannelSnapshot?.name ?? purchase.paymentChannelCode}`,
      status: purchase.status,
      createdAt: purchase.updatedAt || purchase.createdAt,
      user: purchase.user
        ? `${purchase.user.fullName} (${purchase.user.country})`
        : purchase.customerPhone ?? 'Unknown',
      reference: purchase.paymentReference
    }));

    const supportItems = supportThreads.map(thread => ({
      id: thread.id,
      title: `Support • ${thread.user?.fullName || 'Customer'}`,
      status: thread.status,
      createdAt: thread.lastMessageAt || thread.updatedAt,
      user: thread.user
        ? `${thread.user.fullName} (${thread.user.country})`
        : 'Customer support',
      reference: thread.lastMessageSnippet || 'New message'
    }));

    const items = [...purchaseItems, ...supportItems]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);

    res.json({ items });
  } catch (error) {
    next(error);
  }
};

export const listAdminPurchases = async (req, res, next) => {
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

export const getAdminPurchase = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid purchase id' });
    }

    const purchase = await PurchaseRequest.findById(req.params.id)
      .populate('user', 'fullName phone country savedWallets')
      .populate('reviewedBy', 'fullName phone');

    if (!purchase) {
      return res.status(404).json({ message: 'Purchase request not found' });
    }

    res.json({ purchase: formatPurchaseRequest(purchase) });
  } catch (error) {
    next(error);
  }
};

export const listAdminChannels = async (req, res, next) => {
  try {
    const [channels, overrides] = await Promise.all([
      getAllChannels(),
      ChannelConfig.find({}).populate('updatedBy', 'fullName phone')
    ]);

    const overrideMap = overrides.reduce((map, item) => {
      map.set(item.code, item);
      return map;
    }, new Map());

    const enriched = channels.map(channel => {
      const override = overrideMap.get(channel.code);
      return {
        ...channel,
        override: override
          ? {
              feePercent: override.feePercent,
              fxRate: override.fxRate,
              maxAmount: override.maxAmount,
              settlementTimeMinutes: override.settlementTimeMinutes,
              status: override.status,
              updatedAt: override.updatedAt,
              updatedBy: override.updatedBy
                ? {
                    id: override.updatedBy._id?.toString(),
                    fullName: override.updatedBy.fullName,
                    phone: override.updatedBy.phone
                  }
                : null
            }
          : null
      };
    });

    res.json({ channels: enriched });
  } catch (error) {
    next(error);
  }
};

export const listAdminCustomers = async (req, res, next) => {
  try {
    const aggregation = await PurchaseRequest.aggregate([
      {
        $group: {
          _id: '$user',
          purchases: { $sum: 1 },
          totalVolume: { $sum: '$amountFiat' },
          lastPurchaseAt: { $max: '$createdAt' }
        }
      }
    ]);

    const statsByUserId = new Map(
      aggregation
        .filter(item => item._id)
        .map(item => [item._id.toString(), item])
    );

    const users = await User.find({ _id: { $in: Array.from(statsByUserId.keys(), id => new mongoose.Types.ObjectId(id)) } })
      .select('fullName phone country isPhoneVerified createdAt');

    const customers = users.map(user => {
      const stats = statsByUserId.get(user._id.toString());
      return {
        id: user._id.toString(),
        fullName: user.fullName,
        phone: user.phone,
        country: user.country,
        purchases: stats?.purchases ?? 0,
        totalVolume: stats?.totalVolume ?? 0,
        lastPurchaseAt: stats?.lastPurchaseAt ?? user.createdAt,
        status: user.isPhoneVerified ? 'verified' : 'unverified'
      };
    }).sort((a, b) => new Date(b.lastPurchaseAt) - new Date(a.lastPurchaseAt));

    res.json({ customers });
  } catch (error) {
    next(error);
  }
};

export const listAdminTransactions = async (req, res, next) => {
  try {
    const transactions = await Transaction.find({})
      .populate('user', 'fullName phone country')
      .populate('fromAccount')
      .populate('toAccount')
      .sort({ createdAt: -1 })
      .limit(50);

    const formatted = transactions.map(transaction => {
      const currency =
        transaction.fromAccount?.currency ||
        transaction.toAccount?.currency ||
        'USD';

      return {
        id: transaction._id.toString(),
        type: transaction.amount >= 0 ? 'credit' : 'debit',
        title:
          transaction.notes ||
          `${transaction.fromAccount?.name || 'Account'} → ${transaction.toAccount?.name || 'Account'}`,
        amount: transaction.amount,
        fee: transaction.fee,
        total: transaction.total,
        currency,
        status: transaction.status,
        createdAt: transaction.createdAt,
        reference: transaction.reference,
        user: transaction.user
          ? {
              id: transaction.user._id.toString(),
              fullName: transaction.user.fullName,
              phone: transaction.user.phone,
              country: transaction.user.country
            }
          : null
      };
    });

    res.json({ transactions: formatted });
  } catch (error) {
    next(error);
  }
};

export const updateAdminChannel = async (req, res, next) => {
  try {
    const code = req.params.code?.toUpperCase();
    if (!code) {
      return res.status(400).json({ message: 'Channel code is required' });
    }

    const existing = await getChannelByCode(code);
    if (!existing) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    const { feePercent, fxRate, maxAmount, settlementTimeMinutes, status } = req.body || {};
    const updates = {};

    if (feePercent !== undefined) {
      const numeric = Number(feePercent);
      if (Number.isNaN(numeric) || numeric < 0) {
        return res.status(400).json({ message: 'Fee percent must be a positive number' });
      }
      updates.feePercent = numeric > 1 ? numeric / 100 : numeric;
    }

    if (fxRate !== undefined) {
      const numeric = Number(fxRate);
      if (Number.isNaN(numeric) || numeric <= 0) {
        return res.status(400).json({ message: 'FX rate must be greater than zero' });
      }
      updates.fxRate = numeric;
    }

    if (maxAmount !== undefined) {
      const numeric = Number(maxAmount);
      if (Number.isNaN(numeric) || numeric < 0) {
        return res.status(400).json({ message: 'Max amount must be zero or higher' });
      }
      updates.maxAmount = numeric;
    }

    if (settlementTimeMinutes !== undefined) {
      const numeric = Number(settlementTimeMinutes);
      if (Number.isNaN(numeric) || numeric < 0) {
        return res.status(400).json({ message: 'Release target must be zero or higher' });
      }
      updates.settlementTimeMinutes = numeric;
    }

    if (status !== undefined) {
      const allowedStatuses = ['active', 'limited', 'pilot', 'disabled'];
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ message: 'Unsupported status value' });
      }
      updates.status = status;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No valid fields supplied' });
    }

    const channel = await upsertChannelConfig({
      code,
      updates,
      userId: req.user.id
    });

    res.json({ channel });
  } catch (error) {
    next(error);
  }
};
