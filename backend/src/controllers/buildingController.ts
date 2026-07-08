import { Request, Response } from 'express';
import Building from '../models/Building';
import Floor from '../models/Floor';
import Room from '../models/Room';

export const getBuildings = async (req: Request, res: Response): Promise<void> => {
  try {
    const buildings = await Building.find({});
    res.json(buildings);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createBuilding = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, address, floorsCount } = req.body;
    const building = await Building.create({ name, address, floorsCount });
    res.status(201).json(building);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getBuildingById = async (req: Request, res: Response): Promise<void> => {
  try {
    const building = await Building.findById(req.params.id);
    if (building) {
      res.json(building);
    } else {
      res.status(404).json({ message: 'Building not found' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateBuilding = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, address, floorsCount } = req.body;
    const building = await Building.findById(req.params.id);

    if (building) {
      building.name = name || building.name;
      building.address = address || building.address;
      building.floorsCount = floorsCount || building.floorsCount;

      const updatedBuilding = await building.save();
      res.json(updatedBuilding);
    } else {
      res.status(404).json({ message: 'Building not found' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteBuilding = async (req: Request, res: Response): Promise<void> => {
  try {
    const building = await Building.findById(req.params.id);

    if (building) {
      await building.deleteOne();
      // Ideally, also delete associated floors, rooms, and beds here or use a pre-remove hook
      await Floor.deleteMany({ buildingId: req.params.id });
      await Room.deleteMany({ buildingId: req.params.id });
      res.json({ message: 'Building removed' });
    } else {
      res.status(404).json({ message: 'Building not found' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
