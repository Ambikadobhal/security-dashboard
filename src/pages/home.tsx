import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { trivyParse } from '../parser/trivyParse';
import { auditParse } from '../parser/auditParser';
import type { Findings } from '../parser/types';
import report from '../data/sample-trivy.json';
import audit from '../data/sample-audit-vul.json';
import { useFindingsStore } from '../store/findingsStore';
import '../App.css';

export default function HomePage() {
  const navigate = useNavigate();
  const setFindings = useFindingsStore((state) => state.setFindings);
  const [jsonInput, setJsonInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("")
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAnalyze = () => {
    if (!jsonInput || jsonInput.trim() === "") {
      setError("Please upload or paste a JSON report.");
      return;
    }
    setError("")
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

        setFindings(findings);
        navigate('/dashboard');
      } catch {
        setError("Invalid JSON report. Please check the format and try again.");
        setIsProcessing(false);
      }
    }, 400);
  };

  const handleDemo = () => {
    setIsProcessing(true);

    window.setTimeout(() => {
      const trivyFindings = trivyParse(report);
      const auditFindings = auditParse(audit);
      setFindings([...trivyFindings, ...auditFindings]);
      navigate('/dashboard');
      setIsProcessing(false);
    }, 400);
  };
  const readFile = (file: File) => {
    if (!file.name.endsWith(".json")) {
      setError("Please select a JSON file.");
      return;
    }
    setFileName(file.name);
    setError("");
    const reader = new FileReader();
    reader.onload = (e) => setJsonInput(e.target?.result as string);
    reader.onerror = () => setError("Couldn't read that file.");
    reader.readAsText(file);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) readFile(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) readFile(file);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };
  return (
    <div className="min-h-screen bg-[#0B1220] px-4 py-8 text-[#F8FAFC] sm:px-6 lg:px-8 font-sans antialiased">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#273548] bg-[#111827] text-[#3B82F6] transition-all duration-300 group-hover:border-[#22D3EE] group-hover:text-[#22D3EE]">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M12 3l7 3v5c0 4.2-2.6 7.6-7 10-4.4-2.4-7-5.8-7-10V6l7-3z" />
              </svg>
            </div>
            <p className="text-lg font-semibold tracking-tight">
              ScanView
            </p>
          </div>

          <a
            href="https://github.com/yourusername/yourrepo"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#273548] bg-[#111827] text-[#94A3B8] transition-all duration-200 hover:border-[#22D3EE] hover:text-white hover:-translate-y-0.5"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="currentColor"
            >
              <path d="M12 .5C5.65.5.5 5.65.5 12a11.5 11.5 0 008 10.93c.58.1.79-.25.79-.56v-2.17c-3.25.71-3.94-1.56-3.94-1.56-.53-1.35-1.3-1.71-1.3-1.71-1.06-.73.08-.72.08-.72 1.18.08 1.8 1.21 1.8 1.21 1.04 1.79 2.74 1.27 3.4.97.1-.76.41-1.27.74-1.56-2.59-.3-5.31-1.3-5.31-5.77 0-1.27.45-2.31 1.2-3.13-.12-.3-.52-1.52.11-3.17 0 0 .98-.31 3.2 1.2a11.1 11.1 0 015.82 0c2.22-1.51 3.2-1.2 3.2-1.2.63 1.65.23 2.87.11 3.17.75.82 1.2 1.86 1.2 3.13 0 4.48-2.73 5.47-5.33 5.77.42.36.79 1.07.79 2.16v3.2c0 .31.21.67.8.56A11.5 11.5 0 0023.5 12C23.5 5.65 18.35.5 12 .5z" />
            </svg>
          </a>
        </header>

        <main className="flex flex-1 items-center justify-center">
          <div className="relative w-full max-w-5xl px-6 sm:px-10 lg:px-12">

            {/* Hero */}
            <div className="mx-auto flex max-w-3xl flex-col items-center text-center gap-3">

              <div className="text-focus-in mb-2 inline-flex items-center gap-2 rounded-full border border-[#273548] bg-[#182231] px-3 py-1 text-xs font-medium tracking-wide text-[#22D3EE]">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#22D3EE] animate-pulse" />
                Secure import
              </div>

              <h1 className="tracking-in-expand  text-4xl font-bold leading-[1.1] text-[#F8FAFC] sm:text-5xl lg:text-6xl">
                Analyze Security Reports
              </h1>

              <p className="slide-in-fwd-center mt-3 max-w-2xl text-lg leading-8 text-[#CBD5E1]">
                Transform raw security scan reports into interactive vulnerability
                insights.
              </p>

              <p className="slide-in-fwd-center delay-200 max-w-xl text-sm leading-5 text-[#94A3B8]">
                Reports are processed entirely in your browser. No data is uploaded or
                stored.
              </p>
            </div>

            <div className="relative mt-16 grid grid-cols-1 items-stretch gap-8 md:grid-cols-2">

              <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                <div className="hidden h-full w-px bg-gradient-to-b from-transparent via-[#273548] to-transparent md:flex" />
                <div className="h-px w-full bg-gradient-to-r from-transparent via-[#273548] to-transparent md:hidden" />

                <span className="scale-fade absolute rounded-md border border-[#273548] bg-[#111827] px-3 py-1 text-xs font-semibold tracking-wider text-[#64748B]">
                  OR
                </span>
              </div>

              {/* Upload Card */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleFileUpload}
              />
              <div role="button"
                tabIndex={0}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}>
                <Card
                  className={`card-reveal card-delay-1 group flex min-h-[260px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center transition-all duration-300
${isDragging
                      ? "border-[#22D3EE] bg-[#182231]/70 shadow-[0_0_30px_rgba(34,211,238,0.18)]"
                      : "border-[#3B82F6] bg-[#182231]/40 hover:border-[#22D3EE]"
                    }`}
                >
                  <div className={`float mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#273548] bg-[#111827] text-[#3B82F6] transition-all duration-300 ${isDragging ? "scale-110" : ""
                    }`}>
                    <svg
                      viewBox="0 0 24 24"
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path d="M12 3v12" />
                      <path d="M7 8l5-5 5 5" />
                      <path d="M5 15v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" />
                    </svg>
                  </div>

                  <h2 className="text-lg font-semibold text-[#F8FAFC]">
                    Upload Security Report
                  </h2>

                  <p className="mt-2 text-sm text-[#CBD5E1]">
                    {fileName || "Click to browse your device"}
                  </p>

                  <p className="mt-6 text-xs text-[#94A3B8]">
                    Supports Trivy and npm audit JSON reports
                  </p>
                </Card>
              </div>
              {/* Paste JSON */}
              <Card className="card-reveal card-delay-2 flex min-h-[260px] flex-col justify-between rounded-2xl border border-[#273548] bg-[#182231]/40 p-6 transition-all duration-300  hover:border-[#22D3EE] ">

                <div className="w-full">
                  <label className="block text-sm font-medium text-[#F8FAFC]">
                    Paste JSON report
                  </label>

                  <textarea
                    value={jsonInput}
                    onChange={(event) => {
                      setJsonInput(event.target.value);
                      if (error) setError("");
                      if (fileName) setFileName("");
                    }}
                    placeholder="Paste your Trivy or npm audit JSON report here..."
                    className="mt-3 h-36 w-full resize-none rounded-xl border border-[#273548] bg-[#111827] p-4 font-mono text-xs text-[#CBD5E1] outline-none transition-all duration-300 "
                  />
                </div>

                <div className="mt-4 flex flex-wrap gap-3 text-xs font-medium">
                  <span
                    className={`transition-colors duration-300 ${jsonInput ? "text-[#22D3EE]" : "text-[#64748B]"
                      }`}
                  >
                    ✓ Trivy JSON
                  </span>

                  <span
                    className={`transition-colors duration-300 ${jsonInput ? "text-[#22D3EE]" : "text-[#64748B]"
                      }`}
                  >
                    ✓ npm audit JSON
                  </span>
                </div>
              </Card>
            </div>
            {/* Buttons */}
            {error && (
              <div className="mt-6 flex justify-center">
                <div className="w-full max-w-md rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-center text-sm text-red-400">
                  {error}
                </div>
              </div>
            )}
            <div className="mt-10 flex flex-col gap-3 border-t border-[#273548]/40 pt-6 sm:flex-row sm:items-center sm:justify-between">

              <Button
                variant="secondary"
                onClick={handleDemo}
                disabled={isProcessing}
                className="w-full transition-all duration-300 hover:-translate-y-1 hover:bg-[#1E293B] active:scale-95 sm:w-auto"
              >
                {isProcessing ? "Loading..." : "Load Demo Report"}
              </Button>

              <Button
                variant="primary"
                onClick={handleAnalyze}
                disabled={isProcessing}
                className={`w-full transition-all duration-300 hover:-translate-y-1 active:scale-95 sm:min-w-[180px] sm:w-auto ${!isProcessing && jsonInput
                  ? "shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.45)]"
                  : ""
                  }`}
              >
                {isProcessing ? "Analyzing..." : "Analyze Report"}
              </Button>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}