import { dataPackages, telecomProviders } from '../data/dataPackages.js';

export const listProviders = (req, res) => {
  res.json({ providers: telecomProviders });
};

export const listPackages = (req, res) => {
  res.json({ packages: dataPackages });
};

export const purchaseData = (req, res) => {
  const { phone, providerId, packageId, paymentMethod } = req.body;
  const pkg = dataPackages.find(item => item.id === packageId);
  const provider = telecomProviders.find(item => item.id === providerId);

  if (!phone || !pkg || !provider || !paymentMethod) {
    return res.status(400).json({ message: 'Missing required fields' }); 
  }

  res.status(201).json({
    message: 'Data purchase initiated',
    purchase: {
      phone,
      provider,
      package: pkg,
      paymentMethod,
      status: 'pending'
    }
  });
};
