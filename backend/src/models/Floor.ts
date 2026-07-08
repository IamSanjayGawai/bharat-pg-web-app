import mongoose, { Document, Schema } from 'mongoose';

export interface IFloor extends Document {
  floorNumber: string;
  buildingId: mongoose.Types.ObjectId;
  roomsCount: number;
}

const floorSchema = new Schema<IFloor>(
  {
    floorNumber: {
      type: String,
      required: true,
    },
    buildingId: {
      type: Schema.Types.ObjectId,
      ref: 'Building',
      required: true,
    },
    roomsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Floor = mongoose.model<IFloor>('Floor', floorSchema);
export default Floor;
