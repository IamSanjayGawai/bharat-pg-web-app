import { Request, Response } from 'express';
import Floor from '../models/Floor';
import Room from '../models/Room';
import Bed from '../models/Bed';

export const getFloors = async (req: Request, res: Response): Promise<void> => {
  try {
    const floors = await Floor.find({}).populate('buildingId', 'name');
    res.json(floors);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getFloorsByBuilding = async (req: Request, res: Response): Promise<void> => {
  try {
    const floors = await Floor.find({ buildingId: req.params.buildingId });
    res.json(floors);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createFloor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { floorNumber, buildingId } = req.body;
    const floor = await Floor.create({ floorNumber, buildingId });
    res.status(201).json(floor);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateFloor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { floorNumber } = req.body;
    const floor = await Floor.findById(req.params.id);

    if (floor) {
      floor.floorNumber = floorNumber || floor.floorNumber;
      const updatedFloor = await floor.save();
      res.json(updatedFloor);
    } else {
      res.status(404).json({ message: 'Floor not found' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteFloor = async (req: Request, res: Response): Promise<void> => {
  try {
    const floor = await Floor.findById(req.params.id);

    if (floor) {
      const rooms = await Room.find({ floorId: req.params.id });
      const roomIds = rooms.map(r => r._id);
      
      await floor.deleteOne();
      await Room.deleteMany({ floorId: req.params.id });
      await Bed.deleteMany({ roomId: { $in: roomIds } });
      
      res.json({ message: 'Floor removed' });
    } else {
      res.status(404).json({ message: 'Floor not found' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
