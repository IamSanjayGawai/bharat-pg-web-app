import express from 'express';
import { getRentRecords, addRentRecord, updateRentRecord } from '../controllers/rentController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getRentRecords)
  .post(addRentRecord);

router.route('/:id')
  .put(updateRentRecord);

export default router;
