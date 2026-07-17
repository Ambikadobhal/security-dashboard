import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { StatusDot } from '../components/common/statusDot';
import type { Findings } from '../parser/types';

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

  return (
    <div className="min-h-screen bg-[#0B1220] px-4 py-8 text-[#F8FAFC] sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-[20px] border border-[#273548] bg-[#111827] p-6 shadow-[0_10px_30px_rgba(15,23,42,0.35)] md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-[#22D3EE]">Security Overview</p>
            <h1 className="mt-2 text-3xl font-semibold text-[#F8FAFC]">Scan Summary</h1>
            <div className="mt-3 flex flex-wrap gap-3 text-sm text-[#CBD5E1]">
              <span>example.json</span>
              <span>•</span>
              <span>{scanner}</span>
              <span>•</span>
              <span>{generatedTime}</span>
            </div>
          </div>
          <Button variant="secondary" onClick={() => navigate('/')}>Scan New Report</Button>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          {[
            { label: 'Critical', count: criticalCount, tone: 'critical' },
            { label: 'High', count: highCount, tone: 'high' },
            { label: 'Medium', count: mediumCount, tone: 'medium' },
            { label: 'Low', count: lowCount, tone: 'low' },
            { label: 'Fixable', count: fixableCount, tone: 'info' },
            { label: 'Total Findings', count: totalFindings, tone: 'neutral' },
          ].map((item) => {
            const accent = item.tone === 'critical' ? '#DC2626' : item.tone === 'high' ? '#F97316' : item.tone === 'medium' ? '#FBBF24' : item.tone === 'low' ? '#22C55E' : item.tone === 'info' ? '#3B82F6' : '#64748B';
            return (
              <div key={item.label} className="group rounded-[16px] border border-[#273548] bg-[#182231] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#3B82F6]">
                <div className="flex items-center gap-2 text-[#94A3B8]">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: accent }} />
                  <span className="text-sm">{item.label}</span>
                </div>
                <p className="mt-4 text-3xl font-semibold text-[#F8FAFC]">{item.count}</p>
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
                      {chartData.map((entry) => (
                        <Cell key={entry.severity} fill={severityColors[entry.severity] ?? '#64748B'} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value ?? '0', 'findings']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-3">
                {severityDistribution.map((item) => (
                  <div key={item.severity} className="flex items-center justify-between rounded-xl border border-[#273548] bg-[#111827] px-3 py-2">
                    <div className="flex items-center gap-2 text-sm text-[#CBD5E1]">
                      <StatusDot color={severityColors[item.severity] ?? '#64748B'} />
                      <span>{item.severity}</span>
                    </div>
                    <span className="text-xs uppercase tracking-[0.24em] text-[#64748B]">{item.count} findings</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card title="Quick Scan Information" action={<span className="text-sm text-[#94A3B8]">Summary</span>}>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: 'Scanner', value: scanner },
                { label: 'Project', value: projectName },
                { label: 'Timestamp', value: generatedTime },
              ].filter((item) => Boolean(item.value)).map((item) => (
                <div key={item.label} className="rounded-xl border border-[#273548] bg-[#111827] p-4">
                  <p className="text-sm text-[#94A3B8]">{item.label}</p>
                  <p className="mt-2 font-medium text-[#F8FAFC]">{String(item.value)}</p>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <Card title="Highest Priority Findings" action={<span className="text-sm text-[#94A3B8]">Highest priority</span>}>
          <div className="overflow-hidden rounded-[14px] border border-[#273548]">
            <div className="grid grid-cols-[0.8fr_1.2fr_0.9fr_0.8fr_0.9fr_0.7fr] gap-3 bg-[#1E293B] px-4 py-3 text-sm text-[#CBD5E1]">
              <span>Severity</span>
              <span>Vulnerability</span>
              <span>Package</span>
              <span>Installed</span>
              <span>Fixed Version</span>
              <span>Dependency</span>
            </div>
            {topFindings.map((finding) => (
              <div key={finding.id} className="grid grid-cols-[0.8fr_1.2fr_0.9fr_0.8fr_0.9fr_0.7fr] gap-3 border-t border-[#273548] bg-[#182231] px-4 py-3 text-sm text-[#CBD5E1] transition-colors duration-200 hover:bg-[#1E293B]">
                <div className="flex items-center gap-2">
                  <StatusDot color={severityColors[finding.severity] ?? '#64748B'} />
                  <span className="font-medium text-[#F8FAFC]">{finding.severity}</span>
                </div>
                <span className="truncate">{finding.title}</span>
                <span className="truncate">{finding.packageName}</span>
                <span className="truncate">{finding.installedVersion ?? '—'}</span>
                <span className="truncate">{finding.fixedVersion ?? '—'}</span>
                <span className="truncate">{finding.isDirect ? 'Direct' : 'Indirect'}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-end">
            <button className="text-sm font-medium text-[#3B82F6] transition-colors duration-200 hover:text-[#22D3EE]" onClick={() => navigate('/findings')}>
              View All Findings →
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
