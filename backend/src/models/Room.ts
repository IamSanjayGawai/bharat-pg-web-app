import mongoose, { Document, Schema } from 'mongoose';

export interface IRoom extends Document {
  roomNumber: string;
  floorId: mongoose.Types.ObjectId;
  buildingId: mongoose.Types.ObjectId;
  type: string;
  totalBeds: number;
  bedroomBedsCount: number;
  hallBedsCount: number;
  occupiedBeds: number;
  availableBeds: number;
  monthlyRent: number;
  status: 'Available' | 'Full' | 'Maintenance';
}

const roomSchema = new Schema<IRoom>(
  {
    roomNumber: {
      type: String,
      required: true,
    },
    floorId: {
      type: Schema.Types.ObjectId,
      ref: 'Floor',
      required: true,
    },
    buildingId: {
      type: Schema.Types.ObjectId,
      ref: 'Building',
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    totalBeds: {
      type: Number,
      required: true,
    },
    bedroomBedsCount: {
      type: Number,
      default: 0,
    },
    hallBedsCount: {
      type: Number,
      default: 0,
    },
    occupiedBeds: {
      type: Number,
      default: 0,
    },
    availableBeds: {
      type: Number,
      default: 0,
    },
    monthlyRent: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['Available', 'Full', 'Maintenance'],
      default: 'Available',
    },
  },
  {
    timestamps: true,
  }
);



const Room = mongoose.model<IRoom>('Room', roomSchema);
export default Room;
