import mongoose, { Document, Schema } from 'mongoose';

export interface IBed extends Document {
  bedNumber: string;
  roomId: mongoose.Types.ObjectId;
  status: 'Available' | 'Occupied' | 'Reserved';
  location: 'Bedroom' | 'Hall' | 'Standard';
  tenantId?: mongoose.Types.ObjectId;
  rent: number;
  notes?: string;
}

const bedSchema = new Schema<IBed>(
  {
    bedNumber: {
      type: String,
      required: true,
    },
    roomId: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
    },
    status: {
      type: String,
      enum: ['Available', 'Occupied', 'Reserved'],
      default: 'Available',
    },
    location: {
      type: String,
      enum: ['Bedroom', 'Hall', 'Standard'],
      default: 'Standard',
    },
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
    },
    rent: {
      type: Number,
      required: true,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Bed = mongoose.model<IBed>('Bed', bedSchema);
export default Bed;
