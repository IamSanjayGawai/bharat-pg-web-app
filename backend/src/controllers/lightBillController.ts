import { Request, Response } from 'express';
import LightBill from '../models/LightBill';
import Tenant from '../models/Tenant';
import Room from '../models/Room';

export const generateBill = async (req: Request, res: Response) => {
  try {
    const { roomId, buildingId, month, year, totalAmount } = req.body;

    if (!roomId || !buildingId || !month || !year || !totalAmount) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Last day of the month

    // Find tenants who lived in this room at any point during the month
    const tenants = await Tenant.find({
      roomId,
      joiningDate: { $lte: endDate },
      $or: [{ leavingDate: { $exists: false } }, { leavingDate: null }, { leavingDate: { $gte: startDate } }],
    });

    if (tenants.length === 0) {
      return res.status(400).json({ message: 'No tenants occupied this room during this month' });
    }

    let totalActiveDays = 0;
    const tenantStays = tenants.map((tenant) => {
      const tenantStart = tenant.joiningDate > startDate ? tenant.joiningDate : startDate;
      const tenantEnd = tenant.leavingDate && tenant.leavingDate < endDate ? tenant.leavingDate : endDate;

      // Calculate difference in milliseconds and convert to days (inclusive)
      const diffTime = Math.abs(tenantEnd.getTime() - tenantStart.getTime());
      const activeDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      
      totalActiveDays += activeDays;

      return {
        tenantId: tenant._id,
        tenantName: tenant.fullName,
        activeDays,
      };
    });

    const tenantSplits = tenantStays.map((stay) => ({
      tenantId: stay.tenantId,
      activeDays: stay.activeDays,
      splitAmount: Math.round((stay.activeDays / totalActiveDays) * totalAmount),
      status: 'Unpaid' as 'Paid' | 'Unpaid',
    }));

    const billingMonth = new Date(year, month - 1, 1);

    // Upsert the bill for this room and month
    const lightBill = await LightBill.findOneAndUpdate(
      { roomId, billingMonth },
      {
        roomId,
        buildingId,
        billingMonth,
        totalAmount,
        tenantSplits,
      },
      { new: true, upsert: true }
    ).populate('tenantSplits.tenantId', 'fullName mobileNumber');

    res.status(200).json(lightBill);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const getBillsByRoom = async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const bills = await LightBill.find({ roomId })
      .populate('tenantSplits.tenantId', 'fullName mobileNumber')
      .sort({ billingMonth: -1 });
    res.status(200).json(bills);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const updatePaymentStatus = async (req: Request, res: Response) => {
  try {
    const { billId, tenantId } = req.params;
    const { status } = req.body;

    const bill = await LightBill.findOneAndUpdate(
      { _id: billId, 'tenantSplits.tenantId': tenantId },
      { $set: { 'tenantSplits.$.status': status } },
      { new: true }
    ).populate('tenantSplits.tenantId', 'fullName mobileNumber');

    if (!bill) {
      return res.status(404).json({ message: 'Bill or tenant not found' });
    }

    res.status(200).json(bill);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const getAllBills = async (req: Request, res: Response) => {
  try {
    const bills = await LightBill.find()
      .populate('roomId', 'roomNumber type')
      .populate('tenantSplits.tenantId', 'fullName');
    res.json(bills);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
