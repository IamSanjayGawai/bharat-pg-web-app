import React, { useEffect, useState } from 'react';
import { Zap, Calculator, CheckCircle2, Loader2, Home, Download, FileText } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const RoomBillRow: React.FC<{ room: any; buildingId: string; month: number; year: number }> = ({ room, buildingId, month, year }) => {
  const [totalAmount, setTotalAmount] = useState<string>('');
  const [currentBill, setCurrentBill] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    fetchBill();
  }, [month, year]);

  const fetchBill = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/light-bills/room/${room._id}`);
      const bill = res.data.find((b: any) => {
        const d = new Date(b.billingMonth);
        return d.getMonth() + 1 === month && d.getFullYear() === year;
      });
      setCurrentBill(bill || null);
      if (bill) setTotalAmount(bill.totalAmount.toString());
      else setTotalAmount('');
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCalculate = async () => {
    if (!totalAmount) return toast.error(`Please enter amount for Room ${room.roomNumber}`);
    try {
      setIsCalculating(true);
      const res = await api.post('/light-bills/calculate', {
        roomId: room._id,
        buildingId,
        month,
        year,
        totalAmount: Number(totalAmount)
      });
      toast.success(`Bill saved for Room ${room.roomNumber}`);
      setCurrentBill(res.data);
      setIsExpanded(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to calculate for Room ${room.roomNumber}`);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleMarkPaid = async (tenantId: string, status: string) => {
    if (!currentBill) return;
    try {
      const res = await api.put(`/light-bills/${currentBill._id}/tenant/${tenantId}/pay`, { status });
      toast.success('Status updated');
      setCurrentBill(res.data);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  if (isLoading) {
    return <div className="p-4 bg-white rounded-2xl border border-neutral-100 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-neutral-400" /></div>;
  }

  return (
    <div onClick={() => setIsExpanded(!isExpanded)} className="bg-white p-3 rounded-2xl border border-neutral-200 shadow-sm transition-all hover:border-amber-200 cursor-pointer">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Home className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-neutral-900 text-sm leading-tight truncate">Room {room.roomNumber}</h4>
            <p className="text-[10px] font-medium text-neutral-500 truncate">{room.type}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="relative w-24 sm:w-28" onClick={(e) => e.stopPropagation()}>
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500 font-bold text-xs">₹</span>
            <input
              type="number"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              placeholder="0"
              className="w-full pl-6 pr-2 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg font-bold text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCalculate();
            }}
            disabled={isCalculating}
            className="px-3 py-1.5 bg-neutral-900 text-white rounded-lg text-xs font-bold hover:bg-neutral-800 transition-colors flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-70"
          >
            {isCalculating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : currentBill ? 'Update' : 'Save'}
          </button>
        </div>
      </div>

      {isExpanded && currentBill && currentBill.tenantSplits && currentBill.tenantSplits.length > 0 && (
        <div className="mt-4 pt-4 border-t border-dashed border-neutral-200">
          <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Calculated Split for {currentBill.tenantSplits.length} Tenants</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {currentBill.tenantSplits.map((split: any) => (
              <div key={split.tenantId._id || split.tenantId} onClick={(e) => e.stopPropagation()} className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                <div>
                  <p className="text-sm font-bold text-neutral-900">{split.tenantId?.fullName || 'Unknown'}</p>
                  <p className="text-[10px] font-bold text-neutral-500">{split.activeDays} Days Active</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <p className="text-sm font-extrabold text-amber-600">₹{split.splitAmount}</p>
                  <button
                    onClick={() => handleMarkPaid(split.tenantId._id || split.tenantId, split.status === 'Paid' ? 'Unpaid' : 'Paid')}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                      split.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-neutral-200 text-neutral-600 hover:bg-neutral-300'
                    }`}
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    {split.status}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {isExpanded && currentBill && currentBill.tenantSplits && currentBill.tenantSplits.length === 0 && (
        <div className="mt-4 pt-4 border-t border-dashed border-neutral-200 text-center">
           <p className="text-xs font-bold text-neutral-400">No active tenants found for this month.</p>
        </div>
      )}
    </div>
  );
};

const LightBills: React.FC = () => {
  const [buildings, setBuildings] = useState<any[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<any>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchBuildings();
  }, []);

  const fetchExportData = async () => {
    try {
      setIsExporting(true);
      const res = await api.get('/light-bills');
      const filtered = res.data.filter((b: any) => {
        const d = new Date(b.billingMonth);
        return b.buildingId === selectedBuilding?._id && d.getMonth() + 1 === month && d.getFullYear() === year;
      });
      return filtered;
    } catch (e) {
      toast.error('Failed to fetch data for export');
      return [];
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = async () => {
    const data = await fetchExportData();
    if (data.length === 0) return toast.error('No light bills found for this month');
    
    const headers = ['Room Number', 'Room Type', 'Tenant Name', 'Active Days', 'Split Amount', 'Status', 'Total Room Bill'];
    const rows: string[][] = [];
    
    data.forEach((bill: any) => {
      bill.tenantSplits.forEach((split: any) => {
        rows.push([
          bill.roomId?.roomNumber || 'N/A',
          bill.roomId?.type || 'N/A',
          split.tenantId?.fullName || 'Unknown',
          split.activeDays.toString(),
          split.splitAmount.toString(),
          split.status,
          bill.totalAmount.toString()
        ]);
      });
    });
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(',') + '\n' 
      + rows.map(e => e.join(',')).join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `LightBills_${selectedBuilding?.name}_${month}_${year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = async () => {
    const data = await fetchExportData();
    if (data.length === 0) return toast.error('No light bills found for this month');
    
    const doc = new jsPDF();
    const headers = [['Room Number', 'Tenant Name', 'Active Days', 'Split Amount', 'Status', 'Total Bill']];
    const rows: string[][] = [];
    
    data.forEach((bill: any) => {
      bill.tenantSplits.forEach((split: any) => {
        rows.push([
          bill.roomId?.roomNumber || 'N/A',
          split.tenantId?.fullName || 'Unknown',
          split.activeDays.toString(),
          `Rs. ${split.splitAmount}`,
          split.status,
          `Rs. ${bill.totalAmount}`
        ]);
      });
    });
    
    autoTable(doc, {
      head: headers,
      body: rows,
      startY: 20,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [245, 158, 11] } // amber-500
    });
    
    doc.text(`Light Bills - ${selectedBuilding?.name} (${month}/${year})`, 14, 15);
    doc.save(`LightBills_${selectedBuilding?.name}_${month}_${year}.pdf`);
  };

  const fetchBuildings = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/buildings');
      setBuildings(res.data);
      if (res.data.length > 0) {
        handleBuildingSelect(res.data[0]);
      }
    } catch (error) {
      toast.error('Failed to load buildings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuildingSelect = async (building: any) => {
    setSelectedBuilding(building);
    try {
      setIsLoading(true);
      const floorsRes = await api.get(`/floors/building/${building._id}`);
      let allRooms: any[] = [];
      for (const floor of floorsRes.data) {
        const roomsRes = await api.get(`/rooms/floor/${floor._id}`);
        allRooms = [...allRooms, ...roomsRes.data];
      }
      // Sort rooms by room number for better UX
      allRooms.sort((a, b) => a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true }));
      setRooms(allRooms);
    } catch (error) {
      toast.error('Failed to load rooms');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-6 max-w-5xl mx-auto pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-neutral-900">Light Bills</h2>
            <p className="text-sm font-medium text-neutral-500">Calculate pro-rata electricity splits</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 text-neutral-700 rounded-xl text-sm font-bold hover:bg-neutral-50 transition-colors shadow-sm disabled:opacity-70"
          >
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            CSV
          </button>
          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl text-sm font-bold hover:bg-amber-100 transition-colors shadow-sm disabled:opacity-70"
          >
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            PDF
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Building</label>
          <select 
            value={selectedBuilding?._id || ''} 
            onChange={e => {
              const b = buildings.find(x => x._id === e.target.value);
              if(b) handleBuildingSelect(b);
            }} 
            className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          >
            {buildings.map(b => (
              <option key={b._id} value={b._id}>{b.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Month</label>
          <select 
            value={month} 
            onChange={e => setMonth(Number(e.target.value))} 
            className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          >
            {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
              <option key={m} value={m}>{new Date(2000, m - 1, 1).toLocaleString('default', { month: 'long' })}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Year</label>
          <select 
            value={year} 
            onChange={e => setYear(Number(e.target.value))} 
            className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          >
            {[2023, 2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-amber-500" /></div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-neutral-700 uppercase tracking-wider">Rooms in {selectedBuilding?.name}</h3>
            <span className="text-xs font-bold bg-neutral-100 text-neutral-600 px-2 py-1 rounded-lg">{rooms.length} Rooms</span>
          </div>
          
          <div className="space-y-3">
            {rooms.map(room => (
              <RoomBillRow 
                key={room._id} 
                room={room} 
                buildingId={selectedBuilding._id} 
                month={month} 
                year={year} 
              />
            ))}
            {rooms.length === 0 && (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-neutral-200">
                <p className="text-sm font-bold text-neutral-400">No rooms found in this building.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LightBills;
