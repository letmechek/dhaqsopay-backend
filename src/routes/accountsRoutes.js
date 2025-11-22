import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { listAccounts, createAccount, removeAccount, getBalance } from '../controllers/accountsController.js';

const router = Router();

router.use(authenticate);
router.route('/').get(listAccounts).post(createAccount);
router.route('/:id').delete(removeAccount);
router.get('/:id/balance', getBalance);

export default router;
