import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Plus, Loader2, MapPin, Layers, Edit2, Trash2 } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

interface Building {
  _id: string;
  name: string;
  address: string;
  floorsCount: number;
}

const Buildings: React.FC = () => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [floorsCount, setFloorsCount] = useState(1);
  const [editingBuildingId, setEditingBuildingId] = useState<string | null>(null);

  const fetchBuildings = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/buildings');
      setBuildings(res.data);
    } catch (error) {
      toast.error('Failed to load buildings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBuildings();
  }, []);

  const openAddModal = () => {
    setEditingBuildingId(null);
    setName('');
    setAddress('');
    setFloorsCount(1);
    setIsModalOpen(true);
  };

  const openEditModal = (building: Building) => {
    setEditingBuildingId(building._id);
    setName(building.name);
    setAddress(building.address);
    setFloorsCount(building.floorsCount);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this building? All rooms, floors, and beds inside it will be permanently deleted.')) return;
    try {
      await api.delete(`/buildings/${id}`);
      toast.success('Building deleted');
      fetchBuildings();
    } catch (error: any) {
      toast.error('Failed to delete building');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingBuildingId) {
        await api.put(`/buildings/${editingBuildingId}`, { name, address, floorsCount });
        toast.success('Building updated');
      } else {
        await api.post('/buildings', { name, address, floorsCount });
        toast.success('Building created');
      }
      setIsModalOpen(false);
      setName('');
      setAddress('');
      setFloorsCount(1);
      fetchBuildings();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save building');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
        <h2 className="text-xl font-bold text-neutral-900">Properties</h2>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : buildings.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-2xl p-8 text-center mt-8">
          <Building2 className="mx-auto h-12 w-12 text-neutral-300" />
          <h3 className="mt-4 text-lg font-bold text-neutral-900">No properties</h3>
          <p className="mt-1 text-sm text-neutral-500">Add your first PG building.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {buildings.map((building) => (
            <div 
              key={building._id} 
              onClick={() => navigate('/rooms', { state: { selectedBuildingId: building._id } })}
              className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-4 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:shadow-md transition-shadow group"
            >
              <div className="flex gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-neutral-900 truncate">{building.name}</h3>
                  <div className="flex items-start text-xs text-neutral-500 mt-1 line-clamp-2">
                    <MapPin className="h-3 w-3 mr-1 mt-0.5 shrink-0" />
                    {building.address}
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-neutral-100 text-[10px] font-medium text-neutral-600">
                      <Layers className="h-3 w-3 mr-1" />
                      {building.floorsCount} Floors
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 self-end sm:self-center border-t border-neutral-100 pt-3 sm:border-0 sm:pt-0 w-full sm:w-auto justify-end">
                <button 
                  onClick={(e) => { e.stopPropagation(); openEditModal(building); }}
                  className="p-2 text-neutral-500 hover:bg-neutral-100 rounded-full transition-colors"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDelete(building._id); }}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={openAddModal}
        className="absolute bottom-20 right-6 h-14 w-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 transition-transform active:scale-95 z-30"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Slide-up Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white w-full sm:max-w-md rounded-t-[2rem] sm:rounded-2xl shadow-2xl animate-in slide-in-from-bottom-full duration-300">
            <div className="w-12 h-1.5 bg-neutral-200 rounded-full mx-auto mt-4 sm:hidden"></div>
            <div className="px-6 py-4 border-b border-neutral-100">
              <h3 className="text-lg font-bold text-neutral-900">{editingBuildingId ? 'Edit' : 'Add'} Building</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 pb-12 sm:pb-6">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1 uppercase tracking-wider">Building Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  placeholder="e.g. Block A"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1 uppercase tracking-wider">Address</label>
                <textarea
                  required
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm resize-none"
                  placeholder="Full address..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1 uppercase tracking-wider">Floors</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={floorsCount}
                  onChange={(e) => setFloorsCount(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-4 flex items-center justify-center px-4 py-3.5 bg-primary text-white rounded-xl text-sm font-bold active:scale-[0.98] transition-transform disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Save Building'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Buildings;
