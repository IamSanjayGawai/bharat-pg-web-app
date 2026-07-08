import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Building2, 
  LayoutDashboard, 
  Users, 
  Wallet, 
  LogOut,
  Bell,
  Zap
} from 'lucide-react';
import { logout } from '../store/slices/authSlice';
import { type RootState } from '../store/store';

const DashboardLayout: React.FC = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const navigation = [
    { name: 'Home', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Property', href: '/buildings', icon: Building2 },
    { name: 'Tenants', href: '/tenants', icon: Users },
    { name: 'Finance', href: '/rent', icon: Wallet },
    { name: 'Light Bill', href: '/light-bills', icon: Zap },
  ];

  return (
    <div className="min-h-screen bg-neutral-900 sm:p-4 flex items-center justify-center">
      {/* Mobile App Container */}
      <div className="w-full h-full sm:h-[844px] max-w-md bg-neutral-50 relative sm:rounded-[2.5rem] sm:shadow-2xl overflow-hidden flex flex-col sm:border-[8px] sm:border-neutral-800">
        
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-4 shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              {user?.pgName?.charAt(0).toUpperCase() || 'B'}
            </div>
            <div>
              <h1 className="text-sm font-bold text-neutral-900 leading-tight truncate max-w-[120px]">
                {user?.pgName || 'BharatPG'}
              </h1>
              <p className="text-[10px] text-neutral-500 capitalize">{user?.role}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="text-neutral-500 hover:text-neutral-700 relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
            </button>
            <button
              onClick={handleLogout}
              className="text-neutral-500 hover:text-red-600 transition-colors"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-neutral-50 pb-20 scroll-smooth">
          <Outlet />
        </main>

        {/* Fixed Bottom Navigation */}
        <nav className="absolute bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-6 py-3 flex justify-between items-center z-20 pb-safe">
          {navigation.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex flex-col items-center gap-1 min-w-[64px] ${
                  isActive ? 'text-primary' : 'text-neutral-400 hover:text-neutral-600'
                }`}
              >
                <item.icon className={`h-6 w-6 ${isActive ? 'fill-primary/20' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Safe area spacer for newer iPhones */}
        <div className="h-safe bg-white" />
      </div>
    </div>
  );
};

export default DashboardLayout;
