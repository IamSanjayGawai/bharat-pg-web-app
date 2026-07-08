import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Loader2, TrendingUp, Users, Home, BedDouble, Wallet, Bed, LogOut, CalendarClock, CheckCircle, Zap } from 'lucide-react';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalRooms: 0,
    totalBeds: 0,
    availableBeds: 0,
    occupiedBeds: 0,
    totalTenants: 0,
    noticePeriod: 0,
    checkoutsThisMonth: 0,
    monthlyRevenue: 0,
    monthlyLightBill: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [roomsRes, bedsRes, tenantsRes, rentRes, lightBillsRes] = await Promise.all([
          api.get('/rooms'),
          api.get('/beds'),
          api.get('/tenants'),
          api.get('/rent'),
          api.get('/light-bills')
        ]);
        
        const rooms = roomsRes.data;
        const beds = bedsRes.data;
        const allTenants = tenantsRes.data;
        
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();

        const activeTenants = allTenants.filter((t: any) => t.status === 'Active' || t.status === 'Notice Period');
        const pureActive = allTenants.filter((t: any) => t.status === 'Active');
        const noticePeriod = allTenants.filter((t: any) => t.status === 'Notice Period');
        
        const checkoutsThisMonth = allTenants.filter((t: any) => {
          if (t.status === 'Left' && t.leavingDate) {
            const leaveDate = new Date(t.leavingDate);
            return leaveDate.getMonth() + 1 === currentMonth && leaveDate.getFullYear() === currentYear;
          }
          return false;
        });
        
        const currentMonthRent = rentRes.data.filter((r: any) => 
          r.status === 'Paid' && r.month === currentMonth && r.year === currentYear
        );

        const currentMonthLightBills = lightBillsRes.data.filter((b: any) => {
          const d = new Date(b.billingMonth);
          return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
        });

        let totalLightBillGenerated = 0;
        currentMonthLightBills.forEach((bill: any) => {
          totalLightBillGenerated += bill.totalAmount;
        });

        const totalBeds = beds.length;
        const occupiedBeds = activeTenants.length;
        const availableBeds = totalBeds - occupiedBeds;
        const revenue = currentMonthRent.reduce((acc: number, r: any) => acc + r.amount, 0);

        setStats({
          totalRooms: rooms.length,
          totalBeds,
          availableBeds: availableBeds > 0 ? availableBeds : 0,
          occupiedBeds,
          totalTenants: pureActive.length,
          noticePeriod: noticePeriod.length,
          checkoutsThisMonth: checkoutsThisMonth.length,
          monthlyRevenue: revenue,
          monthlyLightBill: totalLightBillGenerated
        });
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  return (
    <div className="p-3 sm:p-5 space-y-4 sm:space-y-6 bg-neutral-50/50 min-h-full">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl sm:text-2xl font-extrabold text-neutral-900 tracking-tight">Overview</h2>
        <p className="text-xs sm:text-sm font-medium text-neutral-500">Here's what's happening in your properties today.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
          {/* Revenue Card (Hero) */}
          <div className="col-span-2 md:col-span-4 bg-gradient-to-br from-neutral-900 to-neutral-800 p-3.5 sm:p-4 rounded-[1.25rem] shadow-xl relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors duration-500"></div>
            <div className="absolute -left-6 -bottom-6 w-20 h-20 bg-primary/20 rounded-full blur-xl group-hover:bg-primary/30 transition-colors duration-500"></div>
            
            <div className="relative z-10 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between mb-3">
                <div className="h-8 w-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
                  <TrendingUp className="h-4 w-4 text-green-400" />
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-neutral-300 bg-white/10 px-2 py-1 rounded-full backdrop-blur-md border border-white/5">
                  This Month
                </span>
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs font-medium text-neutral-400 mb-0.5">Monthly Rent</p>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    ₹{stats.monthlyRevenue.toLocaleString('en-IN')}
                  </h3>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-medium text-neutral-400 mb-0.5 flex items-center justify-end gap-1">
                    <Zap className="h-3 w-3 text-amber-400" />
                    Light Bill
                  </p>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-amber-400 tracking-tight">
                    + ₹{stats.monthlyLightBill.toLocaleString('en-IN')}
                  </h3>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-2 md:col-span-2 bg-white p-3 sm:p-4 rounded-2xl shadow-sm border border-neutral-100/80 hover:shadow-md transition-shadow duration-300 group flex items-center gap-4">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-indigo-100 transition-all duration-300">
              <Bed className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs font-semibold text-neutral-500 uppercase tracking-tight mb-0.5">Total Beds</p>
              <p className="text-xl sm:text-2xl font-bold text-neutral-800 leading-none">{stats.totalBeds}</p>
            </div>
          </div>

          <div className="col-span-2 md:col-span-2 bg-white p-3 sm:p-4 rounded-2xl shadow-sm border border-neutral-100/80 hover:shadow-md transition-shadow duration-300 group flex items-center gap-4">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-purple-100 transition-all duration-300">
              <BedDouble className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs font-semibold text-neutral-500 uppercase tracking-tight mb-0.5">Occupied</p>
              <p className="text-xl sm:text-2xl font-bold text-neutral-800 leading-none">{stats.occupiedBeds}</p>
            </div>
          </div>

          <div className="bg-white p-2.5 sm:p-3 rounded-2xl shadow-sm border border-neutral-100/80 hover:shadow-md transition-shadow duration-300 group flex flex-col justify-between">
            <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-blue-100 transition-all duration-300">
              <Home className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-tight mb-0.5 whitespace-nowrap">Total Rooms</p>
              <p className="text-lg sm:text-xl font-bold text-neutral-800">{stats.totalRooms}</p>
            </div>
          </div>

          <div className="bg-white p-2.5 sm:p-3 rounded-2xl shadow-sm border border-neutral-100/80 hover:shadow-md transition-shadow duration-300 group flex flex-col justify-between">
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-emerald-100 transition-all duration-300">
              <CheckCircle className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-tight mb-0.5 whitespace-nowrap">Available</p>
              <p className="text-lg sm:text-xl font-bold text-neutral-800">{stats.availableBeds}</p>
            </div>
          </div>

          <div className="bg-white p-2.5 sm:p-3 rounded-2xl shadow-sm border border-neutral-100/80 hover:shadow-md transition-shadow duration-300 group flex flex-col justify-between">
            <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-amber-100 transition-all duration-300">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-tight mb-0.5 whitespace-nowrap">Active</p>
              <p className="text-lg sm:text-xl font-bold text-neutral-800">{stats.totalTenants}</p>
            </div>
          </div>

          <div className="bg-white p-2.5 sm:p-3 rounded-2xl shadow-sm border border-neutral-100/80 hover:shadow-md transition-shadow duration-300 group flex flex-col justify-between">
            <div className="h-8 w-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-orange-100 transition-all duration-300">
              <CalendarClock className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-tight mb-0.5 whitespace-nowrap">On Notice</p>
              <p className="text-lg sm:text-xl font-bold text-neutral-800">{stats.noticePeriod}</p>
            </div>
          </div>

          <div className="bg-white p-2.5 sm:p-3 rounded-2xl shadow-sm border border-neutral-100/80 hover:shadow-md transition-shadow duration-300 group flex flex-col justify-between col-span-2 md:col-span-4 flex-row md:items-center">
            <div className="flex items-center gap-3 w-full">
              <div className="h-8 w-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-red-100 transition-all duration-300">
                <LogOut className="h-4 w-4" />
              </div>
              <div className="flex items-center justify-between flex-1">
                <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-tight whitespace-nowrap">Checkouts this month</p>
                <p className="text-lg sm:text-xl font-bold text-neutral-800">{stats.checkoutsThisMonth}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="pt-2">
        <h3 className="text-base font-extrabold text-neutral-900 mb-2 tracking-tight">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 items-stretch">
          <button onClick={() => navigate('/tenants')} className="relative overflow-hidden flex flex-col items-start justify-center gap-1.5 p-3.5 h-full w-full rounded-[1.25rem] bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 active:scale-[0.98] transition-all duration-300 group cursor-pointer">
            <div className="absolute right-[-10%] top-[-10%] w-16 h-16 bg-white/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
            <Users className="h-5 w-5 text-white/90 mb-0.5" />
            <span className="text-xs sm:text-sm font-bold text-left">New Admission</span>
          </button>
          
          <button onClick={() => navigate('/rent')} className="relative overflow-hidden flex flex-col items-start justify-center gap-1.5 p-3.5 h-full w-full rounded-[1.25rem] bg-white border border-neutral-200/80 shadow-sm hover:shadow-md hover:border-neutral-300 active:scale-[0.98] transition-all duration-300 group cursor-pointer">
            <Wallet className="h-5 w-5 text-neutral-800 mb-0.5 group-hover:text-blue-600 transition-colors" />
            <span className="text-xs sm:text-sm font-bold text-neutral-900 text-left">Collect Rent</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
