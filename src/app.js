import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import 'express-async-errors';

import authRoutes from './routes/authRoutes.js';
import accountsRoutes from './routes/accountsRoutes.js';
import transactionsRoutes from './routes/transactionsRoutes.js';
import dataRoutes from './routes/dataRoutes.js';
import purchaseRoutes from './routes/purchaseRoutes.js';
import walletsRoutes from './routes/walletsRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import supportRoutes from './routes/supportRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

export const createApp = () => {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(morgan('dev'));

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/accounts', accountsRoutes);
  app.use('/api/transactions', transactionsRoutes);
  app.use('/api/data', dataRoutes);
  app.use('/api/purchases', purchaseRoutes);
  app.use('/api/wallets', walletsRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/support', supportRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
