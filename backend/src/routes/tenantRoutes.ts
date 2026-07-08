import express from 'express';
import { getTenants, addTenant, checkoutTenant, updateTenant, deleteTenant, getTenantById } from '../controllers/tenantController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(protect, getTenants)
  .post(addTenant);

router.route('/:id')
  .get(getTenantById)
  .put(updateTenant)
  .delete(deleteTenant);

router.put('/:id/checkout', checkoutTenant);

export default router;
