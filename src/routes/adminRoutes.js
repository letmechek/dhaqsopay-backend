import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import {
  getAdminSummary,
  getRecentActivity,
  listAdminPurchases,
  getAdminPurchase,
  listAdminChannels,
  listAdminCustomers,
  listAdminTransactions,
  updateAdminChannel
} from '../controllers/adminController.js';
import { updatePurchaseStatus } from '../controllers/purchaseController.js';
import {
  listSupportThreads,
  getSupportThreadById,
  postSupportThreadMessage,
  updateSupportThreadStatusAdmin
} from '../controllers/adminSupportController.js';

const router = Router();

router.use(authenticate);
router.use(authorize('admin'));

router.get('/summary', getAdminSummary);
router.get('/activity', getRecentActivity);

router.get('/purchases', listAdminPurchases);
router.get('/purchases/:id', getAdminPurchase);
router.patch('/purchases/:id/status', updatePurchaseStatus);

router.get('/channels', listAdminChannels);
router.patch('/channels/:code', updateAdminChannel);
router.get('/customers', listAdminCustomers);
router.get('/transactions', listAdminTransactions);
router.get('/support/threads', listSupportThreads);
router.get('/support/threads/:id', getSupportThreadById);
router.post('/support/threads/:id/messages', postSupportThreadMessage);
router.patch('/support/threads/:id/status', updateSupportThreadStatusAdmin);

export default router;
