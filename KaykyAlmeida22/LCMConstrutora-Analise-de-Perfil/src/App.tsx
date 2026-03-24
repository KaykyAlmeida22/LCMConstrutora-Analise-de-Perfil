import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AdminLayout from './components/layout/AdminLayout';
import Landing from './pages/candidate/Landing';
import Onboarding from './pages/candidate/Onboarding';
import Upload from './pages/candidate/Upload';
import Dashboard from './pages/admin/Dashboard';
import CandidateDetail from './pages/admin/CandidateDetail';
import NewCandidate from './pages/admin/NewCandidate';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota do Candidato */}
        <Route path="/" element={<Landing />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/upload" element={<Upload />} />

        {/* Rota do Analista (CRM) */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="candidatos" element={<Dashboard />} />
          <Route path="candidato/:id" element={<CandidateDetail />} />
          <Route path="novo-candidato" element={<NewCandidate />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
