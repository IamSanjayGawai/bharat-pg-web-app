import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Layers, Trash2 } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

interface Room {
  _id: string;
  roomNumber: string;
  type: string;
  totalBeds: number;
  availableBeds: number;
  rent: number;
  status: string;
}

interface Floor {
  _id: string;
  floorNumber: number;
  roomsCount: number;
  rooms: Room[];
}

interface Building {
  _id: string;
  name: string;
  floorsCount: number;
}

const Rooms: React.FC = () => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<string>('');
  const [floors, setFloors] = useState<Floor[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isFloorModalOpen, setIsFloorModalOpen] = useState(false);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRoomDetails, setSelectedRoomDetails] = useState<Room | null>(null);
  const [roomBeds, setRoomBeds] = useState<any[]>([]);
  const [isRoomDetailsModalOpen, setIsRoomDetailsModalOpen] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);

  // Form
  const [floorNumber, setFloorNumber] = useState('');
  const [selectedFloor, setSelectedFloor] = useState<string>('');
  const [roomNumber, setRoomNumber] = useState('');
  const [roomType, setRoomType] = useState('Room');
  const [bedroomBedsCount, setBedroomBedsCount] = useState(0);
  const [hallBedsCount, setHallBedsCount] = useState(0);

  const fetchBuildings = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/buildings');
      setBuildings(res.data);
      if (res.data.length > 0) {
        setSelectedBuilding(res.data[0]._id);
      }
    } catch (error) {
      toast.error('Failed to load buildings');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFloorsAndRooms = async (buildingId: string) => {
    try {
      setIsLoading(true);
      const floorsRes = await api.get(`/floors/building/${buildingId}`);
      const floorsWithRooms = await Promise.all(
        floorsRes.data.map(async (floor: any) => {
          const roomsRes = await api.get(`/rooms/floor/${floor._id}`);
          return { ...floor, rooms: roomsRes.data };
        })
      );
      setFloors(floorsWithRooms);
    } catch (error) {
      toast.error('Failed to load floors');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBuildings();
  }, []);

  useEffect(() => {
    if (selectedBuilding) {
      fetchFloorsAndRooms(selectedBuilding);
    }
  }, [selectedBuilding]);

  const handleAddFloor = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/floors', {
        buildingId: selectedBuilding,
        floorNumber: Number(floorNumber)
      });
      toast.success('Floor added');
      setIsFloorModalOpen(false);
      setFloorNumber('');
      fetchFloorsAndRooms(selectedBuilding);
    } catch (error: any) {
      toast.error('Failed to add floor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bedroomBedsCount === 0 && hallBedsCount === 0) {
      toast.error('Add at least 1 bed');
      return;
    }
    
    setIsSubmitting(true);
    try {
      if (editingRoomId) {
        await api.put(`/rooms/${editingRoomId}`, {
          roomNumber,
          type: roomType,
          totalBeds: Number(bedroomBedsCount) + Number(hallBedsCount) || 1
        });
        toast.success('Room updated');
      } else {
        await api.post('/rooms', {
          floorId: selectedFloor,
          buildingId: selectedBuilding,
          roomNumber,
          type: roomType,
          bedroomBedsCount: Number(bedroomBedsCount),
          hallBedsCount: Number(hallBedsCount),
          rent: 0,
          monthlyRent: 0
        });
        toast.success('Room added');
      }
      setIsRoomModalOpen(false);
      setRoomNumber('');
      setBedroomBedsCount(0);
      setHallBedsCount(0);
      setEditingRoomId(null);
      fetchFloorsAndRooms(selectedBuilding);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save room');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditRoomModal = (e: React.MouseEvent, room: Room, floorId: string) => {
    e.stopPropagation();
    setEditingRoomId(room._id);
    setSelectedFloor(floorId);
    setRoomNumber(room.roomNumber);
    setRoomType(room.type);
    setBedroomBedsCount(room.totalBeds); // for simplicity, put all in bedroom beds on edit
    setHallBedsCount(0);
    setIsRoomModalOpen(true);
  };

  const openAddRoomModal = (floorId: string) => {
    setEditingRoomId(null);
    setSelectedFloor(floorId);
    setRoomNumber('');
    setRoomType('Room');
    setBedroomBedsCount(0);
    setHallBedsCount(0);
    setIsRoomModalOpen(true);
  };

  const handleRoomClick = async (room: Room) => {
    setSelectedRoomDetails(room);
    setIsRoomDetailsModalOpen(true);
    setRoomBeds([]); // clear previous
    try {
      const res = await api.get(`/beds/room/${room._id}`);
      setRoomBeds(res.data);
    } catch (error) {
      toast.error('Failed to fetch beds');
    }
  };

  const handleDeleteRoom = async (e: React.MouseEvent, roomId: string) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this room and all its beds?')) return;
    try {
      await api.delete(`/rooms/${roomId}`);
      toast.success('Room deleted');
      fetchFloorsAndRooms(selectedBuilding);
    } catch (error: any) {
      toast.error('Failed to delete room');
    }
  };

  const handleDeleteBed = async (bedId: string) => {
    if (!window.confirm('Delete this bed?')) return;
    try {
      await api.delete(`/beds/${bedId}`);
      toast.success('Bed deleted');
      if (selectedRoomDetails) {
        const res = await api.get(`/beds/room/${selectedRoomDetails._id}`);
        setRoomBeds(res.data);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete bed');
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-col gap-3 pb-2 border-b border-neutral-200">
        <h2 className="text-xl font-bold text-neutral-900">Property</h2>
        <div className="flex bg-neutral-100 p-1 rounded-xl">
          <Link to="/buildings" className="flex-1 text-center py-2 text-sm font-bold text-neutral-500 hover:text-neutral-700">Buildings</Link>
          <Link to="/rooms" className="flex-1 text-center py-2 text-sm font-bold bg-white rounded-lg shadow-sm text-neutral-900">Rooms & Floors</Link>
        </div>

        <div className="relative">
          <select
            value={selectedBuilding}
            onChange={(e) => setSelectedBuilding(e.target.value)}
            className="w-full pl-3 pr-10 py-3 bg-white border border-neutral-200 rounded-xl font-medium text-neutral-900 appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm text-sm"
          >
            {buildings.map((b) => (
              <option key={b._id} value={b._id}>{b.name}</option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : floors.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-2xl p-8 text-center mt-8 shadow-sm">
          <Layers className="mx-auto h-12 w-12 text-neutral-300" />
          <h3 className="mt-4 text-lg font-bold text-neutral-900">No floors found</h3>
          <p className="mt-1 text-sm text-neutral-500">Start by adding a floor.</p>
        </div>
      ) : (
        <div className="space-y-6 pb-20">
          {floors.map((floor) => (
            <div key={floor._id} className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-1 bg-primary rounded-full"></div>
                  <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">Floor {floor.floorNumber}</h3>
                </div>
                <button
                  onClick={() => openAddRoomModal(floor._id)}
                  className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full"
                >
                  + Add Room
                </button>
              </div>

              {floor.rooms?.length === 0 ? (
                <div className="bg-white border border-dashed border-neutral-300 rounded-2xl p-6 text-center text-xs text-neutral-500">
                  No rooms on this floor.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {floor.rooms?.map((room) => (
                    <div 
                      key={room._id} 
                      onClick={() => handleRoomClick(room)}
                      className="bg-white border border-neutral-100 rounded-2xl p-3 shadow-sm relative overflow-hidden flex flex-col justify-between h-28 cursor-pointer hover:shadow-md transition-shadow active:scale-95"
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-lg font-black text-neutral-900">{room.roomNumber}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <button onClick={(e) => openEditRoomModal(e, room, floor._id)} className="p-1 text-neutral-300 hover:bg-neutral-100 hover:text-neutral-600 rounded-full transition-colors">
                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                          </button>
                          <button onClick={(e) => handleDeleteRoom(e, room._id)} className="p-1 text-neutral-300 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                          <span className={`h-2 w-2 rounded-full ${
                            room.status === 'Available' ? 'bg-green-500' : 
                            room.status === 'Full' ? 'bg-red-500' : 'bg-yellow-500'
                          }`} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between items-end mt-3">
                          <span className="text-[10px] font-bold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-md">{room.type}</span>
                          <span className="text-[10px] font-bold text-primary">
                            {room.totalBeds - room.availableBeds} / {room.totalBeds} Beds
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* FABs */}
      <div className="fixed bottom-20 right-4 flex flex-col gap-3 z-30 sm:absolute sm:bottom-20 sm:right-4">
        <button
          onClick={() => setIsFloorModalOpen(true)}
          className="h-12 w-12 bg-neutral-900 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-neutral-800 transition-transform active:scale-95"
        >
          <Layers className="h-5 w-5" />
        </button>
      </div>

      {/* Floor Slide-up */}
      {isFloorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm" onClick={() => setIsFloorModalOpen(false)}></div>
          <div className="relative bg-white w-full sm:max-w-md rounded-t-[2rem] sm:rounded-2xl shadow-2xl animate-in slide-in-from-bottom-full duration-300 pb-safe">
            <div className="w-12 h-1.5 bg-neutral-200 rounded-full mx-auto mt-4 sm:hidden"></div>
            <div className="px-6 py-4 border-b border-neutral-100"><h3 className="text-lg font-bold text-neutral-900">Add Floor</h3></div>
            <form onSubmit={handleAddFloor} className="p-6 space-y-4 pb-12 sm:pb-6">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1 uppercase tracking-wider">Floor Number</label>
                <input type="number" required value={floorNumber} onChange={(e) => setFloorNumber(e.target.value)} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary/20 text-sm" />
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full mt-4 flex items-center justify-center px-4 py-3.5 bg-primary text-white rounded-xl text-sm font-bold active:scale-95 transition-transform disabled:opacity-50">
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Save Floor'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Room Slide-up */}
      {isRoomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm" onClick={() => setIsRoomModalOpen(false)}></div>
          <div className="relative bg-white w-full sm:max-w-md rounded-t-[2rem] sm:rounded-2xl shadow-2xl animate-in slide-in-from-bottom-full duration-300 max-h-[90vh] overflow-y-auto pb-safe">
            <div className="w-12 h-1.5 bg-neutral-200 rounded-full mx-auto mt-4 sm:hidden"></div>
            <div className="px-6 py-4 border-b border-neutral-100"><h3 className="text-lg font-bold text-neutral-900">{editingRoomId ? 'Edit' : 'Add'} Room / Unit</h3></div>
            <form onSubmit={handleAddRoom} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1 uppercase tracking-wider">Unit / Room No</label>
                  <input type="text" required value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary/20 text-sm" placeholder="101" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1 uppercase tracking-wider">Type</label>
                  <select value={roomType} onChange={(e) => {
                    setRoomType(e.target.value);
                    if (e.target.value === '1RK' || e.target.value === 'Room') {
                      setHallBedsCount(0);
                    }
                  }} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm">
                    <option value="Room">Standard Room</option>
                    <option value="1RK">1 RK</option>
                    <option value="1BHK">1 BHK</option>
                    <option value="2BHK">2 BHK</option>
                  </select>
                </div>
              </div>
              <div className={`grid ${['1BHK', '2BHK'].includes(roomType) ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1 uppercase tracking-wider">
                    {['1BHK', '2BHK'].includes(roomType) ? 'Bedroom Beds' : 'Total Beds'}
                  </label>
                  <input type="number" min="0" required value={bedroomBedsCount} onChange={(e) => setBedroomBedsCount(Number(e.target.value))} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm" />
                </div>
                {['1BHK', '2BHK'].includes(roomType) && (
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1 uppercase tracking-wider">Hall Beds</label>
                    <input type="number" min="0" required value={hallBedsCount} onChange={(e) => setHallBedsCount(Number(e.target.value))} className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm" />
                  </div>
                )}
                {editingRoomId && (
                  <p className="text-[10px] text-neutral-500 mt-2">* Note: Changing beds count during edit will not auto-generate or delete existing beds. You must manually add or remove beds.</p>
                )}
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full mt-6 flex items-center justify-center px-4 py-3.5 bg-primary text-white rounded-xl text-sm font-bold active:scale-95 transition-transform">
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : (editingRoomId ? 'Save Changes' : 'Save Unit')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Room Details Slide-up */}
      {isRoomDetailsModalOpen && selectedRoomDetails && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm" onClick={() => setIsRoomDetailsModalOpen(false)}></div>
          <div className="relative bg-white w-full sm:max-w-md rounded-t-[2rem] sm:rounded-2xl shadow-2xl animate-in slide-in-from-bottom-full duration-300 max-h-[90vh] flex flex-col pb-safe">
            <div className="w-12 h-1.5 bg-neutral-200 rounded-full mx-auto mt-4 sm:hidden flex-shrink-0"></div>
            
            <div className="px-6 py-4 border-b border-neutral-100 flex-shrink-0">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-black text-neutral-900">Unit {selectedRoomDetails.roomNumber}</h3>
                  <p className="text-xs font-bold text-neutral-500 mt-1">{selectedRoomDetails.type} • {selectedRoomDetails.totalBeds} Total Beds</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                  selectedRoomDetails.status === 'Available' ? 'bg-green-100 text-green-700' : 
                  selectedRoomDetails.status === 'Full' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {selectedRoomDetails.status}
                </div>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Beds Overview</h4>
              {roomBeds.length === 0 ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : (
                <div className="space-y-3">
                  {roomBeds.map((bed) => (
                    <div key={bed._id} className={`p-4 rounded-xl border ${bed.status === 'Occupied' ? 'bg-neutral-50 border-neutral-200' : 'bg-white border-green-200'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="text-sm font-bold text-neutral-900">{bed.bedNumber}</span>
                          <div className="text-xs font-bold text-primary mt-0.5">₹{bed.rent} / month</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleDeleteBed(bed._id)} className="p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${bed.status === 'Occupied' ? 'bg-neutral-200 text-neutral-600' : 'bg-green-100 text-green-700'}`}>
                            {bed.status}
                          </span>
                        </div>
                      </div>
                      
                      {bed.status === 'Occupied' && bed.tenantId ? (
                        <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-neutral-100 shadow-sm mt-3">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-xs">
                              {(bed.tenantId.fullName || '?').charAt(0)}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-neutral-900">{bed.tenantId.fullName || 'Unknown'}</span>
                              <span className="text-[10px] font-semibold text-neutral-500">Tenant</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-black text-primary">₹{bed.tenantId.monthlyRent}</span>
                            <span className="block text-[10px] font-semibold text-neutral-500">Rent</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-neutral-500 mt-1">This bed is currently vacant.</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-neutral-100 flex-shrink-0">
              <button onClick={() => setIsRoomDetailsModalOpen(false)} className="w-full py-3.5 bg-neutral-100 text-neutral-700 hover:bg-neutral-200 rounded-xl text-sm font-bold transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rooms;
