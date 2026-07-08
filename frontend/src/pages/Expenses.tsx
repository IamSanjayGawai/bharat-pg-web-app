import React, { useEffect, useState } from 'react';
import { Receipt, Plus, Loader2, Trash2 } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

interface Expense {
  _id: string;
  category: string;
  amount: number;
  date: string;
  description: string;
}

const Expenses: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [category, setCategory] = useState('Electricity');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');

  const fetchExpenses = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/expenses');
      setExpenses(res.data);
    } catch (error) {
      toast.error('Failed to load expenses');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/expenses', {
        category,
        amount: Number(amount),
        date,
        description
      });
      toast.success('Expense recorded');
      setIsModalOpen(false);
      setAmount('');
      setDescription('');
      fetchExpenses();
    } catch (error: any) {
      toast.error('Failed to record expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      toast.success('Expense deleted');
      fetchExpenses();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const categories = ['Electricity', 'Water', 'Cleaning', 'Staff Salary', 'Internet', 'Repairs', 'Food', 'Miscellaneous'];
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
        <h2 className="text-xl font-bold text-neutral-900">Expenses</h2>
      </div>

      <div className="bg-red-50 p-6 rounded-[2rem] border border-red-100 shadow-sm flex flex-col items-center justify-center">
        <p className="text-xs font-bold text-red-400 uppercase tracking-wider">Total Expenses</p>
        <p className="mt-1 text-4xl font-black text-red-600">₹{totalExpenses.toLocaleString()}</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : expenses.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-2xl p-8 text-center mt-8 shadow-sm">
          <Receipt className="mx-auto h-12 w-12 text-neutral-300" />
          <h3 className="mt-4 text-lg font-bold text-neutral-900">No expenses</h3>
          <p className="mt-1 text-sm text-neutral-500">Record your first expense.</p>
        </div>
      ) : (
        <div className="space-y-3 pb-20 mt-4">
          {expenses.map((expense) => (
            <div key={expense._id} className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-4 relative overflow-hidden flex items-center justify-between">
              <div className="min-w-0">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-neutral-100 text-neutral-600 mb-1">
                  {expense.category}
                </span>
                <p className="text-sm text-neutral-500 truncate max-w-[200px]">{expense.description}</p>
                <p className="text-xs text-neutral-400 mt-1">{new Date(expense.date).toLocaleDateString()}</p>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className="text-base font-black text-neutral-900">₹{expense.amount}</span>
                <button 
                  onClick={() => handleDelete(expense._id)}
                  className="h-8 w-8 bg-red-50 text-red-500 rounded-full flex items-center justify-center hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-20 right-6 h-14 w-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 transition-transform active:scale-95 z-30 sm:absolute sm:bottom-20 sm:right-6"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Slide-up Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white w-full sm:max-w-md rounded-t-[2rem] sm:rounded-2xl shadow-2xl animate-in slide-in-from-bottom-full duration-300 pb-safe">
            <div className="w-12 h-1.5 bg-neutral-200 rounded-full mx-auto mt-4 sm:hidden"></div>
            <div className="px-6 py-4 border-b border-neutral-100">
              <h3 className="text-lg font-bold text-neutral-900">Record Expense</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 pb-12 sm:pb-6">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1 uppercase tracking-wider">Category</label>
                <select required value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-medium">
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1 uppercase tracking-wider">Date</label>
                  <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-medium" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1 uppercase tracking-wider">Amount (₹)</label>
                  <input type="number" required value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-black" placeholder="0" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1 uppercase tracking-wider">Description</label>
                <input type="text" required value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm" placeholder="Details..." />
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full mt-4 flex items-center justify-center px-4 py-3.5 bg-primary text-white rounded-xl text-sm font-bold active:scale-95 transition-transform disabled:opacity-50">
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Save Expense'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
