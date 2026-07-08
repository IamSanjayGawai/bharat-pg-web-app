import mongoose, { Document, Schema } from 'mongoose';

export interface ILightBill extends Document {
  roomId: mongoose.Types.ObjectId;
  buildingId: mongoose.Types.ObjectId;
  billingMonth: Date; // A date representing the 1st of the month, e.g., '2023-06-01'
  totalAmount: number;
  tenantSplits: {
    tenantId: mongoose.Types.ObjectId;
    activeDays: number;
    splitAmount: number;
    status: 'Paid' | 'Unpaid';
  }[];
}

const lightBillSchema = new Schema<ILightBill>(
  {
    roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
    buildingId: { type: Schema.Types.ObjectId, ref: 'Building', required: true },
    billingMonth: { type: Date, required: true },
    totalAmount: { type: Number, required: true },
    tenantSplits: [
      {
        tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
        activeDays: { type: Number, required: true },
        splitAmount: { type: Number, required: true },
        status: { type: String, enum: ['Paid', 'Unpaid'], default: 'Unpaid' },
      },
    ],
  },
  { timestamps: true }
);

// Ensure only one bill per room per month
lightBillSchema.index({ roomId: 1, billingMonth: 1 }, { unique: true });

export default mongoose.model<ILightBill>('LightBill', lightBillSchema);
