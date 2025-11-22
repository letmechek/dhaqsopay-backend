import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import {
  listPaymentChannels,
  createPurchaseRequest,
  listPurchaseRequests,
  getPurchaseRequest,
  submitPaymentProof,
  cancelPurchaseRequest,
  listAllPurchaseRequests,
  updatePurchaseStatus
} from '../controllers/purchaseController.js';

const router = Router();

router.use(authenticate);

router.get('/channels', listPaymentChannels);
router.get('/', listPurchaseRequests);
router.get('/admin/all', authorize('admin'), listAllPurchaseRequests);
router.post('/', createPurchaseRequest);
router.get('/:id', getPurchaseRequest);
router.patch('/:id/proof', submitPaymentProof);
router.patch('/:id/cancel', cancelPurchaseRequest);

router.patch('/:id/status', authorize('admin'), updatePurchaseStatus);

export default router;
