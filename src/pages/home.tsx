import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Findings } from '../parser/types';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { trivyParse } from '../parser/trivyParse';
import { auditParse } from '../parser/auditParser';
import report from '../data/sample-trivy.json';
import audit from '../data/sample-audit-vul.json';

interface HomePageProps {
  onAnalyze: (findings: Findings[]) => void;
}

export default function HomePage({ onAnalyze }: HomePageProps) {
  const navigate = useNavigate();
  const [jsonInput, setJsonInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAnalyze = () => {
    setIsProcessing(true);

    window.setTimeout(() => {
      try {
        const parsed = JSON.parse(jsonInput || '{}');
        let findings: Findings[] = [];

        if (parsed.Results) {
          findings = trivyParse(parsed);
        } else if (parsed.vulnerabilities) {
          findings = auditParse(parsed);
        } else {
          findings = [];
        }

        onAnalyze(findings);
        navigate('/dashboard');
      } catch {
        onAnalyze([]);
        navigate('/dashboard');
      } finally {
        setIsProcessing(false);
      }
    }, 400);
  };

  const handleDemo = () => {
    setIsProcessing(true);

    window.setTimeout(() => {
      const trivyFindings = trivyParse(report);
      const auditFindings = auditParse(audit);
      onAnalyze([...trivyFindings, ...auditFindings]);
      navigate('/dashboard');
      setIsProcessing(false);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#0B1220] px-4 py-8 text-[#F8FAFC] sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#273548] bg-[#111827] text-[#3B82F6]">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 3l7 3v5c0 4.2-2.6 7.6-7 10-4.4-2.4-7-5.8-7-10V6l7-3z" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight">ScanView</p>
              <p className="text-sm text-[#94A3B8]">Security intelligence</p>
            </div>
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-3xl rounded-[24px] border border-[#273548] bg-[#111827] p-8 shadow-[0_10px_30px_rgba(15,23,42,0.35)] sm:p-10 lg:p-12">
            <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#273548] bg-[#182231] px-3 py-1 text-sm text-[#22D3EE]">
                <span>Secure import</span>
              </div>
              <h1 className="text-4xl font-semibold tracking-tight text-[#F8FAFC] sm:text-5xl">
                Security Dashboard
              </h1>
              <p className="mt-4 text-lg text-[#CBD5E1]">
                Transform raw security scan reports into interactive vulnerability insights.
              </p>
              <p className="mt-3 text-sm text-[#94A3B8]">
                 Reports are processed entirely in your browser. No data is uploaded or stored.
              </p>
            </div>

            <div className="mt-10 space-y-6">
              <Card className="border-dashed border-[#3B82F6] bg-[#182231] p-8 transition-colors duration-200 hover:border-[#22D3EE]">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#273548] bg-[#111827] text-[#3B82F6]">
                    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M12 3v12" />
                      <path d="M7 8l5-5 5 5" />
                      <path d="M5 15v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-[#F8FAFC]">Drag & Drop Security Report</h2>
                  <p className="mt-2 text-sm text-[#CBD5E1]">or browse your device</p>
                  <p className="mt-4 text-sm text-[#94A3B8]">Supports Trivy and npm audit JSON reports</p>
                </div>
              </Card>

              <div className="flex items-center justify-center gap-4 text-sm text-[#94A3B8]">
                <div className="h-px flex-1 bg-[#273548]" />
                <span>OR</span>
                <div className="h-px flex-1 bg-[#273548]" />
              </div>

              <Card className="border-[#273548] bg-[#182231] p-5">
                <label className="block text-sm font-medium text-[#F8FAFC]">Paste JSON report</label>
                <textarea
                  value={jsonInput}
                  onChange={(event) => setJsonInput(event.target.value)}
                  placeholder="Paste your Trivy or npm audit JSON report here..."
                  className="mt-3 h-56 w-full rounded-2xl border border-[#273548] bg-[#111827] p-4 font-mono text-sm text-[#CBD5E1] outline-none transition-colors duration-200 focus:border-[#22D3EE]"
                />
                <div className="mt-4 flex flex-wrap gap-3 text-sm text-[#94A3B8]">
                  <span>✓ Trivy JSON</span>
                  <span>✓ npm audit JSON</span>
                </div>
              </Card>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                <Button variant="secondary" onClick={handleDemo} disabled={isProcessing}>
                  {isProcessing ? 'Loading...' : 'Load Demo Report'}
                </Button>
                <Button variant="primary" onClick={handleAnalyze} disabled={isProcessing} className="sm:min-w-[180px]">
                  {isProcessing ? 'Analyzing...' : 'Analyze Report'}
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
