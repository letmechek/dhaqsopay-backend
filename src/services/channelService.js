import { PAYMENT_CHANNELS } from '../data/paymentChannels.js';
import { ChannelConfig } from '../models/ChannelConfig.js';

const applyOverrides = (channel, overrides) => {
  if (!channel) return null;

  const merged = {
    status: 'active',
    ...channel
  };

  if (!Array.isArray(merged.currencies) || merged.currencies.length === 0) {
    merged.currencies = ['USD'];
  }

  if (!overrides) {
    return merged;
  }

  const result = { ...merged };

  if (typeof overrides.feePercent === 'number') {
    result.feePercent = overrides.feePercent;
  }
  if (typeof overrides.fxRate === 'number' && overrides.fxRate > 0) {
    result.fxRate = overrides.fxRate;
  }
  if (typeof overrides.maxAmount === 'number' && overrides.maxAmount >= 0) {
    result.maxAmount = overrides.maxAmount;
  }
  if (
    typeof overrides.settlementTimeMinutes === 'number' &&
    overrides.settlementTimeMinutes >= 0
  ) {
    result.settlementTimeMinutes = overrides.settlementTimeMinutes;
  }
  if (overrides.status) {
    result.status = overrides.status;
  }

  return result;
};

export const getAllChannels = async () => {
  const overrides = await ChannelConfig.find({});
  const overrideMap = overrides.reduce((map, item) => {
    map.set(item.code, item);
    return map;
  }, new Map());

  return PAYMENT_CHANNELS.map(channel => applyOverrides(channel, overrideMap.get(channel.code)));
};

export const getChannelByCode = async code => {
  if (!code) return null;
  const baseChannel = PAYMENT_CHANNELS.find(item => item.code === code);
  if (!baseChannel) return null;
  const override = await ChannelConfig.findOne({ code });
  return applyOverrides(baseChannel, override);
};

export const upsertChannelConfig = async ({ code, updates, userId }) => {
  const payload = { ...updates };
  if (userId) {
    payload.updatedBy = userId;
  }

  const config = await ChannelConfig.findOneAndUpdate(
    { code },
    { $set: payload },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const baseChannel = PAYMENT_CHANNELS.find(item => item.code === code);
  return applyOverrides(baseChannel, config);
};
