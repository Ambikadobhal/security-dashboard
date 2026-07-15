import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Findings } from '../parser/types';

interface FindingsPageProps {
  findings: Findings[];
}

const severityOrder = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'] as const;
const severityRank: Record<string, number> = {
  CRITICAL: 5,
  HIGH: 4,
  MEDIUM: 3,
  LOW: 2,
  INFO: 1,
};

function normalizeSeverity(value?: string) {
  const normalized = (value ?? '').trim().toUpperCase();
  if (normalized === 'MODERATE') return 'MEDIUM';
  if (normalized === 'UNKNOWN' || normalized === 'INFO') return 'INFO';
  return severityOrder.includes(normalized as (typeof severityOrder)[number]) ? normalized : 'INFO';
}

function getSeverityTone(severity: string) {
  const normalized = severity.toUpperCase();
  if (normalized === 'CRITICAL') return 'bg-[#7F1D1D] text-[#FECACA]';
  if (normalized === 'HIGH') return 'bg-[#9A2C00] text-[#FED7AA]';
  if (normalized === 'MEDIUM') return 'bg-[#854D0E] text-[#FEF3C7]';
  if (normalized === 'LOW') return 'bg-[#166534] text-[#DCFCE7]';
  return 'bg-[#1D4ED8] text-[#DBEAFE]';
}

function getStatusText(finding: Findings) {
  if (finding.fixedVersion) return 'Fixable';
  if (finding.severity?.toLowerCase() === 'critical' || finding.severity?.toLowerCase() === 'high') return 'Open';
  return 'Observed';
}

function formatValue(value?: string | number | null) {
  if (value === undefined || value === null || value === '') return '—';
  return String(value);
}

