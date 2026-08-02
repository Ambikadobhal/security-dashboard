import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { StatusDot } from '../components/common/statusDot';
import type { Findings } from '../parser/types';
import { ShieldAlert, TriangleAlert, AlertCircle, ShieldCheck, Wrench } from "lucide-react";
import { File as FileIcon, ShieldCheck as ShieldCheckIcon, Box as BoxIcon, Clock as ClockIcon, AlertTriangle as AlertTriangleIcon } from 'lucide-react';

interface DashboardPageProps {
  findings: Findings[];
}

const severityOrder = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'] as const;
const severityColors: Record<string, string> = {
  CRITICAL: '#DC2626',
  HIGH: '#F97316',
  MEDIUM: '#FBBF24',
  LOW: '#22C55E',
  INFO: '#60A5FA',
};

function normalizeSeverity(value?: string) {
  const normalized = (value ?? 'info').trim().toUpperCase();
  if (normalized === 'MODERATE') return 'MEDIUM';
  if (normalized === 'UNKNOWN' || normalized === 'INFO') return 'INFO';
  return severityOrder.includes(normalized as (typeof severityOrder)[number]) ? normalized : 'INFO';
}

function getSeverityValue(findings: Findings[], severity: string) {
  return findings.filter((finding) => normalizeSeverity(finding.severity) === severity).length;
}

function formatScanTime(raw: string): string {
  try {
    const date = new Date(raw);
    if (isNaN(date.getTime())) return raw;
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return raw;
  }
}

