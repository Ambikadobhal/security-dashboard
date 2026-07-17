import { useMemo } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import HomePage from './pages/home';
import DashboardPage from './pages/dashboard';
import FindingsPage from './pages/findings';
import { useFindingsStore } from './store/findingsStore';

function App() {
  const findings = useFindingsStore((state) => state.findings);

  const dashboard = useMemo(() => <DashboardPage findings={findings} />, [findings]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard" element={dashboard} />
        <Route path="/findings" element={<FindingsPage findings={findings} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;