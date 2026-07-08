import React, { useEffect, useState } from 'react';
import { Wallet, Plus, Loader2, CheckCircle, Clock } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

interface RentRecord {
  _id: string;
  tenantId: {
    _id: string;
    fullName: string;
    mobileNumber: string;
  };
  month: number;
  year: number;
  amount: number;
  status: string;
  paymentDate?: string;
}

const Rent: React.FC = () => {
  const [rentRecords, setRentRecords] = useState<RentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [tenants, setTenants] = useState<any[]>([]);

  // Form
  const [selectedTenant, setSelectedTenant] = useState('');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [amount, setAmount] = useState('');

  const fetchRentRecords = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/rent');
      setRentRecords(res.data);
    } catch (error) {
      toast.error('Failed to load rent records');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTenants = async () => {
    try {
      const res = await api.get('/tenants');
      setTenants(res.data.filter((t: any) => t.status === 'Active'));
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchRentRecords();
    fetchTenants();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/rent', {
        tenantId: selectedTenant,
        month,
        year,
        amount: Number(amount)
      });
      toast.success('Rent bill generated');
      setIsModalOpen(false);
      fetchRentRecords();
    } catch (error: any) {
      toast.error('Failed to generate rent');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    try {
      await api.put(`/rent/${id}`, {
        status: 'Paid',
        paymentDate: new Date(),
        paymentMethod: 'Cash'
      });
      toast.success('Rent marked as paid');
      fetchRentRecords();
    } catch (error) {
      toast.error('Failed to update rent');
    }
  };

  const getMonthName = (monthNumber: number) => {
    const date = new Date();
    date.setMonth(monthNumber - 1);
    return date.toLocaleString('default', { month: 'short' });
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
        <h2 className="text-xl font-bold text-neutral-900">Rent History</h2>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : rentRecords.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-2xl p-8 text-center mt-8 shadow-sm">
          <Wallet className="mx-auto h-12 w-12 text-neutral-300" />
          <h3 className="mt-4 text-lg font-bold text-neutral-900">No rent records</h3>
          <p className="mt-1 text-sm text-neutral-500">Generate your first bill.</p>
        </div>
      ) : (
        <div className="space-y-3 pb-20">
          {rentRecords.map((record) => (
            <div key={record._id} className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-4 relative overflow-hidden">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">{record.tenantId?.fullName || 'Unknown'}</h3>
                  <p className="text-[10px] text-neutral-500 font-medium uppercase tracking-wider">{getMonthName(record.month)} {record.year}</p>
                </div>
                <div className="text-right">
                  <p className="text-base font-black text-neutral-900">₹{record.amount}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-3 border-t border-dashed border-neutral-200">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                  record.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {record.status === 'Paid' ? <CheckCircle className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                  {record.status}
                </span>

                {record.status === 'Pending' && (
                  <button 
                    onClick={() => handleMarkAsPaid(record._id)}
                    className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full active:scale-95 transition-transform"
                  >
                    Mark Paid
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="absolute bottom-20 right-6 h-14 w-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 transition-transform active:scale-95 z-30"
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
              <h3 className="text-lg font-bold text-neutral-900">Generate Rent Bill</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 pb-12 sm:pb-6">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1 uppercase tracking-wider">Tenant</label>
                <select required value={selectedTenant} onChange={(e) => setSelectedTenant(e.target.value)} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-medium">
                  <option value="">Select Tenant</option>
                  {tenants.map(t => <option key={t._id} value={t._id}>{t.fullName}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1 uppercase tracking-wider">Month</label>
                  <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-medium">
                    {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                      <option key={m} value={m}>{getMonthName(m)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1 uppercase tracking-wider">Year</label>
                  <input type="number" required value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-medium" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1 uppercase tracking-wider">Amount (₹)</label>
                <input type="number" required value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-black" placeholder="0" />
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full mt-4 flex items-center justify-center px-4 py-3.5 bg-primary text-white rounded-xl text-sm font-bold active:scale-95 transition-transform disabled:opacity-50">
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Generate Bill'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rent;
