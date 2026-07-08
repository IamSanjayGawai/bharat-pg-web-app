import { Request, Response } from 'express';
import Expense from '../models/Expense';

// @desc    Get all expenses
// @route   GET /api/expenses
export const getExpenses = async (req: Request, res: Response) => {
  try {
    const expenses = await Expense.find({ adminId: (req as any).user.id }).sort({ date: -1 });
    res.json(expenses);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add expense
// @route   POST /api/expenses
export const addExpense = async (req: Request, res: Response) => {
  try {
    const expense = new Expense({
      ...req.body,
      adminId: (req as any).user.id,
    });
    const savedExpense = await expense.save();
    res.status(201).json(savedExpense);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
export const deleteExpense = async (req: Request, res: Response) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, adminId: (req as any).user.id });
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    res.json({ message: 'Expense deleted' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
