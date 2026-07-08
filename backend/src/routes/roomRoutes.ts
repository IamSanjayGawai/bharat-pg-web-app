import express from 'express';
import {
  getRooms,
  createRoom,
  getRoomsByFloor,
  updateRoom,
  deleteRoom,
} from '../controllers/roomController';
import { protect, adminOnly } from '../middleware/auth';

const router = express.Router();

router.route('/').get(protect, getRooms).post(protect, adminOnly, createRoom);
router.route('/floor/:floorId').get(protect, getRoomsByFloor);
router
  .route('/:id')
  .put(protect, adminOnly, updateRoom)
  .delete(protect, adminOnly, deleteRoom);

export default router;
