import { Request, Response } from 'express';
import Rent from '../models/Rent';

// @desc    Get all rent records
// @route   GET /api/rent
export const getRentRecords = async (req: Request, res: Response) => {
  try {
    const rentRecords = await Rent.find({ adminId: (req as any).user.id })
      .populate('tenantId', 'fullName mobileNumber')
      .sort({ createdAt: -1 });
    res.json(rentRecords);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add rent record
// @route   POST /api/rent
export const addRentRecord = async (req: Request, res: Response) => {
  try {
    const rent = new Rent({
      ...req.body,
      adminId: (req as any).user.id,
    });
    const savedRent = await rent.save();
    res.status(201).json(savedRent);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update rent record (e.g. mark as Paid)
// @route   PUT /api/rent/:id
export const updateRentRecord = async (req: Request, res: Response) => {
  try {
    const rent = await Rent.findOneAndUpdate(
      { _id: req.params.id, adminId: (req as any).user.id },
      req.body,
      { new: true }
    );
    if (!rent) {
      return res.status(404).json({ message: 'Rent record not found' });
    }
    res.json(rent);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
