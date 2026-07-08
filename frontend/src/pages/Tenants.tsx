import React, { useEffect, useState } from 'react';
import { Users, Plus, Loader2, Phone, LogOut, Edit2, Trash2, Calendar, Search, Home, Download } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FileText } from 'lucide-react';

interface Tenant {
  _id: string;
  fullName: string;
  mobileNumber: string;
  roomNumber?: string;
  bedNumber?: string;
  status: string;
  joiningDate: string;
  roomId?: any;
  bedId?: any;
  leavingDate?: string;
  monthlyRent?: number;
  [key: string]: any;
}

const Tenants: React.FC = () => {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTenantId, setEditingTenantId] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [buildingFilter, setBuildingFilter] = useState('All');
  const [roomTypeFilter, setRoomTypeFilter] = useState('All');
  const [bedLocationFilter, setBedLocationFilter] = useState('All');
  const [depositFilter, setDepositFilter] = useState('All');
  const [rentFilter, setRentFilter] = useState('All');

  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedCheckoutTenantId, setSelectedCheckoutTenantId] = useState('');
  const [checkoutDate, setCheckoutDate] = useState(new Date().toISOString().split('T')[0]);
  const [checkoutRemarks, setCheckoutRemarks] = useState('');
  const [checkoutRefund, setCheckoutRefund] = useState('');

  // Form
  const [buildings, setBuildings] = useState<any[]>([]);
  const [floors, setFloors] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [beds, setBeds] = useState<any[]>([]);

  const [formData, setFormData] = useState<any>({
    fullName: '', mobileNumber: '', aadhaarNumber: '', dateOfBirth: '', gender: 'Male',
    permanentAddress: '', city: '', state: '', pinCode: '',
    emergencyContact: { name: '', relationship: '', phoneNumber: '', address: '' },
    buildingId: '', floorId: '', roomId: '', bedId: '', depositAmount: '', monthlyRent: ''
  });

  const fetchTenants = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/tenants');
      setTenants(res.data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load tenants');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBuildings = async () => {
    try {
      const res = await api.get('/buildings');
      setBuildings(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchTenants();
    fetchBuildings();
  }, []);

  useEffect(() => {
    if (formData.buildingId) api.get(`/floors/building/${formData.buildingId}`).then(res => setFloors(res.data));
  }, [formData.buildingId]);

  useEffect(() => {
    if (formData.floorId) api.get(`/rooms/floor/${formData.floorId}`).then(res => setRooms(res.data));
  }, [formData.floorId]);

  useEffect(() => {
    if (formData.roomId) api.get(`/beds/room/${formData.roomId}`).then(res => setBeds(res.data));
  }, [formData.roomId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        depositAmount: Number(formData.depositAmount) || 0,
        monthlyRent: Number(formData.monthlyRent) || 0,
      };

      if (editingTenantId) {
        await api.put(`/tenants/${editingTenantId}`, payload);
        toast.success('Tenant updated successfully!');
      } else {
        await api.post('/tenants', payload);
        toast.success('Tenant admitted successfully!');
      }
      setIsModalOpen(false);
      fetchTenants();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckoutClick = (tenantId: string) => {
    setSelectedCheckoutTenantId(tenantId);
    setCheckoutDate(new Date().toISOString().split('T')[0]);
    setCheckoutRemarks('');
    setCheckoutRefund('');
    setCheckoutModalOpen(true);
  };

  const confirmCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.put(`/tenants/${selectedCheckoutTenantId}/checkout`, { 
        leavingDate: checkoutDate, 
        remarks: checkoutRemarks,
        refundAmount: Number(checkoutRefund) || 0
      });
      toast.success('Tenant checked out');
      setCheckoutModalOpen(false);
      fetchTenants();
    } catch (error: any) {
      console.error(error);
      toast.error('Failed to checkout');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAddModal = () => {
    setEditingTenantId(null);
    setFormData({
      fullName: '', mobileNumber: '', aadhaarNumber: '', dateOfBirth: '', gender: 'Male',
      permanentAddress: '', city: '', state: '', pinCode: '',
      emergencyContact: { name: '', relationship: '', phoneNumber: '', address: '' },
      emergencyContact2: { name: '', relationship: '', phoneNumber: '', address: '' },
      buildingId: '', floorId: '', roomId: '', bedId: '', depositAmount: '', depositStatus: 'Unpaid', feeStatus: 'Unpaid', monthlyRent: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (tenant: any) => {
    setEditingTenantId(tenant._id);
    setFormData({
      fullName: tenant.fullName || '', 
      mobileNumber: tenant.mobileNumber || '', 
      aadhaarNumber: tenant.aadhaarNumber || '', 
      dateOfBirth: tenant.dateOfBirth ? tenant.dateOfBirth.split('T')[0] : '', 
      gender: tenant.gender || 'Male',
      permanentAddress: tenant.permanentAddress || '', 
      city: tenant.city || '', 
      state: tenant.state || '', 
      pinCode: tenant.pinCode || '',
      emergencyContact: tenant.emergencyContact || { name: '', relationship: '', phoneNumber: '', address: '' },
      emergencyContact2: tenant.emergencyContact2 || { name: '', relationship: '', phoneNumber: '', address: '' },
      buildingId: tenant.buildingId?._id || tenant.buildingId || '', 
      floorId: tenant.floorId?._id || tenant.floorId || '', 
      roomId: tenant.roomId?._id || tenant.roomId || '', 
      bedId: tenant.bedId?._id || tenant.bedId || '', 
      depositAmount: tenant.depositAmount || '', 
      depositStatus: tenant.depositAmount === tenant.depositPaid ? 'Paid' : 'Unpaid', 
      feeStatus: tenant.currentMonthRentStatus === 'Paid' ? 'Paid' : 'Unpaid',
      monthlyRent: tenant.monthlyRent || ''
    });
    setIsModalOpen(true);
  };

  const handleDeleteTenant = async (tenantId: string) => {
    if (!window.confirm('Are you sure you want to delete this tenant permanently?')) return;
    try {
      await api.delete(`/tenants/${tenantId}`);
      toast.success('Tenant deleted');
      fetchTenants();
    } catch (error: any) {
      console.error(error);
      toast.error('Failed to delete tenant');
    }
  };

  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = String(tenant.fullName || '').toLowerCase().includes(String(searchTerm || '').toLowerCase()) || 
                          String(tenant.mobileNumber || '').includes(String(searchTerm || ''));
    const matchesStatus = statusFilter === 'All' || tenant.status === statusFilter;
    const matchesBuilding = buildingFilter === 'All' || (tenant.buildingId?._id || tenant.buildingId) === buildingFilter;
    const matchesRoomType = roomTypeFilter === 'All' || (tenant.roomId?.type || '') === roomTypeFilter;
    const matchesBedLocation = bedLocationFilter === 'All' || (tenant.bedId?.location || '') === bedLocationFilter;
    
    let matchesDeposit = true;
    if (depositFilter === 'Paid') matchesDeposit = (tenant as any).depositPaid >= (tenant as any).depositAmount;
    if (depositFilter === 'Pending') matchesDeposit = ((tenant as any).depositPaid || 0) < (tenant as any).depositAmount;

    let matchesRent = true;
    if (rentFilter === 'Paid') matchesRent = (tenant as any).currentMonthRentStatus === 'Paid';
    if (rentFilter === 'Pending') matchesRent = (tenant as any).currentMonthRentStatus !== 'Paid';

    return matchesSearch && matchesStatus && matchesBuilding && matchesRoomType && matchesBedLocation && matchesDeposit && matchesRent;
  });

  const downloadCSV = () => {
    const headers = ['Name', 'Mobile', 'Building', 'Room', 'Bed', 'Status', 'Deposit Amount', 'Deposit Paid', 'Rent Status', 'Joining Date', 'Leaving Date', 'Light Bill'];
    const csvContent = [
      headers.join(','),
      ...filteredTenants.map((t: any) => [
        `"${t.fullName || ''}"`,
        `"${t.mobileNumber || ''}"`,
        `"${t.buildingId?.name || ''}"`,
        `"${t.roomId ? `Unit ${t.roomId.roomNumber} (${t.roomId.type || 'Room'})` : ''}"`,
        `"${t.bedId?.bedNumber || ''}"`,
        `"${t.status || ''}"`,
        `"${t.depositAmount || 0}"`,
        `"${t.depositPaid || 0}"`,
        `"${t.currentMonthRentStatus || 'Pending'}"`,
        `"${t.joiningDate ? new Date(t.joiningDate).toLocaleDateString() : ''}"`,
        `"${t.leavingDate ? new Date(t.leavingDate).toLocaleDateString() : ''}"`,
        `""`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `tenants_list_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadPDF = () => {
    if (filteredTenants.length === 0) return toast.error('No tenants to export');
    
    const doc = new jsPDF();
    const headers = [['Name', 'Mobile', 'Building', 'Room', 'Status', 'Rent', 'Deposit']];
    const rows = filteredTenants.map(tenant => [
      tenant.fullName,
      tenant.mobileNumber,
      tenant.buildingId?.name || 'N/A',
      tenant.roomId?.roomNumber || 'N/A',
      tenant.status,
      tenant.monthlyRent ? `Rs. ${tenant.monthlyRent}` : 'N/A',
      (tenant as any).depositAmount ? `Rs. ${(tenant as any).depositAmount}` : 'N/A'
    ]);
    
    autoTable(doc, {
      head: headers,
      body: rows,
      startY: 20,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [79, 70, 229] } // primary color
    });
    
    doc.text(`Tenants List - ${new Date().toLocaleDateString()}`, 14, 15);
    doc.save(`tenants_list_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-col gap-3 pb-4 border-b border-neutral-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-neutral-900">Tenants</h2>
          <div className="flex items-center gap-2">
            <button onClick={downloadCSV} className="text-xs font-bold bg-neutral-100 text-neutral-700 px-3 py-1.5 rounded-lg hover:bg-neutral-200 flex items-center gap-1.5 shadow-sm transition-colors">
              <Download className="h-3.5 w-3.5" /> CSV
            </button>
            <button onClick={downloadPDF} className="text-xs font-bold bg-primary/10 text-primary px-3 py-1.5 rounded-lg hover:bg-primary/20 flex items-center gap-1.5 shadow-sm transition-colors">
              <FileText className="h-3.5 w-3.5" /> PDF
            </button>
          </div>
        </div>
        
        {/* Filter Bar */}
        <div className="space-y-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-neutral-400" />
            </div>
            <input type="text" placeholder="Search by name or mobile number..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto pb-1 snap-x scrollbar-hide hide-scrollbar">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="shrink-0 px-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs font-medium text-neutral-700 snap-start focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Notice Period">Notice Period</option>
              <option value="Left">Left</option>
            </select>

            <select value={buildingFilter} onChange={e => setBuildingFilter(e.target.value)} className="shrink-0 px-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs font-medium text-neutral-700 snap-start focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="All">All Buildings</option>
              {buildings.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
            </select>

            <select value={roomTypeFilter} onChange={e => setRoomTypeFilter(e.target.value)} className="shrink-0 px-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs font-medium text-neutral-700 snap-start focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="All">All Room Types</option>
              <option value="Room">Standard Room</option>
              <option value="1RK">1 RK</option>
              <option value="1BHK">1 BHK</option>
              <option value="2BHK">2 BHK</option>
            </select>

            <select value={bedLocationFilter} onChange={e => setBedLocationFilter(e.target.value)} className="shrink-0 px-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs font-medium text-neutral-700 snap-start focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="All">All Bed Locations</option>
              <option value="Bedroom">Bedroom</option>
              <option value="Hall">Hall</option>
            </select>

            <select value={depositFilter} onChange={e => setDepositFilter(e.target.value)} className="shrink-0 px-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs font-medium text-neutral-700 snap-start focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="All">Deposit: All</option>
              <option value="Paid">Deposit: Paid</option>
              <option value="Pending">Deposit: Pending/Partial</option>
            </select>

            <select value={rentFilter} onChange={e => setRentFilter(e.target.value)} className="shrink-0 px-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs font-medium text-neutral-700 snap-start focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="All">Rent (This Month): All</option>
              <option value="Paid">Rent: Paid</option>
              <option value="Pending">Rent: Pending</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : filteredTenants.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-2xl p-8 text-center mt-8">
          <Users className="mx-auto h-12 w-12 text-neutral-300" />
          <h3 className="mt-4 text-lg font-bold text-neutral-900">No tenants found</h3>
          <p className="mt-1 text-sm text-neutral-500">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="space-y-4 pb-20">
          {filteredTenants.map((tenant) => (
            <div 
              key={tenant._id} 
              onClick={() => navigate(`/tenants/${tenant._id}`)}
              className="bg-white rounded-[1.25rem] border border-neutral-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-shadow cursor-pointer"
            >
              
              <div className="p-4 sm:p-5 pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                      <span className="text-lg font-black text-primary">{tenant.fullName.charAt(0)}</span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-extrabold text-neutral-900 truncate">{tenant.fullName}</h3>
                      <div className="flex items-center text-xs text-neutral-500 mt-0.5">
                        <Phone className="h-3 w-3 mr-1 shrink-0" />
                        <span className="truncate">{tenant.mobileNumber}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="shrink-0 flex flex-col items-end gap-1.5">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      tenant.status === 'Active' ? 'bg-green-100 text-green-700' : 
                      tenant.status === 'Notice Period' ? 'bg-amber-100 text-amber-700' : 
                      'bg-red-100 text-red-700'
                    }`}>
                      {tenant.status}
                    </span>
                    {tenant.monthlyRent && (
                      <div className="flex items-center text-sm font-black text-neutral-900">
                        ₹{tenant.monthlyRent.toLocaleString('en-IN')}
                        <span className="text-[10px] font-semibold text-neutral-400 ml-1">/mo</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 bg-neutral-50 rounded-xl p-3 border border-neutral-100">
                  <div className="flex items-start gap-2">
                    <Home className="h-4 w-4 text-neutral-400 shrink-0 mt-0.5" />
                    <div className="flex flex-col gap-1.5 min-w-0">
                      {tenant.roomId && (
                        <p className="text-xs font-semibold text-neutral-700 truncate">
                          {tenant.buildingId?.name ? `${tenant.buildingId.name} • ` : ''}Unit {tenant.roomId.roomNumber} ({tenant.roomId.type || 'Room'}) • {tenant.bedId?.bedNumber}
                        </p>
                      )}
                      {(tenant.status === 'Notice Period' || tenant.status === 'Left') && tenant.leavingDate && (
                        <p className={`text-[10px] font-bold flex items-center gap-1 ${
                          tenant.status === 'Notice Period' ? 'text-amber-600' : 'text-red-600'
                        }`}>
                          <Calendar className="h-3 w-3 shrink-0" />
                          {tenant.status === 'Left' ? 'Left:' : 'Leaves:'} {new Date(tenant.leavingDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-neutral-200/60">
                    {/* Deposit Tag */}
                    {(tenant as any).depositPaid !== undefined && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        (tenant as any).depositPaid >= (tenant as any).depositAmount 
                          ? 'bg-green-50 text-green-700' 
                          : 'bg-red-50 text-red-700'
                      }`}>
                        Deposit: {(tenant as any).depositPaid >= (tenant as any).depositAmount ? 'Paid' : `Pending ₹${(tenant as any).depositAmount - ((tenant as any).depositPaid || 0)}`}
                      </span>
                    )}

                    {/* Rent Tag */}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      (tenant as any).currentMonthRentStatus === 'Paid' 
                        ? 'bg-green-50 text-green-700' 
                        : 'bg-red-50 text-red-700'
                    }`}>
                      Rent (This Month): {(tenant as any).currentMonthRentStatus === 'Paid' ? 'Paid' : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-neutral-50/50 px-4 py-3 border-t border-neutral-100 flex items-center justify-between mt-auto">
                <div className="flex items-center gap-1">
                  <button 
                    onClick={(e) => { e.stopPropagation(); openEditModal(tenant); }} 
                    className="px-3 py-1.5 text-xs font-bold text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/50 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Edit2 className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteTenant(tenant._id); }} 
                    className="px-3 py-1.5 text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
                
                {(tenant.status === 'Active' || tenant.status === 'Notice Period') && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleCheckoutClick(tenant._id); }}
                    className="flex items-center justify-center gap-1.5 text-xs font-bold bg-neutral-900 text-white px-4 py-2 rounded-lg hover:bg-neutral-800 transition-colors shadow-sm"
                  >
                    <LogOut className="h-3.5 w-3.5" /> Checkout
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={openAddModal}
        className="fixed bottom-20 right-6 h-14 w-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 transition-transform active:scale-95 z-30 sm:absolute sm:bottom-20 sm:right-6"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Full Screen Slide-up Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex justify-center bg-white animate-in slide-in-from-bottom-full duration-300 overflow-hidden sm:absolute sm:rounded-[2.5rem]">
          <div className="w-full h-full flex flex-col bg-neutral-50 relative">
            <header className="h-14 bg-white border-b border-neutral-200 flex items-center justify-between px-4 shrink-0 shadow-sm z-10 sticky top-0">
              <h3 className="text-lg font-bold text-neutral-900">{editingTenantId ? 'Edit Tenant' : 'New Admission'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-500 font-bold px-2 py-1 text-sm bg-neutral-100 rounded-full">Cancel</button>
            </header>
            
            <main className="flex-1 overflow-y-auto p-4 pb-24">
              <form id="admission-form" onSubmit={handleSubmit} className="space-y-6">
                {/* Room Section */}
                <div className="bg-white p-5 rounded-2xl border border-neutral-100 shadow-sm space-y-4">
                  <h4 className="font-bold text-neutral-900 flex items-center gap-2"><span className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">1</span> Assignment {editingTenantId && <span className="text-[10px] font-normal text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">(Cannot change in edit mode)</span>}</h4>
                  
                  <div className="space-y-3">
                    <select required disabled={!!editingTenantId} value={formData.buildingId} onChange={e => setFormData({...formData, buildingId: e.target.value, floorId: '', roomId: '', bedId: ''})} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                      <option value="">Select Building</option>
                      {buildings.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                    </select>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <select required disabled={!formData.buildingId || !!editingTenantId} value={formData.floorId} onChange={e => setFormData({...formData, floorId: e.target.value, roomId: '', bedId: ''})} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                        <option value="">Floor</option>
                        {floors.map(f => <option key={f._id} value={f._id}>{f.floorNumber}</option>)}
                      </select>
                      <select required disabled={!formData.floorId || !!editingTenantId} value={formData.roomId} onChange={e => setFormData({...formData, roomId: e.target.value, bedId: ''})} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                        <option value="">Room</option>
                        {rooms.map(r => <option key={r._id} value={r._id}>{r.roomNumber} {r.type ? `(${r.type})` : ''}</option>)}
                      </select>
                    </div>
                    
                    <select required disabled={!formData.roomId || !!editingTenantId} value={formData.bedId} onChange={e => setFormData({...formData, bedId: e.target.value})} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                      <option value="">Select Bed</option>
                      {beds.map(b => {
                        let statusText = b.status === 'Available' ? 'Vacant' : b.status;
                        if (b.status === 'Occupied' && b.tenantId?.status === 'Notice Period') {
                          statusText = 'Checkout (Notice Period)';
                        }
                        const isDisabled = b.status !== 'Available' && b._id !== formData.bedId;
                        return (
                          <option key={b._id} value={b._id} disabled={isDisabled}>
                            {b.bedNumber} {b.location ? `(${b.location})` : ''} - {statusText}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                {/* Personal Section */}
                <div className="bg-white p-5 rounded-2xl border border-neutral-100 shadow-sm space-y-4">
                  <h4 className="font-bold text-neutral-900 flex items-center gap-2"><span className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">2</span> Details</h4>
                  
                  <input type="text" placeholder="Full Name" required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm" />
                  
                  <div className="grid grid-cols-2 gap-3">
                    <input type="tel" placeholder="Mobile" required value={formData.mobileNumber} onChange={e => setFormData({...formData, mobileNumber: e.target.value})} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm" />
                    <input type="text" placeholder="Aadhaar" required value={formData.aadhaarNumber} onChange={e => setFormData({...formData, aadhaarNumber: e.target.value})} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <input type="date" required value={formData.dateOfBirth} onChange={e => setFormData({...formData, dateOfBirth: e.target.value})} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-500" />
                    <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm">
                      <option value="Male">Male</option><option value="Female">Female</option>
                    </select>
                  </div>
                  
                  <textarea placeholder="Permanent Address" required rows={2} value={formData.permanentAddress} onChange={e => setFormData({...formData, permanentAddress: e.target.value})} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm resize-none" />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder="City" required value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm" />
                    <input type="text" placeholder="PIN" required value={formData.pinCode} onChange={e => setFormData({...formData, pinCode: e.target.value})} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm" />
                  </div>
                  <input type="text" placeholder="State" required value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm" />
                </div>

                {/* Emergency Section */}
                <div className="bg-white p-5 rounded-2xl border border-neutral-100 shadow-sm space-y-4">
                  <h4 className="font-bold text-neutral-900 flex items-center gap-2"><span className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">3</span> Emergency</h4>
                  
                  <div className="space-y-3">
                    <h5 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Primary Contact</h5>
                    <input type="text" placeholder="Contact Name" required value={formData.emergencyContact.name} onChange={e => setFormData({...formData, emergencyContact: {...formData.emergencyContact, name: e.target.value}})} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm" />
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" placeholder="Relation" required value={formData.emergencyContact.relationship} onChange={e => setFormData({...formData, emergencyContact: {...formData.emergencyContact, relationship: e.target.value}})} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm" />
                      <input type="tel" placeholder="Phone" required value={formData.emergencyContact.phoneNumber} onChange={e => setFormData({...formData, emergencyContact: {...formData.emergencyContact, phoneNumber: e.target.value}})} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm" />
                    </div>
                    <input type="text" placeholder="Address (Optional)" value={formData.emergencyContact.address} onChange={e => setFormData({...formData, emergencyContact: {...formData.emergencyContact, address: e.target.value}})} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm" />
                  </div>

                  <div className="pt-3 border-t border-neutral-100 space-y-3">
                    <h5 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Secondary Contact (Optional)</h5>
                    <input type="text" placeholder="Contact Name" value={formData.emergencyContact2?.name || ''} onChange={e => setFormData({...formData, emergencyContact2: {...formData.emergencyContact2, name: e.target.value}})} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm" />
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" placeholder="Relation" value={formData.emergencyContact2?.relationship || ''} onChange={e => setFormData({...formData, emergencyContact2: {...formData.emergencyContact2, relationship: e.target.value}})} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm" />
                      <input type="tel" placeholder="Phone" value={formData.emergencyContact2?.phoneNumber || ''} onChange={e => setFormData({...formData, emergencyContact2: {...formData.emergencyContact2, phoneNumber: e.target.value}})} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm" />
                    </div>
                    <input type="text" placeholder="Address (Optional)" value={formData.emergencyContact2?.address || ''} onChange={e => setFormData({...formData, emergencyContact2: {...formData.emergencyContact2, address: e.target.value}})} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm" />
                  </div>
                </div>

                {/* Financial Section */}
                <div className="bg-white p-5 rounded-2xl border border-neutral-100 shadow-sm space-y-4">
                  <h4 className="font-bold text-neutral-900 flex items-center gap-2"><span className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">4</span> Payments</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <input type="number" placeholder="Rent (₹)" required value={formData.monthlyRent} onChange={e => setFormData({...formData, monthlyRent: e.target.value})} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-bold" />
                    <input type="number" placeholder="Total Deposit (₹)" required value={formData.depositAmount} onChange={e => setFormData({...formData, depositAmount: e.target.value})} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-bold" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <select required value={formData.feeStatus} onChange={e => setFormData({...formData, feeStatus: e.target.value})} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-bold text-neutral-700">
                      <option value="Unpaid">Fee: Unpaid</option>
                      <option value="Paid">Fee: Paid</option>
                    </select>
                    <select required value={formData.depositStatus} onChange={e => setFormData({...formData, depositStatus: e.target.value})} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-bold text-neutral-700">
                      <option value="Unpaid">Deposit: Unpaid</option>
                      <option value="Paid">Deposit: Paid</option>
                    </select>
                  </div>
                </div>
              </form>
            </main>

            <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-neutral-100 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
              <button form="admission-form" type="submit" disabled={isSubmitting} className="w-full flex items-center justify-center px-4 py-3.5 bg-primary text-white rounded-xl text-sm font-bold active:scale-95 transition-transform disabled:opacity-50 shadow-md shadow-primary/20">
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : (editingTenantId ? 'Save Changes' : 'Complete Admission')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {checkoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-neutral-100 flex justify-between items-center bg-red-50">
              <h3 className="text-lg font-bold text-red-600 flex items-center gap-2"><LogOut className="h-5 w-5" /> Checkout Tenant</h3>
            </div>
            <form onSubmit={confirmCheckout} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1 uppercase tracking-wider">Leaving Date</label>
                <input type="date" required value={checkoutDate} onChange={(e) => setCheckoutDate(e.target.value)} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1 uppercase tracking-wider">Refund Amount (₹)</label>
                <input type="number" min="0" value={checkoutRefund} onChange={(e) => setCheckoutRefund(e.target.value)} placeholder="0" className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1 uppercase tracking-wider">Remarks</label>
                <textarea rows={2} value={checkoutRemarks} onChange={(e) => setCheckoutRemarks(e.target.value)} placeholder="Any final remarks..." className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setCheckoutModalOpen(false)} className="flex-1 py-3 bg-neutral-100 text-neutral-700 rounded-xl text-sm font-bold">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-3 bg-red-500 text-white rounded-xl text-sm font-bold flex justify-center items-center">
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Confirm Checkout'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tenants;
