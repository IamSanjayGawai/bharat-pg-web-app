import { Request, Response } from 'express';
import Tenant from '../models/Tenant';
import Bed from '../models/Bed';
import Rent from '../models/Rent';

// @desc    Get all tenants
// @route   GET /api/tenants
export const getTenants = async (req: Request, res: Response) => {
  try {
    const tenants = await Tenant.find({ adminId: (req as any).user.id })
      .populate('buildingId', 'name')
      .populate('roomId', 'roomNumber type')
      .populate('bedId', 'bedNumber location')
      .sort({ createdAt: -1 });
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const rents = await Rent.find({
      adminId: (req as any).user.id,
      month: currentMonth,
      year: currentYear
    });

    const tenantsWithRent = tenants.map(tenant => {
      const tenantObj: any = tenant.toObject();
      const rentRecord = rents.find((r: any) => r.tenantId.toString() === tenant._id.toString());
      tenantObj.currentMonthRentStatus = rentRecord ? rentRecord.status : 'Pending';
      return tenantObj;
    });

    res.json(tenantsWithRent);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a new tenant
// @route   POST /api/tenants
export const addTenant = async (req: Request, res: Response) => {
  try {
    const { bedId } = req.body;

    // Check if bed is available
    const bed = await Bed.findById(bedId);
    if (!bed) {
      return res.status(404).json({ message: 'Bed not found' });
    }
    if (bed.status !== 'Available') {
      return res.status(400).json({ message: 'Bed is not available' });
    }

    const tenant = new Tenant({
      ...req.body,
      depositPaid: req.body.depositStatus === 'Paid' ? Number(req.body.depositAmount) || 0 : 0,
      adminId: (req as any).user.id,
    });

    const savedTenant = await tenant.save();

    if (req.body.feeStatus === 'Paid') {
      const currentDate = new Date();
      const rent = new Rent({
        tenantId: savedTenant._id,
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear(),
        amount: savedTenant.monthlyRent,
        status: 'Paid',
        paymentDate: currentDate,
        paymentMethod: 'Cash',
        adminId: savedTenant.adminId
      });
      await rent.save();
    }

    // Update bed status
    bed.status = 'Occupied';
    bed.tenantId = savedTenant._id as any;
    await bed.save(); // This triggers the pre-save hook on Bed which updates the Room available beds

    res.status(201).json(savedTenant);
  } catch (error: any) {
    console.error('Tenant POST error:', error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Checkout a tenant
// @route   PUT /api/tenants/:id/checkout
export const checkoutTenant = async (req: Request, res: Response) => {
  try {
    const { leavingDate, refundAmount, remarks } = req.body;
    
    const tenant = await Tenant.findOne({ _id: req.params.id, adminId: (req as any).user.id });
    
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }
    
    if (tenant.status === 'Left') {
      return res.status(400).json({ message: 'Tenant has already checked out' });
    }

    const leaveDate = leavingDate ? new Date(leavingDate) : new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isFuture = leaveDate > today;

    tenant.status = isFuture ? 'Notice Period' : 'Left';
    tenant.leavingDate = leaveDate;
    tenant.refundAmount = refundAmount || 0;
    tenant.remarks = remarks || '';
    
    await tenant.save();

    // Free the bed ONLY if they are actually leaving today or in the past
    if (!isFuture) {
      const bed = await Bed.findById(tenant.bedId);
      if (bed) {
        bed.status = 'Available';
        bed.tenantId = undefined;
        await bed.save(); // Triggers room bed availability calculation
      }
    }

    res.json(tenant);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a tenant
// @route   PUT /api/tenants/:id
export const updateTenant = async (req: Request, res: Response) => {
  try {
    const tenant = await Tenant.findOne({ _id: req.params.id, adminId: (req as any).user.id });
    
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    // Only allow updating specific fields
    const {
      fullName, mobileNumber, alternateMobile, email, aadhaarNumber, panNumber,
      dateOfBirth, gender, permanentAddress, city, state, pinCode,
      emergencyContact, depositAmount, monthlyRent
    } = req.body;

    tenant.fullName = fullName || tenant.fullName;
    tenant.mobileNumber = mobileNumber || tenant.mobileNumber;
    if (alternateMobile !== undefined) tenant.alternateMobile = alternateMobile;
    if (email !== undefined) tenant.email = email;
    tenant.aadhaarNumber = aadhaarNumber || tenant.aadhaarNumber;
    if (panNumber !== undefined) tenant.panNumber = panNumber;
    tenant.dateOfBirth = dateOfBirth || tenant.dateOfBirth;
    tenant.gender = gender || tenant.gender;
    tenant.permanentAddress = permanentAddress || tenant.permanentAddress;
    tenant.city = city || tenant.city;
    tenant.state = state || tenant.state;
    tenant.pinCode = pinCode || tenant.pinCode;
    
    if (emergencyContact) {
      tenant.emergencyContact.name = emergencyContact.name || tenant.emergencyContact.name;
      tenant.emergencyContact.relationship = emergencyContact.relationship || tenant.emergencyContact.relationship;
      tenant.emergencyContact.phoneNumber = emergencyContact.phoneNumber || tenant.emergencyContact.phoneNumber;
    }

    if (depositAmount !== undefined) tenant.depositAmount = depositAmount;
    if (monthlyRent !== undefined) tenant.monthlyRent = monthlyRent;

    const updatedTenant = await tenant.save();
    res.json(updatedTenant);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a tenant
// @route   DELETE /api/tenants/:id
export const deleteTenant = async (req: Request, res: Response) => {
  try {
    const tenant = await Tenant.findOne({ _id: req.params.id, adminId: (req as any).user.id });
    
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    // Free the bed if tenant is currently active
    if (tenant.status !== 'Left') {
      const bed = await Bed.findById(tenant.bedId);
      if (bed) {
        bed.status = 'Available';
        bed.tenantId = undefined;
        await bed.save();
      }
    }

    await tenant.deleteOne();
    res.json({ message: 'Tenant removed' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get tenant by ID
// @route   GET /api/tenants/:id
export const getTenantById = async (req: Request, res: Response) => {
  try {
    const tenant = await Tenant.findOne({ _id: req.params.id, adminId: (req as any).user.id })
      .populate('buildingId', 'name address')
      .populate('floorId', 'floorNumber')
      .populate('roomId', 'roomNumber type')
      .populate('bedId', 'bedNumber');

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    res.json(tenant);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
