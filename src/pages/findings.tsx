import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type PaginationState,
  type SortingState,
} from '@tanstack/react-table';
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
const columnHelper = createColumnHelper<Findings>();

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
  const [selectedFinding, setSelectedFinding] = useState<Findings | null>(null);
  const [sorting, setSorting] = useState<SortingState>([{ id: 'severity', desc: true }]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });

  const normalizedFindings = useMemo(
    () => findings.map((finding) => ({ ...finding, severity: normalizeSeverity(finding.severity) })),
    [findings],
  );

  const packages = useMemo(() => {
    const uniquePackages = new Set(normalizedFindings.map((finding) => finding.packageName).filter(Boolean));
    return Array.from(uniquePackages).sort((left, right) => left.localeCompare(right));
  }, [normalizedFindings]);

  const data = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    return [...normalizedFindings].filter((finding) => {
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
    });
  }, [dependencyFilter, normalizedFindings, onlyFixable, packageFilter, searchValue, severityFilter]);

  const columns = useMemo(
    () => [
      columnHelper.accessor('severity', {
        id: 'severity',
        header: 'Severity',
        cell: ({ getValue }) => {
          const severity = String(getValue()).toUpperCase();
          return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getSeverityTone(severity)}`}>{severity}</span>;
        },
        sortingFn: (rowA, rowB) => {
          const rankA = severityRank[String(rowA.getValue('severity')).toUpperCase()] ?? 0;
          const rankB = severityRank[String(rowB.getValue('severity')).toUpperCase()] ?? 0;
          return rankA - rankB;
        },
      }),
      columnHelper.accessor('vulnerabilityId', {
        id: 'vulnerabilityId',
        header: 'Vulnerability ID',
        cell: ({ getValue }) => <span className="font-medium text-[#F8FAFC]">{formatValue(getValue())}</span>,
      }),
      columnHelper.accessor('title', {
        id: 'title',
        header: 'Title',
        cell: ({ getValue }) => <div className="max-w-[320px] truncate">{formatValue(getValue())}</div>,
      }),
      columnHelper.accessor('packageName', {
        id: 'packageName',
        header: 'Package',
        cell: ({ getValue }) => formatValue(getValue()),
      }),
      columnHelper.accessor('installedVersion', {
        id: 'installedVersion',
        header: 'Installed Version',
        cell: ({ getValue }) => formatValue(getValue()),
      }),
      columnHelper.accessor('fixedVersion', {
        id: 'fixedVersion',
        header: 'Fixed Version',
        cell: ({ getValue }) => formatValue(getValue()),
      }),
      columnHelper.accessor('cvssScore', {
        id: 'cvssScore',
        header: 'CVSS',
        cell: ({ getValue }) => formatValue(getValue()),
      }),
    ],
    [],
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableSortingRemoval: false,
  });

  const selectedReferences = useMemo(() => {
    if (!selectedFinding) return [];
    const references = [...(selectedFinding.references ?? [])];
    if (selectedFinding.advisoryUrl && !references.includes(selectedFinding.advisoryUrl)) {
      references.push(selectedFinding.advisoryUrl);
    }
    return references;
  }, [selectedFinding]);

  const advisoryLink = useMemo(() => {
    if (!selectedFinding) return undefined;
    return selectedFinding.advisoryUrl ?? selectedReferences.find((reference) => /github\.com\/advisories|ghsa/i.test(reference)) ?? selectedReferences[0] ?? undefined;
  }, [selectedFinding, selectedReferences]);

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
          <div className="grid gap-3 lg:grid-cols-[1.6fr_0.8fr_0.8fr_0.8fr]">
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
          </div>

          <label className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[#273548] bg-[#182231] px-3 py-2 text-sm text-[#CBD5E1]">
            <input type="checkbox" checked={onlyFixable} onChange={() => setOnlyFixable((value) => !value)} className="h-4 w-4 rounded border-[#273548] bg-[#0B1220] text-[#3B82F6]" />
            <span>Only Fixable</span>
          </label>
        </section>

        <section className="relative flex min-h-[70vh] gap-4">
          <div className="flex-1 overflow-hidden rounded-[20px] border border-[#273548] bg-[#111827] shadow-[0_10px_30px_rgba(15,23,42,0.35)]">
            <div className="overflow-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead className="sticky top-0 z-10 bg-[#1E293B] text-left text-xs uppercase tracking-[0.24em] text-[#94A3B8]">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th key={header.id} className="px-4 py-3">
                          {header.isPlaceholder ? null : (
                            <button
                              type="button"
                              className="flex items-center gap-2 font-medium uppercase tracking-[0.24em] text-[#94A3B8]"
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              <span className="text-[10px] text-[#64748B]">
                                {header.column.getIsSorted() === 'desc' ? '↓' : header.column.getIsSorted() === 'asc' ? '↑' : '↕'}
                              </span>
                            </button>
                          )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-[#94A3B8]">
                        No findings match the current filters.
                      </td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        tabIndex={0}
                        onClick={() => setSelectedFinding(row.original)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            setSelectedFinding(row.original);
                          }
                        }}
                        className="cursor-pointer border-t border-[#273548] bg-[#182231] text-[#CBD5E1] transition-colors duration-200 hover:bg-[#1E293B]"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="px-4 py-3">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-[#273548] bg-[#0B1220] px-4 py-3 text-sm text-[#CBD5E1]">
              <div>
                Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}–{Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, data.length)} of {data.length}
              </div>
              <div className="flex items-center gap-2">
                <button type="button" className="rounded-lg border border-[#273548] px-3 py-1.5" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                  Previous
                </button>
                <button type="button" className="rounded-lg border border-[#273548] px-3 py-1.5" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                  Next
                </button>
              </div>
            </div>
          </div>

          {selectedFinding ? (
            <>
              <div className="fixed inset-0 z-20 bg-[#020617]/70" onClick={() => setSelectedFinding(null)} />
              <aside className="fixed inset-y-0 right-0 z-30 flex w-full max-w-[440px] flex-col border-l border-[#273548] bg-[#111827] shadow-[0_20px_60px_rgba(2,8,23,0.55)]">
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
                      <p className="mt-3 break-words text-base font-semibold text-[#F8FAFC]">{formatValue(selectedFinding.title)}</p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-[#273548] bg-[#182231] p-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-[#94A3B8]">Package</p>
                        <p className="mt-2 font-medium text-[#F8FAFC]">{formatValue(selectedFinding.packageName)}</p>
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
                      <p className="mt-2 whitespace-pre-wrap leading-6 text-[#CBD5E1]">{formatValue(selectedFinding.description ?? 'No additional description provided for this finding.')}</p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-[#273548] bg-[#182231] p-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-[#94A3B8]">CVSS Score</p>
                        <p className="mt-2 font-medium text-[#F8FAFC]">{formatValue(selectedFinding.cvssScore)}</p>
                      </div>
                      <div className="rounded-2xl border border-[#273548] bg-[#182231] p-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-[#94A3B8]">CVSS Vector</p>
                        <p className="mt-2 break-words font-medium text-[#F8FAFC]">{formatValue(selectedFinding.cvssVector)}</p>
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
                    </div>

                    {selectedFinding.dependencyPath && selectedFinding.dependencyPath.length > 0 ? (
                      <div className="rounded-2xl border border-[#273548] bg-[#182231] p-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-[#94A3B8]">Dependency Path</p>
                        <p className="mt-2 break-words leading-6 text-[#CBD5E1]">{selectedFinding.dependencyPath.join(' → ')}</p>
                      </div>
                    ) : null}

                    {advisoryLink ? (
                      <div className="rounded-2xl border border-[#273548] bg-[#182231] p-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-[#94A3B8]">Advisory Information</p>
                        <a href={advisoryLink} target="_blank" rel="noreferrer" className="mt-2 block break-words leading-6 text-[#60A5FA] underline-offset-2 hover:text-[#22D3EE]">
                          {advisoryLink}
                        </a>
                      </div>
                    ) : null}
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
