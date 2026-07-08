import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'staff';
  pgName: string;
  comparePassword(enteredPassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'staff'],
      default: 'admin',
    },
    pgName: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre('save', async function (next: any) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password as string, salt);
});

userSchema.methods.comparePassword = async function (enteredPassword: string) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model<IUser>('User', userSchema);
export default User;
