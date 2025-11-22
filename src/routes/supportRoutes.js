import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getSupportThread,
  postSupportMessage,
  updateSupportThreadStatus
} from '../controllers/supportController.js';

const router = Router();

router.use(authenticate);

router.get('/thread', getSupportThread);
router.post('/thread/messages', postSupportMessage);
router.patch('/thread/status', updateSupportThreadStatus);

export default router;
