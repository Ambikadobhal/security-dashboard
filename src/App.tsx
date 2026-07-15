import { useMemo, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import type { Findings } from './parser/types';
import HomePage from './pages/home';
import DashboardPage from './pages/dashboard';
import FindingsPage from './pages/findings';

function App() {
  const [findings, setFindings] = useState<Findings[]>([]);

  const dashboard = useMemo(() => <DashboardPage findings={findings} />, [findings]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage onAnalyze={setFindings} />} />
        <Route path="/dashboard" element={dashboard} />
        <Route path="/findings" element={<FindingsPage findings={findings} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;