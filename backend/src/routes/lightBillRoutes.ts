import express from 'express';
import { generateBill, getBillsByRoom, updatePaymentStatus, getAllBills } from '../controllers/lightBillController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.get('/', protect, getAllBills);
router.post('/calculate', protect, generateBill);
router.get('/room/:roomId', protect, getBillsByRoom);
router.put('/:billId/tenant/:tenantId/pay', protect, updatePaymentStatus);

export default router;
