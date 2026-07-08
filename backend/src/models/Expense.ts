import mongoose, { Document, Schema } from 'mongoose';

export interface IExpense extends Document {
  category: string;
  amount: number;
  date: Date;
  description: string;
  adminId: mongoose.Types.ObjectId;
}

const expenseSchema = new Schema<IExpense>(
  {
    category: {
      type: String,
      required: true,
      enum: ['Electricity', 'Water', 'Cleaning', 'Staff Salary', 'Internet', 'Repairs', 'Food', 'Miscellaneous'],
    },
    amount: { type: Number, required: true },
    date: { type: Date, required: true, default: Date.now },
    description: { type: String, required: true },
    adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IExpense>('Expense', expenseSchema);
