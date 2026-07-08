import React, { useEffect, useState } from 'react';

import api from '../services/api';
import { Loader2, TrendingUp, Users, Home, BedDouble, Bed, LogOut, CalendarClock, CheckCircle, Zap } from 'lucide-react';

const Dashboard: React.FC = () => {
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
        const [roomsRes, tenantsRes, rentRes, lightBillsRes] = await Promise.all([
          api.get('/rooms'),
          api.get('/tenants'),
          api.get('/rent'),
          api.get('/light-bills')
        ]);
        
        const rooms = roomsRes.data;
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

        const totalBeds = rooms.reduce((sum: number, r: any) => sum + (r.totalBeds || 0), 0);
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
    <div className="p-3 space-y-3 bg-neutral-50/50 h-full flex flex-col overflow-hidden">
      <div className="flex flex-col shrink-0">
        <h2 className="text-xl font-extrabold text-neutral-900 tracking-tight">Overview</h2>
        <p className="text-xs font-medium text-neutral-500">Here's what's happening today.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 flex-1 min-h-0">
          {/* Revenue Card (Hero) */}
          <div className="col-span-2 md:col-span-4 bg-gradient-to-br from-neutral-900 via-neutral-800 to-black p-3.5 rounded-2xl shadow-lg relative overflow-hidden group border border-white/10 flex flex-col justify-between h-full">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/20 rounded-full blur-2xl group-hover:bg-primary/30 transition-colors duration-500"></div>
            <div className="absolute -left-6 -bottom-6 w-20 h-20 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-colors duration-500"></div>
            
            <div className="relative z-10 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between mb-2">
                <div className="h-8 w-8 rounded-lg bg-white/5 backdrop-blur-md flex items-center justify-center border border-white/10 shadow-inner">
                  <TrendingUp className="h-4 w-4 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                </div>
                <span className="text-[10px] font-bold text-neutral-300 bg-white/10 px-2 py-1 rounded-full backdrop-blur-md border border-white/5 shadow-sm">
                  This Month
                </span>
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs font-medium text-neutral-400 mb-1">Monthly Rent</p>
                  <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-sm">
                    <span className="text-neutral-300 font-medium mr-1">₹</span>
                    {stats.monthlyRevenue.toLocaleString('en-IN')}
                  </h3>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-medium text-neutral-400 mb-0.5 flex items-center justify-end gap-1">
                    <Zap className="h-3 w-3 text-amber-400" />
                    Light Bill
                  </p>
                  <h3 className="text-lg font-bold text-amber-400 tracking-tight drop-shadow-sm">
                    <span className="text-amber-400/50 font-medium mr-0.5">+₹</span>
                    {stats.monthlyLightBill.toLocaleString('en-IN')}
                  </h3>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-1 bg-gradient-to-br from-white to-neutral-50 p-2.5 rounded-xl shadow-sm border border-neutral-200/60 hover:shadow-md hover:border-blue-200/60 transition-all duration-300 group flex flex-col justify-between h-full">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100/50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-all duration-300 shadow-inner border border-blue-100/50">
              <Bed className="h-4 w-4" />
            </div>
            <div className="mt-2">
              <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider mb-0.5">Total Beds</p>
              <p className="text-xl font-black text-neutral-900 leading-none">{stats.totalBeds}</p>
            </div>
          </div>

          <div className="col-span-1 bg-gradient-to-br from-white to-neutral-50 p-2.5 rounded-xl shadow-sm border border-neutral-200/60 hover:shadow-md hover:border-purple-200/60 transition-all duration-300 group flex flex-col justify-between h-full">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100/50 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-all duration-300 shadow-inner border border-purple-100/50">
              <BedDouble className="h-4 w-4" />
            </div>
            <div className="mt-2">
              <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider mb-0.5">Occupied</p>
              <p className="text-xl font-black text-neutral-900 leading-none">{stats.occupiedBeds}</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-neutral-50 p-2.5 rounded-xl shadow-sm border border-neutral-200/60 hover:shadow-md transition-all duration-300 group flex flex-col justify-between h-full">
            <div className="h-7 w-7 rounded-lg bg-blue-50/80 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300 shadow-sm border border-blue-100/50">
              <Home className="h-3.5 w-3.5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider mb-0.5 whitespace-nowrap">Total Rooms</p>
              <p className="text-lg font-black text-neutral-900">{stats.totalRooms}</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-neutral-50 p-2.5 rounded-xl shadow-sm border border-neutral-200/60 hover:shadow-md transition-all duration-300 group flex flex-col justify-between h-full">
            <div className="h-7 w-7 rounded-lg bg-emerald-50/80 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300 shadow-sm border border-emerald-100/50">
              <CheckCircle className="h-3.5 w-3.5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider mb-0.5 whitespace-nowrap">Available</p>
              <p className="text-lg font-black text-neutral-900">{stats.availableBeds}</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-neutral-50 p-2.5 rounded-xl shadow-sm border border-neutral-200/60 hover:shadow-md transition-all duration-300 group flex flex-col justify-between h-full">
            <div className="h-7 w-7 rounded-lg bg-amber-50/80 text-amber-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300 shadow-sm border border-amber-100/50">
              <Users className="h-3.5 w-3.5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider mb-0.5 whitespace-nowrap">Active</p>
              <p className="text-lg font-black text-neutral-900">{stats.totalTenants}</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-neutral-50 p-2.5 rounded-xl shadow-sm border border-neutral-200/60 hover:shadow-md transition-all duration-300 group flex flex-col justify-between h-full">
            <div className="h-7 w-7 rounded-lg bg-orange-50/80 text-orange-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300 shadow-sm border border-orange-100/50">
              <CalendarClock className="h-3.5 w-3.5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider mb-0.5 whitespace-nowrap">On Notice</p>
              <p className="text-lg font-black text-neutral-900">{stats.noticePeriod}</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-neutral-50 p-3 rounded-xl shadow-sm border border-neutral-200/60 hover:shadow-md transition-all duration-300 group flex flex-col justify-center col-span-2 md:col-span-4 h-full">
            <div className="flex items-center gap-3 w-full">
              <div className="h-8 w-8 rounded-lg bg-red-50/80 text-red-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-inner border border-red-100/50 shrink-0">
                <LogOut className="h-4 w-4" />
              </div>
              <div className="flex items-center justify-between flex-1">
                <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider whitespace-nowrap">Checkouts this month</p>
                <p className="text-xl font-black text-neutral-900">{stats.checkoutsThisMonth}</p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
