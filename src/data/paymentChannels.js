export const PAYMENT_CHANNELS = [
  {
    code: 'EVC_SO',
    name: 'EVC Plus',
    country: 'SO',
    type: 'mobile_money',
    status: 'active',
    currencies: ['USD'],
    fxRate: 1.07,
    feePercent: 0.03,
    minAmount: 10,
    maxAmount: 5000,
    instructions:
      'Dial *770# → Send Money → enter agent number 615000000 and the amount. Keep your confirmation message handy. Estimated release within 30 minutes.',
    settlementTimeMinutes: 30
  },
  {
    code: 'SAHAL_SO',
    name: 'Sahal',
    country: 'SO',
    type: 'mobile_money',
    status: 'active',
    currencies: ['USD'],
    fxRate: 1.08,
    feePercent: 0.03,
    minAmount: 10,
    maxAmount: 3000,
    instructions:
      'Send payment to Sahal merchant 50210. Add your purchase reference if prompted. Estimated release within 45 minutes.',
    settlementTimeMinutes: 45
  },
  {
    code: 'MPESA_KE',
    name: 'M-Pesa',
    country: 'KE',
    type: 'mobile_money',
    status: 'active',
    currencies: ['KES'],
    fxRate: 160,
    feePercent: 0.03,
    minAmount: 1000,
    maxAmount: 250000,
    instructions:
      'Go to Lipa na M-PESA → Paybill 523500 → Account DhaqsoPay → enter amount. Keep the M-Pesa confirmation SMS for reference. Typical release within 20 minutes.',
    settlementTimeMinutes: 20
  },
  {
    code: 'AIRTEL_TZ',
    name: 'Airtel Money',
    country: 'TZ',
    type: 'mobile_money',
    status: 'active',
    currencies: ['TZS'],
    fxRate: 2500,
    feePercent: 0.03,
    minAmount: 20000,
    maxAmount: 4000000,
    instructions:
      'Open Airtel Money → Pay Bills → Business number 700700 → Reference DhaqsoPay. Enter your purchase reference if prompted. Estimated release within 40 minutes.',
    settlementTimeMinutes: 40
  },
  {
    code: 'TIGOPESA_TZ',
    name: 'Tigo Pesa',
    country: 'TZ',
    type: 'mobile_money',
    status: 'active',
    currencies: ['TZS'],
    fxRate: 2520,
    feePercent: 0.03,
    minAmount: 20000,
    maxAmount: 4000000,
    instructions:
      'Send to merchant 550055. Include the auto-generated reference from DhaqsoPay. Estimated release within 40 minutes.',
    settlementTimeMinutes: 40
  },
  {
    code: 'MTN_UG',
    name: 'MTN MoMo',
    country: 'UG',
    type: 'mobile_money',
    status: 'active',
    currencies: ['UGX'],
    fxRate: 3800,
    feePercent: 0.03,
    minAmount: 50000,
    maxAmount: 5000000,
    instructions:
      'Dial *165# → Pay Bill → Enter merchant code 335500 → Use your order reference. Estimated release within 60 minutes.',
    settlementTimeMinutes: 60
  },
  {
    code: 'CARD_INTL',
    name: 'Visa / Mastercard',
    country: 'MULTI',
    type: 'card',
    status: 'active',
    currencies: ['USD'],
    fxRate: 1.05,
    feePercent: 0.03,
    minAmount: 50,
    maxAmount: 2000,
    instructions:
      'A secure payment link will be generated. Complete the card payment and keep the authorization message for your records. Estimated release within 120 minutes.',
    settlementTimeMinutes: 120
  },
  {
    code: 'BANK_SWIFT',
    name: 'SWIFT Bank Transfer',
    country: 'MULTI',
    type: 'bank_transfer',
    status: 'active',
    currencies: ['USD'],
    fxRate: 1.04,
    feePercent: 0.03,
    minAmount: 500,
    maxAmount: 100000,
    instructions:
      'Use the bank details provided by support. International transfers clear once funds land in our account. Estimated release within 2 business days.',
    settlementTimeMinutes: 2880
  }
];
