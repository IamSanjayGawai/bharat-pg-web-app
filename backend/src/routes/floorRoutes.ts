import express from 'express';
import {
  getFloors,
  createFloor,
  getFloorsByBuilding,
  updateFloor,
  deleteFloor,
} from '../controllers/floorController';
import { protect, adminOnly } from '../middleware/auth';

const router = express.Router();

router.route('/').get(protect, getFloors).post(protect, adminOnly, createFloor);
router.route('/building/:buildingId').get(protect, getFloorsByBuilding);
router
  .route('/:id')
  .put(protect, adminOnly, updateFloor)
  .delete(protect, adminOnly, deleteFloor);

export default router;
