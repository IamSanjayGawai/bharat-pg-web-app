import { Request, Response } from 'express';
import Bed from '../models/Bed';
import Room from '../models/Room';

export const getBeds = async (req: Request, res: Response): Promise<void> => {
  try {
    const beds = await Bed.find({})
      .populate('roomId', 'roomNumber')
      .populate('tenantId', 'name');
    res.json(beds);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getBedsByRoom = async (req: Request, res: Response): Promise<void> => {
  try {
    const beds = await Bed.find({ roomId: req.params.roomId })
      .populate('tenantId', 'fullName monthlyRent rent status');
    res.json(beds);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createBed = async (req: Request, res: Response): Promise<void> => {
  try {
    const { bedNumber, roomId, rent, notes } = req.body;
    
    const bed = await Bed.create({
      bedNumber,
      roomId,
      rent,
      notes,
    });

    res.status(201).json(bed);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateBed = async (req: Request, res: Response): Promise<void> => {
  try {
    const { bedNumber, status, rent, notes } = req.body;
    const bed = await Bed.findById(req.params.id);

    if (bed) {
      bed.bedNumber = bedNumber || bed.bedNumber;
      if (status) bed.status = status;
      bed.rent = rent || bed.rent;
      bed.notes = notes !== undefined ? notes : bed.notes;

      const updatedBed = await bed.save();
      res.json(updatedBed);
    } else {
      res.status(404).json({ message: 'Bed not found' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteBed = async (req: Request, res: Response): Promise<void> => {
  try {
    const bed = await Bed.findById(req.params.id);

    if (bed) {
      if (bed.status === 'Occupied') {
        res.status(400).json({ message: 'Cannot delete an occupied bed' });
        return;
      }
      await bed.deleteOne();
      res.json({ message: 'Bed removed' });
    } else {
      res.status(404).json({ message: 'Bed not found' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
