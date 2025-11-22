import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  listWallets,
  createWallet,
  updateWallet,
  deleteWallet
} from '../controllers/walletsController.js';

const router = Router();

router.use(authenticate);
router.get('/', listWallets);
router.post('/', createWallet);
router.patch('/:walletId', updateWallet);
router.delete('/:walletId', deleteWallet);

export default router;
