import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AdminLayout from './components/layout/AdminLayout';
import ProtectedRoute from './components/shared/ProtectedRoute';
import Landing from './pages/candidate/Landing';
import Onboarding from './pages/candidate/Onboarding';
import Upload from './pages/candidate/Upload';
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import CandidateDetail from './pages/admin/CandidateDetail';
import NewCandidate from './pages/admin/NewCandidate';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/admin/login" element={<Login />} />

          {/* Protected Analyst Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="candidatos" element={<Dashboard />} />
              <Route path="candidato/:id" element={<CandidateDetail />} />
              <Route path="novo-candidato" element={<NewCandidate />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
