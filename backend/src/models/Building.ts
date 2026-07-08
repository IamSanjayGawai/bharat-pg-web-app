import mongoose, { Document, Schema } from 'mongoose';

export interface IBuilding extends Document {
  name: string;
  address: string;
  floorsCount: number;
}

const buildingSchema = new Schema<IBuilding>(
  {
    name: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    floorsCount: {
      type: Number,
      required: true,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

const Building = mongoose.model<IBuilding>('Building', buildingSchema);
export default Building;
