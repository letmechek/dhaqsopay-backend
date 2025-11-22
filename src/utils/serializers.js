export const formatAccount = account => {
  const obj = account.toObject({ getters: true, virtuals: true });
  return {
    id: obj._id.toString(),
    type: obj.type,
    name: obj.name,
    number: obj.number,
    balance: obj.balance,
    currency: obj.currency,
    isDefault: obj.isDefault,
    lastSyncedAt: obj.lastSyncedAt
  };
};

export const formatTransaction = transaction => {
  const obj = transaction.toObject({ getters: true, virtuals: true });
  return {
    id: obj._id.toString(),
    status: obj.status,
    amount: obj.amount,
    fee: obj.fee,
    total: obj.total,
    reference: obj.reference,
    providerReference: obj.providerReference,
    createdAt: obj.createdAt,
    type: obj.amount >= 0 ? 'debit' : 'credit',
    fromAccount: obj.fromAccount
      ? {
          id: obj.fromAccount._id?.toString(),
          name: obj.fromAccount.name,
          number: obj.fromAccount.number,
          type: obj.fromAccount.type
        }
      : null,
    toAccount: obj.toAccount
      ? {
          id: obj.toAccount._id?.toString(),
          name: obj.toAccount.name,
          number: obj.toAccount.number,
          type: obj.toAccount.type
        }
      : null
  };
};

export const formatPurchaseRequest = purchase => {
  const obj = purchase.toObject({ getters: true, virtuals: true });
  const hasUserDetails = obj.user && typeof obj.user === 'object' && 'fullName' in obj.user;
  const hasReviewerDetails =
    obj.reviewedBy && typeof obj.reviewedBy === 'object' && 'fullName' in obj.reviewedBy;

  return {
    id: obj._id.toString(),
    status: obj.status,
    amountFiat: obj.amountFiat,
    fiatCurrency: obj.fiatCurrency,
    usdtAmount: obj.usdtAmount,
    rate: obj.rate,
    feeFiat: obj.feeFiat,
    feePercent: obj.feePercent,
    netAmountFiat: obj.netAmountFiat,
    walletAddress: obj.walletAddress,
    savedWalletId: obj.savedWalletId ? obj.savedWalletId.toString() : null,
    walletLabel: obj.walletLabel,
    walletSource: obj.walletSource,
    network: obj.network,
    cardDetails: obj.cardDetails
      ? {
          brand: obj.cardDetails.brand,
          last4: obj.cardDetails.last4,
          holder: obj.cardDetails.holder,
          expiryMonth: obj.cardDetails.expiryMonth,
          expiryYear: obj.cardDetails.expiryYear,
          email: obj.cardDetails.email
        }
      : null,
    customerPhone: obj.customerPhone,
    paymentReference: obj.paymentReference,
    notes: obj.notes,
    proof: obj.proof
      ? {
          type: obj.proof.type,
          value: obj.proof.value,
          submittedAt: obj.proof.submittedAt
        }
      : null,
    paymentChannel: obj.paymentChannelSnapshot,
    isActionable: obj.isActionable,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
    user: hasUserDetails
      ? {
          id: obj.user._id?.toString(),
          fullName: obj.user.fullName,
          phone: obj.user.phone,
          country: obj.user.country
        }
      : undefined,
    reviewedBy: hasReviewerDetails
      ? {
          id: obj.reviewedBy._id?.toString(),
          fullName: obj.reviewedBy.fullName,
          phone: obj.reviewedBy.phone
        }
      : null,
    reviewedAt: obj.reviewedAt,
    releasedAt: obj.releasedAt,
    estimatedReleaseMinutes: obj.estimatedReleaseMinutes
  };
};

export const formatChatThread = thread => {
  if (!thread) return null;
  const obj =
    typeof thread.toObject === 'function'
      ? thread.toObject({ getters: true, virtuals: true })
      : thread;

  const hasUser =
    obj.user && typeof obj.user === 'object' && ('fullName' in obj.user || '_id' in obj.user);

  return {
    id: obj._id?.toString?.() ?? obj.id ?? null,
    subject: obj.subject,
    status: obj.status,
    lastMessageAt: obj.lastMessageAt,
    lastMessageSnippet: obj.lastMessageSnippet,
    lastSender: obj.lastSender,
    messagesCount: obj.messagesCount ?? 0,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
    user: hasUser
      ? {
          id: obj.user._id?.toString?.() ?? obj.user.id ?? null,
          fullName: obj.user.fullName,
          phone: obj.user.phone,
          country: obj.user.country
        }
      : undefined
  };
};

export const formatChatMessage = message => {
  if (!message) return null;
  const obj =
    typeof message.toObject === 'function'
      ? message.toObject({ getters: true, virtuals: true })
      : message;

  return {
    id: obj._id?.toString?.() ?? obj.id ?? null,
    threadId: obj.thread?._id?.toString?.() ?? obj.thread?.toString?.() ?? obj.threadId ?? null,
    senderType: obj.senderType,
    sender: obj.sender ? obj.sender.toString?.() ?? obj.sender : null,
    body: obj.body,
    createdAt: obj.createdAt,
    readAt: obj.readAt
  };
};
