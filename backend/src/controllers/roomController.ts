import { Request, Response } from 'express';
import Room from '../models/Room';
import Bed from '../models/Bed';
import Floor from '../models/Floor';

export const getRooms = async (req: Request, res: Response): Promise<void> => {
  try {
    const rooms = await Room.find({})
      .populate('floorId', 'floorNumber')
      .populate('buildingId', 'name')
      .lean();

    const roomIds = rooms.map(r => r._id);
    const beds = await Bed.find({ roomId: { $in: roomIds } }).lean();

    const roomsWithBeds = rooms.map(room => {
      const roomBeds = beds.filter(b => b.roomId.toString() === room._id.toString());
      const availableBeds = roomBeds.filter(b => b.status === 'Available').length;
      const occupiedBeds = roomBeds.filter(b => b.status === 'Occupied').length;
      return {
        ...room,
        totalBeds: roomBeds.length > 0 ? roomBeds.length : room.totalBeds,
        availableBeds: roomBeds.length > 0 ? availableBeds : room.totalBeds,
        occupiedBeds: roomBeds.length > 0 ? occupiedBeds : 0,
      };
    });

    res.json(roomsWithBeds);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getRoomsByFloor = async (req: Request, res: Response): Promise<void> => {
  try {
    const rooms = await Room.find({ floorId: req.params.floorId }).lean();
    
    const roomIds = rooms.map(r => r._id);
    const beds = await Bed.find({ roomId: { $in: roomIds } }).lean();

    const roomsWithBeds = rooms.map(room => {
      const roomBeds = beds.filter(b => b.roomId.toString() === room._id.toString());
      const availableBeds = roomBeds.filter(b => b.status === 'Available').length;
      const occupiedBeds = roomBeds.filter(b => b.status === 'Occupied').length;
      return {
        ...room,
        totalBeds: roomBeds.length > 0 ? roomBeds.length : room.totalBeds,
        availableBeds: roomBeds.length > 0 ? availableBeds : room.totalBeds,
        occupiedBeds: roomBeds.length > 0 ? occupiedBeds : 0,
      };
    });

    res.json(roomsWithBeds);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createRoom = async (req: Request, res: Response): Promise<void> => {
  try {
    const { roomNumber, floorId, buildingId, type, bedroomBedsCount = 0, hallBedsCount = 0, monthlyRent } = req.body;
    
    // Automatically calculate total beds from categorized beds
    const totalBeds = bedroomBedsCount + hallBedsCount;
    
    // If user passed totalBeds directly (fallback), use that. Otherwise use calculated.
    const finalTotalBeds = totalBeds > 0 ? totalBeds : (req.body.totalBeds || 1);

    const room = await Room.create({
      roomNumber,
      floorId,
      buildingId,
      type,
      totalBeds: finalTotalBeds,
      bedroomBedsCount,
      hallBedsCount,
      monthlyRent,
    });

    // Generate Bed Documents
    const bedsToCreate = [];
    let currentBedNumber = 1;

    // Generate Bedroom beds
    for (let i = 0; i < bedroomBedsCount; i++) {
      bedsToCreate.push({
        bedNumber: `Bedroom - Bed ${i + 1}`,
        roomId: room._id,
        location: 'Bedroom',
        rent: monthlyRent, // Defaulting bed rent to room rent for simplicity
      });
      currentBedNumber++;
    }

    // Generate Hall beds
    for (let i = 0; i < hallBedsCount; i++) {
      bedsToCreate.push({
        bedNumber: `Hall - Bed ${i + 1}`,
        roomId: room._id,
        location: 'Hall',
        rent: monthlyRent,
      });
      currentBedNumber++;
    }

    // Fallback if no specific beds were provided (standard room)
    if (bedroomBedsCount === 0 && hallBedsCount === 0) {
      for (let i = 0; i < finalTotalBeds; i++) {
        bedsToCreate.push({
          bedNumber: `Bed ${i + 1}`,
          roomId: room._id,
          location: 'Standard',
          rent: monthlyRent,
        });
      }
    }

    await Bed.insertMany(bedsToCreate);

    // Automatically update the floor's room count
    await Floor.findByIdAndUpdate(floorId, { $inc: { roomsCount: 1 } });

    res.status(201).json(room);
  } catch (error: any) {
    console.error("CREATE ROOM ERROR:", error);
    res.status(500).json({ message: error.message, stack: error.stack });
  }
};

export const updateRoom = async (req: Request, res: Response): Promise<void> => {
  try {
    const { roomNumber, type, totalBeds, monthlyRent, status } = req.body;
    const room = await Room.findById(req.params.id);

    if (room) {
      room.roomNumber = roomNumber || room.roomNumber;
      room.type = type || room.type;
      room.totalBeds = totalBeds || room.totalBeds;
      room.monthlyRent = monthlyRent || room.monthlyRent;
      if (status) room.status = status;

      const updatedRoom = await room.save();
      res.json(updatedRoom);
    } else {
      res.status(404).json({ message: 'Room not found' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteRoom = async (req: Request, res: Response): Promise<void> => {
  try {
    const room = await Room.findById(req.params.id);

    if (room) {
      await room.deleteOne();
      await Bed.deleteMany({ roomId: req.params.id });
      await Floor.findByIdAndUpdate(room.floorId, { $inc: { roomsCount: -1 } });
      res.json({ message: 'Room removed' });
    } else {
      res.status(404).json({ message: 'Room not found' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
