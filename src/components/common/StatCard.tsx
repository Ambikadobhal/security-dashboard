interface StatCardProps {
  label: string;
  value: string | number;
  description?: string;
  tone?: 'critical' | 'high' | 'medium' | 'low' | 'info' | 'neutral';
}

export function StatCard({ label, value, description, tone = 'neutral' }: StatCardProps) {
  const tones = {
    critical: 'border-[#DC2626] bg-[#1F1218]',
    high: 'border-[#F97316] bg-[#221611]',
    medium: 'border-[#FBBF24] bg-[#2A2114]',
    low: 'border-[#22C55E] bg-[#0F2218]',
    info: 'border-[#60A5FA] bg-[#101C2F]',
    neutral: 'border-[#273548] bg-[#182231]',
  };

  return (
    <div className={`rounded-2xl border p-4 ${tones[tone]}`}>
      <p className="text-sm text-[#94A3B8]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[#F8FAFC]">{value}</p>
      {description ? <p className="mt-1 text-sm text-[#CBD5E1]">{description}</p> : null}
    </div>
  );
}
