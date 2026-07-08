import express from 'express';
import { getExpenses, addExpense, deleteExpense } from '../controllers/expenseController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getExpenses)
  .post(addExpense);

router.route('/:id')
  .delete(deleteExpense);

export default router;
