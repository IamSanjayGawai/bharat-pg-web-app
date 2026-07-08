import mongoose, { Document, Schema } from 'mongoose';

export interface IRent extends Document {
  tenantId: mongoose.Types.ObjectId;
  month: number;
  year: number;
  amount: number;
  status: 'Paid' | 'Pending' | 'Partial';
  paymentDate?: Date;
  paymentMethod?: string;
  transactionId?: string;
  receiptNumber?: string;
  adminId: mongoose.Types.ObjectId;
}

const rentSchema = new Schema<IRent>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['Paid', 'Pending', 'Partial'],
      default: 'Pending',
    },
    paymentDate: { type: Date },
    paymentMethod: { type: String },
    transactionId: { type: String },
    receiptNumber: { type: String },
    adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IRent>('Rent', rentSchema);
