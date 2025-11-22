import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { listProviders, listPackages, purchaseData } from '../controllers/dataController.js';

const router = Router();

router.get('/providers', listProviders);
router.get('/packages', authenticate, listPackages);
router.post('/purchase', authenticate, purchaseData);

export default router;