function isScanStale(raw: string, thresholdDays = 7): boolean {
  try {
    const date = new Date(raw);
    if (isNaN(date.getTime())) return false;
    return (Date.now() - date.getTime()) > thresholdDays * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export default function DashboardPage({ findings }: DashboardPageProps) {
  const navigate = useNavigate();
  const normalizedFindings = useMemo(() => findings.map((finding) => ({ ...finding, severity: normalizeSeverity(finding.severity) })), [findings]);
  const severityDistribution = severityOrder.map((severity) => ({ severity, count: getSeverityValue(normalizedFindings, severity) }));
  const totalFindings = normalizedFindings.length;
  const criticalCount = getSeverityValue(normalizedFindings, 'CRITICAL');
  const highCount = getSeverityValue(normalizedFindings, 'HIGH');
  const mediumCount = getSeverityValue(normalizedFindings, 'MEDIUM');
  const lowCount = getSeverityValue(normalizedFindings, 'LOW');
  const fixableCount = normalizedFindings.filter((finding) => Boolean(finding.fixedVersion)).length;

  const topFindings = [...normalizedFindings]
    .sort((left, right) => {
      const rank = (severity: string) => ({ CRITICAL: 5, HIGH: 4, MEDIUM: 3, LOW: 2, INFO: 1 }[severity] ?? 0);
      return rank(right.severity) - rank(left.severity);
    })
    .slice(0, 5);

  const scanner = normalizedFindings[0]?.scanner ?? 'Unknown';
  const projectName = normalizedFindings[0]?.target ?? 'Unspecified';
  const generatedTime = normalizedFindings[0]?.publishedAt ?? 'Not available';
  const chartData = useMemo(
    () => severityDistribution.filter((item) => item.count > 0),
    [severityDistribution],
  );

  const riskScore = Math.min(100, criticalCount * 20 + highCount * 10 + mediumCount * 5 + lowCount * 2);
  const scanStale = isScanStale(generatedTime);

  return (
    <div className="min-h-screen bg-[#0B1220] px-4 py-8 text-[#F8FAFC] sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-5 rounded-2xl border border-[#1F2937] bg-[#111827] p-7">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <h1 className="text-[28px] font-medium text-[#F8FAFC]">Scan Summary</h1>
            <Button variant="secondary" onClick={() => navigate('/')} className="rounded-[10px] bg-[#F8FAFC] px-5 py-2.5 text-sm font-medium text-[#0F172A] hover:border-[#3B82F6] hover:text-[#F8FAFC]">
              Scan New Report
            </Button>
          </div>
          <div className="h-px bg-[#1F2937]" />
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-5">
              <div className="flex items-center gap-1.5">
                <FileIcon className="h-[15px] w-[15px] text-[#475569]" />
                <span className="text-[13px] text-[#94A3B8]">example.json</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheckIcon className="h-[15px] w-[15px] text-[#475569]" />
                <span className="text-[13px] text-[#94A3B8]">{scanner}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <BoxIcon className="h-[15px] w-[15px] text-[#475569]" />
                <span className="text-[13px] text-[#94A3B8]">{projectName}</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1.5">
                <ClockIcon className="h-[15px] w-[15px] text-[#475569]" />
                <span className="text-[13px] text-[#94A3B8]">{formatScanTime(generatedTime)}</span>
              </div>
              {scanStale && (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-yellow-400/10 px-2.5 py-1 text-xs font-medium text-yellow-400">
                  <AlertTriangleIcon className="h-[13px] w-[13px]" />
                  Outdated
                </span>
              )}
            </div>
          </div>
        </header>
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {[
            { label: "Critical", count: criticalCount, tone: "critical", icon: ShieldAlert, helper: "Immediate action" },
            { label: "High", count: highCount, tone: "high", icon: TriangleAlert, helper: "Needs review" },
            { label: "Medium", count: mediumCount, tone: "medium", icon: AlertCircle, helper: "Monitor" },
            { label: "Low", count: lowCount, tone: "low", icon: ShieldCheck, helper: "Low priority" },
            { label: "Fixable", count: fixableCount, tone: "info", icon: Wrench, helper: "Ready to patch" }
          ].map((item) => {
            const accent =
              item.tone === "critical" ? "#DC2626"
                : item.tone === "high" ? "#F97316"
                  : item.tone === "medium" ? "#FBBF24"
                    : item.tone === "low" ? "#22C55E"
                      : "#3B82F6";
            const Icon = item.icon;
            return (
              <div key={item.label} className="group rounded-2xl border border-[#273548] bg-gradient-to-br from-[#182231] to-[#111827] p-5 transition-all duration-300">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${accent}20` }}>
                    <Icon size={20} strokeWidth={2} style={{ color: accent }} />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-[#E2E8F0]">{item.label}</p>
                    <p className="text-xs text-[#64748B]">{item.helper}</p>
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-center">
                  <p className="text-4xl font-bold" style={{ color: accent }}>
                    {item.count}
                  </p>
                </div>
              </div>
            );
          })}
        </section>
        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <Card title="Severity Distribution" action={<span className="text-sm text-[#94A3B8]">Current scan</span>}>
            <div className="flex flex-col gap-6 md:flex-row md:items-center">
              <div className="mx-auto h-52 w-full max-w-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} dataKey="count" nameKey="severity" innerRadius={64} outerRadius={96} paddingAngle={2}>
                      {chartData.map((entry) => <Cell key={entry.severity} fill={severityColors[entry.severity] ?? "#64748B"} />)}
                    </Pie>
                    <Tooltip formatter={(value) => [value ?? "0", "findings"]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex-1 space-y-3">
                {severityDistribution.filter((item) => item.count > 0).map((item) => (
                  <div key={item.severity} className="flex items-center justify-between rounded-xl border border-[#273548] bg-[#111827] px-3 py-2">
                    <div className="flex items-center gap-2 text-sm text-[#CBD5E1]">
                      <StatusDot color={severityColors[item.severity] ?? "#64748B"} />
                      <span>{item.severity}</span>
                    </div>
                    <span className="text-xs uppercase tracking-[0.24em] text-[#64748B]">{item.count} findings</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card title="Security Posture" action={<span className="text-xs text-[#94A3B8]">Live Analysis</span>}>
            <div className="grid gap-4">
              <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
                <div className="rounded-xl border border-[#273548] bg-gradient-to-br from-[#111827] to-[#182231] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#94A3B8]">Overall Risk</p>

                  <div className="mt-3 flex items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${criticalCount > 0 ? "bg-red-500/10 text-red-400" : highCount > 0 ? "bg-orange-500/10 text-orange-400" : mediumCount > 0 ? "bg-yellow-500/10 text-yellow-400" : "bg-green-500/10 text-green-400"}`}>
                      {criticalCount > 0 ? "CRITICAL" : highCount > 0 ? "HIGH" : mediumCount > 0 ? "MEDIUM" : "LOW"}
                    </span>
                  </div>

                  <p className="mt-3 text-xs leading-5 text-[#94A3B8]">
                    {criticalCount > 0 ? "Immediate remediation is recommended before deployment." : highCount > 0 ? "Resolve high-risk packages before the next release." : mediumCount > 0 ? "Monitor medium-risk findings and schedule remediation." : "No significant security risks detected."}
                  </p>
                </div>

                <div className="rounded-xl border border-[#273548] bg-[#111827] p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-[0.18em] text-[#94A3B8]">Risk Score</p>
                    <span className="text-[10px] text-[#64748B]">higher = worse</span>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div>
                      <p className="text-4xl font-bold text-white">{riskScore}<span className="text-base text-[#64748B]"> /100</span></p>
                    </div>

                    <div className="flex h-14 w-14 items-center justify-center rounded-full border-[3px] text-base font-semibold" style={{ borderColor: riskScore >= 80 ? "#DC2626" : riskScore >= 50 ? "#F97316" : riskScore >= 20 ? "#FBBF24" : "#22C55E", color: riskScore >= 80 ? "#DC2626" : riskScore >= 50 ? "#F97316" : riskScore >= 20 ? "#FBBF24" : "#22C55E" }}>
                      {riskScore}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border border-[#273548] bg-[#111827] p-4">
                  <p className="text-xs uppercase tracking-wide text-[#94A3B8]">Fix Coverage</p>
                  <p className="mt-2 text-2xl font-bold text-[#22C55E]">{totalFindings === 0 ? 0 : Math.round((fixableCount / totalFindings) * 100)}%</p>

                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#1F2937]">
                    <div className="h-full rounded-full bg-[#22C55E]" style={{ width: `${totalFindings === 0 ? 0 : Math.round((fixableCount / totalFindings) * 100)}%` }} />
                  </div>
                </div>

                <div className="rounded-xl border border-[#273548] bg-[#111827] p-4">
                  <p className="text-xs uppercase tracking-wide text-[#94A3B8]">Unique Packages</p>
                  <p className="mt-2 text-2xl font-bold text-white">{new Set(normalizedFindings.map((f) => f.packageName)).size}</p>
                  <p className="mt-1 text-[11px] text-[#64748B]">Unique vulnerable packages</p>
                </div>

                <div className="rounded-xl border border-[#273548] bg-[#111827] p-4">
                  <p className="text-xs uppercase tracking-wide text-[#94A3B8]">First-level Dependencies</p>
                  <p className="mt-2 text-2xl font-bold text-white">{normalizedFindings.filter((f) => f.isDirect).length}</p>
                </div>

                <div className="rounded-xl border border-[#273548] bg-[#111827] p-4">
                  <p className="text-xs uppercase tracking-wide text-[#94A3B8]">Recommended Action</p>

                  <div className="mt-3">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${criticalCount > 0 ? "bg-red-500/10 text-red-400" : highCount > 0 ? "bg-orange-500/10 text-orange-400" : "bg-green-500/10 text-green-400"}`}>
                      {criticalCount > 0 ? "Patch Critical Issues" : highCount > 0 ? "Upgrade High Risk Packages" : "Scan Passed"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </section>
        <Card title="Highest Priority Findings">
          <div className="overflow-hidden rounded-[14px] border border-[#273548]">
            <div className="grid grid-cols-[0.8fr_1.2fr_0.9fr_0.8fr_0.9fr_0.7fr] gap-3 bg-[#1E293B] px-4 py-3 text-sm text-[#CBD5E1]">
              <span>Severity</span>
              <span>Vulnerability</span>
              <span>Package</span>
              <span>Installed</span>
              <span>Fixed Version <span className="text-[10px] font-normal normal-case tracking-normal text-[#64748B]"></span></span>
              <span>Dependency</span>
            </div>

            {topFindings.map((finding) => (
              <div key={finding.id} className="grid grid-cols-[0.8fr_1.2fr_0.9fr_0.8fr_0.9fr_0.7fr] gap-3 border-t border-[#273548] bg-[#182231] px-4 py-3 text-sm text-[#CBD5E1] transition-colors duration-200 hover:bg-[#1E293B]">
                <div className="flex items-center gap-2">
                  <StatusDot color={severityColors[finding.severity] ?? "#64748B"} />
                  <span className="font-medium text-[#F8FAFC]">{finding.severity}</span>
                </div>

                <span className="truncate" title={finding.title}>{finding.title}</span>
                <span className="truncate">{finding.packageName}</span>
                <span className="truncate">{finding.installedVersion ?? "—"}</span>
                <span className="truncate">{finding.fixedVersion ?? "—"}</span>
                <span className="truncate">{finding.isDirect ? "Direct" : "Indirect"}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-end">
            <button className="text-sm font-medium text-[#3B82F6] transition-colors duration-200 hover:text-[#22D3EE]" onClick={() => navigate("/findings")}>
              View All Findings →
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
