import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, User, Phone, MapPin, Calendar, CreditCard, 
  Building2, Bed, Info, AlertCircle, PhoneCall, Loader2
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const TenantProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTenant = async () => {
      try {
        const res = await api.get(`/tenants/${id}`);
        setTenant(res.data);
      } catch (error) {
        toast.error('Failed to load tenant details');
        navigate('/tenants');
      } finally {
        setIsLoading(false);
      }
    };
    fetchTenant();
  }, [id, navigate]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-80px)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!tenant) return null;

  return (
    <div className="p-4 space-y-6 max-w-5xl mx-auto pb-24 h-[calc(100vh-80px)] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-neutral-200 pb-4 sticky top-0 bg-neutral-50/90 backdrop-blur-md z-10 pt-2 -mt-2">
        <button 
          onClick={() => navigate('/tenants')}
          className="h-10 w-10 bg-white border border-neutral-200 rounded-xl flex items-center justify-center text-neutral-600 hover:bg-neutral-50 transition-colors shadow-sm shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-neutral-900 truncate">{tenant.fullName}</h2>
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider shrink-0 ${
              tenant.status === 'Active' ? 'bg-green-100 text-green-700' :
              tenant.status === 'Notice Period' ? 'bg-amber-100 text-amber-700' :
              'bg-red-100 text-red-700'
            }`}>
              {tenant.status}
            </span>
          </div>
          <p className="text-sm font-medium text-neutral-500 truncate">{tenant.buildingId?.name} • Room {tenant.roomId?.roomNumber}</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* Personal Details */}
        <div className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-neutral-200 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-neutral-900 text-lg">Personal Details</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Phone className="h-4 w-4 text-neutral-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Mobile Number</p>
                <p className="font-bold text-neutral-900">{tenant.mobileNumber}</p>
                {tenant.alternateMobile && <p className="text-sm text-neutral-500 mt-0.5">Alt: {tenant.alternateMobile}</p>}
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Info className="h-4 w-4 text-neutral-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Identity</p>
                <p className="font-medium text-neutral-900 text-sm">Aadhar: <span className="font-bold">{tenant.aadhaarNumber}</span></p>
                {tenant.panNumber && <p className="font-medium text-neutral-900 text-sm mt-0.5">PAN: <span className="font-bold">{tenant.panNumber}</span></p>}
                <p className="text-xs text-neutral-500 mt-1">DOB: {new Date(tenant.dateOfBirth).toLocaleDateString()} • Gender: {tenant.gender}</p>
                {tenant.email && <p className="text-xs text-neutral-500 mt-0.5">Email: {tenant.email}</p>}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-neutral-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Permanent Address</p>
                <p className="font-medium text-neutral-900 text-sm">{tenant.permanentAddress}</p>
                <p className="text-sm text-neutral-600 mt-0.5">{tenant.city}, {tenant.state} - {tenant.pinCode}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stay Details */}
        <div className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-neutral-200 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="h-5 w-5 text-indigo-500" />
            <h3 className="font-bold text-neutral-900 text-lg">Stay Information</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Bed className="h-4 w-4 text-neutral-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Accommodation</p>
                <p className="font-bold text-neutral-900">{tenant.buildingId?.name}</p>
                <p className="text-sm text-neutral-600 mt-0.5">
                  Floor {tenant.floorId?.floorNumber} • Room {tenant.roomId?.roomNumber} ({tenant.roomId?.type}) • Bed {tenant.bedId?.bedNumber}
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 text-neutral-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Duration</p>
                <p className="font-bold text-neutral-900 text-sm">Joined: {new Date(tenant.joiningDate).toLocaleDateString()}</p>
                {tenant.leavingDate && (
                  <p className="font-bold text-red-600 text-sm mt-0.5">Left: {new Date(tenant.leavingDate).toLocaleDateString()}</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CreditCard className="h-4 w-4 text-neutral-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Financials</p>
                <p className="font-medium text-neutral-900 text-sm">Monthly Rent: <span className="font-bold text-emerald-600">₹{tenant.monthlyRent}</span></p>
                <p className="font-medium text-neutral-900 text-sm mt-0.5">Deposit Amount: <span className="font-bold text-blue-600">₹{tenant.depositAmount}</span></p>
                <p className="text-xs text-neutral-500 mt-1">Paid Deposit: ₹{tenant.depositPaid}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Contacts */}
        <div className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-neutral-200 space-y-4 md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <h3 className="font-bold text-neutral-900 text-lg">Emergency Contacts</h3>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-red-50/50 p-4 rounded-xl border border-red-100">
              <p className="text-xs font-bold text-red-700 uppercase tracking-wider mb-3">Primary Contact</p>
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-red-500 shrink-0 shadow-sm border border-red-100">
                  <PhoneCall className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="font-bold text-neutral-900 text-sm leading-tight">{tenant.emergencyContact?.name}</p>
                  <p className="text-xs font-medium text-neutral-600 mt-0.5">{tenant.emergencyContact?.relationship} • {tenant.emergencyContact?.phoneNumber}</p>
                </div>
              </div>
            </div>

            {tenant.emergencyContact2?.name && (
              <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100">
                <p className="text-xs font-bold text-orange-700 uppercase tracking-wider mb-3">Secondary Contact</p>
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-orange-500 shrink-0 shadow-sm border border-orange-100">
                    <PhoneCall className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="font-bold text-neutral-900 text-sm leading-tight">{tenant.emergencyContact2?.name}</p>
                    <p className="text-xs font-medium text-neutral-600 mt-0.5">{tenant.emergencyContact2?.relationship} • {tenant.emergencyContact2?.phoneNumber}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default TenantProfile;
