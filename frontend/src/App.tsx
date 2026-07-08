import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Buildings from './pages/Buildings';
import Rooms from './pages/Rooms';
import Tenants from './pages/Tenants';
import TenantProfile from './pages/TenantProfile';
import Rent from './pages/Rent';
import Expenses from './pages/Expenses';
import LightBills from './pages/LightBills';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import './App.css';

function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Routes wrapped in DashboardLayout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/buildings" element={<Buildings />} />
            <Route path="/rooms" element={<Rooms />} />
            <Route path="/tenants" element={<Tenants />} />
            <Route path="/tenants/:id" element={<TenantProfile />} />
            <Route path="/rent" element={<Rent />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/light-bills" element={<LightBills />} />
          </Route>
        </Route>
        
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
