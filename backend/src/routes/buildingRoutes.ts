import express from 'express';
import {
  getBuildings,
  createBuilding,
  getBuildingById,
  updateBuilding,
  deleteBuilding,
} from '../controllers/buildingController';
import { protect, adminOnly } from '../middleware/auth';

const router = express.Router();

router.route('/').get(protect, getBuildings).post(protect, adminOnly, createBuilding);
router
  .route('/:id')
  .get(protect, getBuildingById)
  .put(protect, adminOnly, updateBuilding)
  .delete(protect, adminOnly, deleteBuilding);

export default router;