export default function FindingsPage({ findings }: FindingsPageProps) {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [packageFilter, setPackageFilter] = useState('ALL');
  const [dependencyFilter, setDependencyFilter] = useState('ALL');
  const [onlyFixable, setOnlyFixable] = useState(false);
  const [sortMode, setSortMode] = useState('severity');
  const [selectedFinding, setSelectedFinding] = useState<Findings | null>(null);

  const normalizedFindings = useMemo(
    () => findings.map((finding) => ({ ...finding, severity: normalizeSeverity(finding.severity) })),
    [findings],
  );

  const packages = useMemo(() => {
    const uniquePackages = new Set(normalizedFindings.map((finding) => finding.packageName).filter(Boolean));
    return Array.from(uniquePackages).sort((left, right) => left.localeCompare(right));
  }, [normalizedFindings]);

  const filteredFindings = useMemo(() => {
    const query = searchValue.trim().toLowerCase();

    return [...normalizedFindings]
      .filter((finding) => {
        const severity = (finding.severity ?? 'info').toUpperCase();
        const matchesSearch =
          !query ||
          [finding.vulnerabilityId, finding.title, finding.packageName, finding.target, finding.description ?? '']
            .join(' ')
            .toLowerCase()
            .includes(query);
        const matchesSeverity = severityFilter === 'ALL' || severity === severityFilter;
        const matchesPackage = packageFilter === 'ALL' || finding.packageName === packageFilter;
        const matchesDependency =
          dependencyFilter === 'ALL' ||
          (dependencyFilter === 'DIRECT' && finding.isDirect) ||
          (dependencyFilter === 'TRANSITIVE' && !finding.isDirect);
        const matchesFixable = !onlyFixable || Boolean(finding.fixedVersion);
        return matchesSearch && matchesSeverity && matchesPackage && matchesDependency && matchesFixable;
      })
      .sort((left, right) => {
        if (sortMode === 'severity') {
          return severityRank[right.severity?.toUpperCase() ?? 'INFO'] - severityRank[left.severity?.toUpperCase() ?? 'INFO'] ||
            left.vulnerabilityId.localeCompare(right.vulnerabilityId);
        }
        if (sortMode === 'package') {
          return left.packageName.localeCompare(right.packageName);
        }
        if (sortMode === 'title') {
          return left.title.localeCompare(right.title);
        }
        return left.vulnerabilityId.localeCompare(right.vulnerabilityId);
      });
  }, [dependencyFilter, normalizedFindings, onlyFixable, packageFilter, searchValue, severityFilter, sortMode]);

  const selectedReferences = useMemo(() => {
    if (!selectedFinding) return [];
    const references = [...(selectedFinding.references ?? [])];
    if (selectedFinding.advisoryUrl && !references.includes(selectedFinding.advisoryUrl)) {
      references.push(selectedFinding.advisoryUrl);
    }
    return references;
  }, [selectedFinding]);

  return (
    <div className="min-h-screen bg-[#0B1220] px-4 py-6 text-[#F8FAFC] sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-4">
        <header className="rounded-[20px] border border-[#273548] bg-[#111827] p-6 shadow-[0_10px_30px_rgba(15,23,42,0.35)]">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.28em] text-[#22D3EE]">Findings</p>
              <h1 className="mt-2 text-3xl font-semibold text-[#F8FAFC]">Findings</h1>
              <p className="mt-2 text-sm text-[#94A3B8]">{findings.length} total findings</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center justify-center rounded-xl border border-[#273548] bg-transparent px-4 py-2 text-sm font-medium text-[#CBD5E1] transition-all duration-200 hover:border-[#3B82F6] hover:text-[#F8FAFC]"
            >
              Back to Overview
            </button>
          </div>
        </header>

        <section className="rounded-[20px] border border-[#273548] bg-[#111827] p-4 shadow-[0_10px_30px_rgba(15,23,42,0.35)]">
          <div className="grid gap-3 lg:grid-cols-[1.6fr_0.8fr_0.8fr_0.8fr_0.6fr]">
            <label className="flex flex-col gap-2 text-sm text-[#CBD5E1]">
              <span>Search vulnerabilities</span>
              <input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search CVE, title, package..."
                className="rounded-xl border border-[#273548] bg-[#0B1220] px-3 py-2.5 text-sm text-[#F8FAFC] outline-none transition-colors duration-200 focus:border-[#22D3EE]"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm text-[#CBD5E1]">
              <span>Severity</span>
              <select
                value={severityFilter}
                onChange={(event) => setSeverityFilter(event.target.value)}
                className="rounded-xl border border-[#273548] bg-[#0B1220] px-3 py-2.5 text-sm text-[#F8FAFC] outline-none transition-colors duration-200 focus:border-[#22D3EE]"
              >
                <option value="ALL">All severities</option>
                {severityOrder.map((severity) => (
                  <option key={severity} value={severity}>
                    {severity}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm text-[#CBD5E1]">
              <span>Package</span>
              <select
                value={packageFilter}
                onChange={(event) => setPackageFilter(event.target.value)}
                className="rounded-xl border border-[#273548] bg-[#0B1220] px-3 py-2.5 text-sm text-[#F8FAFC] outline-none transition-colors duration-200 focus:border-[#22D3EE]"
              >
                <option value="ALL">All packages</option>
                {packages.map((packageName) => (
                  <option key={packageName} value={packageName}>
                    {packageName}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm text-[#CBD5E1]">
              <span>Dependency</span>
              <select
                value={dependencyFilter}
                onChange={(event) => setDependencyFilter(event.target.value)}
                className="rounded-xl border border-[#273548] bg-[#0B1220] px-3 py-2.5 text-sm text-[#F8FAFC] outline-none transition-colors duration-200 focus:border-[#22D3EE]"
              >
                <option value="ALL">All</option>
                <option value="DIRECT">Direct</option>
                <option value="TRANSITIVE">Transitive</option>
              </select>
            </label>

            <label className="flex flex-col justify-end gap-2 text-sm text-[#CBD5E1]">
              <span>Sort</span>
              <select
                value={sortMode}
                onChange={(event) => setSortMode(event.target.value)}
                className="rounded-xl border border-[#273548] bg-[#0B1220] px-3 py-2.5 text-sm text-[#F8FAFC] outline-none transition-colors duration-200 focus:border-[#22D3EE]"
              >
                <option value="severity">Severity</option>
                <option value="id">Vulnerability ID</option>
                <option value="package">Package</option>
                <option value="title">Title</option>
              </select>
            </label>
          </div>

          <label className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[#273548] bg-[#182231] px-3 py-2 text-sm text-[#CBD5E1]">
            <input type="checkbox" checked={onlyFixable} onChange={() => setOnlyFixable((value) => !value)} className="h-4 w-4 rounded border-[#273548] bg-[#0B1220] text-[#3B82F6]" />
            <span>Only Fixable</span>
          </label>
        </section>

        <section className="flex min-h-[70vh] gap-4">
          <div className="flex-1 overflow-hidden rounded-[20px] border border-[#273548] bg-[#111827] shadow-[0_10px_30px_rgba(15,23,42,0.35)]">
            <div className="overflow-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead className="sticky top-0 z-10 bg-[#1E293B] text-left text-xs uppercase tracking-[0.24em] text-[#94A3B8]">
                  <tr>
                    <th className="px-4 py-3">Severity</th>
                    <th className="px-4 py-3">Vulnerability ID</th>
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Package</th>
                    <th className="px-4 py-3">Installed Version</th>
                    <th className="px-4 py-3">Fixed Version</th>
                    <th className="px-4 py-3">Dependency Type</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFindings.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-[#94A3B8]">
                        No findings match the current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredFindings.map((finding) => {
                      const severity = (finding.severity ?? 'info').toUpperCase();
                      return (
                        <tr
                          key={finding.id}
                          tabIndex={0}
                          onClick={() => setSelectedFinding(finding)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              setSelectedFinding(finding);
                            }
                          }}
                          className="cursor-pointer border-t border-[#273548] bg-[#182231] text-[#CBD5E1] transition-colors duration-200 hover:bg-[#1E293B]"
                        >
                          <td className="px-4 py-3">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getSeverityTone(severity)}`}>
                              {severity}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-medium text-[#F8FAFC]">{formatValue(finding.vulnerabilityId)}</td>
                          <td className="max-w-[320px] px-4 py-3">
                            <div className="truncate">{formatValue(finding.title)}</div>
                          </td>
                          <td className="px-4 py-3">{formatValue(finding.packageName)}</td>
                          <td className="px-4 py-3">{formatValue(finding.installedVersion)}</td>
                          <td className="px-4 py-3">{formatValue(finding.fixedVersion)}</td>
                          <td className="px-4 py-3">{finding.isDirect ? 'Direct' : 'Transitive'}</td>
                          <td className="px-4 py-3">{getStatusText(finding)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {selectedFinding ? (
            <>
              <div className="fixed inset-0 z-10 bg-[#020617]/70 lg:hidden" onClick={() => setSelectedFinding(null)} />
              <aside className="fixed inset-y-0 right-0 z-20 flex w-full max-w-[440px] flex-col border-l border-[#273548] bg-[#111827] shadow-[0_20px_60px_rgba(2,8,23,0.55)] lg:static lg:h-auto lg:rounded-[20px] lg:border lg:shadow-[0_10px_30px_rgba(15,23,42,0.35)]">
                <div className="flex items-center justify-between border-b border-[#273548] px-5 py-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-[#22D3EE]">Vulnerability Details</p>
                    <h2 className="mt-1 text-lg font-semibold text-[#F8FAFC]">{selectedFinding.vulnerabilityId}</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedFinding(null)}
                    className="rounded-full border border-[#273548] p-2 text-[#CBD5E1] transition-colors duration-200 hover:border-[#3B82F6] hover:text-[#F8FAFC]"
                  >
                    ×
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-5 py-5">
                  <div className="space-y-4 text-sm text-[#CBD5E1]">
                    <div className="rounded-2xl border border-[#273548] bg-[#182231] p-4">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getSeverityTone((selectedFinding.severity ?? 'info').toUpperCase())}`}>
                          {(selectedFinding.severity ?? 'info').toUpperCase()}
                        </span>
                        <span className="text-[#94A3B8]">{formatValue(selectedFinding.title)}</span>
                      </div>
                      <p className="mt-3 text-base font-semibold text-[#F8FAFC]">{formatValue(selectedFinding.title)}</p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-[#273548] bg-[#182231] p-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-[#94A3B8]">Package</p>
                        <p className="mt-2 font-medium text-[#F8FAFC]">{formatValue(selectedFinding.packageName)}</p>
                      </div>
                      <div className="rounded-2xl border border-[#273548] bg-[#182231] p-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-[#94A3B8]">Dependency Type</p>
                        <p className="mt-2 font-medium text-[#F8FAFC]">{selectedFinding.isDirect ? 'Direct' : 'Transitive'}</p>
                      </div>
                      <div className="rounded-2xl border border-[#273548] bg-[#182231] p-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-[#94A3B8]">Installed Version</p>
                        <p className="mt-2 font-medium text-[#F8FAFC]">{formatValue(selectedFinding.installedVersion)}</p>
                      </div>
                      <div className="rounded-2xl border border-[#273548] bg-[#182231] p-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-[#94A3B8]">Fixed Version</p>
                        <p className="mt-2 font-medium text-[#F8FAFC]">{formatValue(selectedFinding.fixedVersion)}</p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[#273548] bg-[#182231] p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-[#94A3B8]">Description</p>
                      <p className="mt-2 leading-6 text-[#CBD5E1]">{formatValue(selectedFinding.description ?? 'No additional description provided for this finding.')}</p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-[#273548] bg-[#182231] p-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-[#94A3B8]">CVSS Score</p>
                        <p className="mt-2 font-medium text-[#F8FAFC]">{formatValue(selectedFinding.cvssScore)}</p>
                      </div>
                      <div className="rounded-2xl border border-[#273548] bg-[#182231] p-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-[#94A3B8]">CWE</p>
                        <p className="mt-2 font-medium text-[#F8FAFC]">{(selectedFinding.cweIds ?? []).join(', ') || '—'}</p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[#273548] bg-[#182231] p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-[#94A3B8]">References</p>
                      <div className="mt-3 space-y-2">
                        {selectedReferences.length === 0 ? (
                          <p className="text-[#CBD5E1]">No references available.</p>
                        ) : (
                          selectedReferences.map((reference) => (
                            <a
                              key={reference}
                              href={reference}
                              target="_blank"
                              rel="noreferrer"
                              className="block truncate text-[#60A5FA] underline-offset-2 hover:text-[#22D3EE]"
                            >
                              {reference}
                            </a>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-[#273548] bg-[#182231] p-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-[#94A3B8]">Published Date</p>
                        <p className="mt-2 font-medium text-[#F8FAFC]">{formatValue(selectedFinding.publishedAt)}</p>
                      </div>
                      <div className="rounded-2xl border border-[#273548] bg-[#182231] p-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-[#94A3B8]">Status</p>
                        <p className="mt-2 font-medium text-[#F8FAFC]">{getStatusText(selectedFinding)}</p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[#273548] bg-[#182231] p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-[#94A3B8]">Affected Paths</p>
                      <p className="mt-2 leading-6 text-[#CBD5E1]">{formatValue(selectedFinding.target)}</p>
                      {selectedFinding.dependencyPath && selectedFinding.dependencyPath.length > 0 ? (
                        <p className="mt-2 leading-6 text-[#CBD5E1]">{selectedFinding.dependencyPath.join(' → ')}</p>
                      ) : null}
                    </div>

                    <div className="rounded-2xl border border-[#273548] bg-[#182231] p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-[#94A3B8]">Advisory Information</p>
                      <p className="mt-2 leading-6 text-[#CBD5E1]">{formatValue(selectedFinding.advisoryUrl)}</p>
                    </div>
                  </div>
                </div>
              </aside>
            </>
          ) : null}
        </section>
      </div>
    </div>
  );
}
