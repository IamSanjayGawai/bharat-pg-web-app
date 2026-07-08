import express from 'express';
import {
  getBeds,
  createBed,
  getBedsByRoom,
  updateBed,
  deleteBed,
} from '../controllers/bedController';
import { protect, adminOnly } from '../middleware/auth';

const router = express.Router();

router.route('/').get(protect, getBeds).post(protect, adminOnly, createBed);
router.route('/room/:roomId').get(protect, getBedsByRoom);
router
  .route('/:id')
  .put(protect, adminOnly, updateBed)
  .delete(protect, adminOnly, deleteBed);

export default router;
