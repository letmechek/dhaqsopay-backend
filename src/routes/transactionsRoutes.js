import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  listTransactions,
  getTransaction,
  createTransaction,
  calculateFee
} from '../controllers/transactionsController.js';

const router = Router();

router.use(authenticate);
router.get('/', listTransactions);
router.get('/:id', getTransaction);
router.post('/', createTransaction);
router.post('/calculate-fee', calculateFee);

export default router;
