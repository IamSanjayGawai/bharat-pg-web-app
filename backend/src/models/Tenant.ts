import mongoose, { Document, Schema } from 'mongoose';

export interface ITenant extends Document {
  // Personal Details
  fullName: string;
  mobileNumber: string;
  alternateMobile?: string;
  email?: string;
  aadhaarNumber: string;
  panNumber?: string;
  dateOfBirth: Date;
  gender: string;

  // Address
  permanentAddress: string;
  city: string;
  state: string;
  pinCode: string;

  // Emergency Contact
  emergencyContact: {
    name: string;
    relationship: string;
    phoneNumber: string;
    address?: string;
  };
  emergencyContact2?: {
    name: string;
    relationship: string;
    phoneNumber: string;
    address?: string;
  };

  // Admission Details
  joiningDate: Date;
  buildingId: mongoose.Types.ObjectId;
  floorId: mongoose.Types.ObjectId;
  roomId: mongoose.Types.ObjectId;
  bedId: mongoose.Types.ObjectId;
  depositAmount: number;
  depositPaid?: number;
  monthlyRent: number;

  // Status
  status: 'Active' | 'Left' | 'Notice Period';
  leavingDate?: Date;
  refundAmount?: number;
  remarks?: string;

  adminId: mongoose.Types.ObjectId;
}

const tenantSchema = new Schema<ITenant>(
  {
    fullName: { type: String, required: true },
    mobileNumber: { type: String, required: true },
    alternateMobile: { type: String },
    email: { type: String },
    aadhaarNumber: { type: String, required: true },
    panNumber: { type: String },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, required: true },

    permanentAddress: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pinCode: { type: String, required: true },

    emergencyContact: {
      name: { type: String, required: true },
      relationship: { type: String, required: true },
      phoneNumber: { type: String, required: true },
      address: { type: String },
    },

    emergencyContact2: {
      name: { type: String },
      relationship: { type: String },
      phoneNumber: { type: String },
      address: { type: String },
    },

    joiningDate: { type: Date, required: true, default: Date.now },
    buildingId: { type: Schema.Types.ObjectId, ref: 'Building', required: true },
    floorId: { type: Schema.Types.ObjectId, ref: 'Floor', required: true },
    roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
    bedId: { type: Schema.Types.ObjectId, ref: 'Bed', required: true },
    depositAmount: { type: Number, required: true },
    depositPaid: { type: Number, default: 0 },
    monthlyRent: { type: Number, required: true },

    status: {
      type: String,
      enum: ['Active', 'Left', 'Notice Period'],
      default: 'Active',
    },
    leavingDate: { type: Date },
    refundAmount: { type: Number },
    remarks: { type: String },

    adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export default mongoose.model<ITenant>('Tenant', tenantSchema);
