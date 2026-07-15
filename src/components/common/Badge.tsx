interface BadgeProps {
  children: React.ReactNode;
  tone?: 'critical' | 'high' | 'medium' | 'low' | 'info' | 'neutral';
  className?: string;
}

export function Badge({ children, tone = 'neutral', className = '' }: BadgeProps) {
  const tones = {
    critical: 'bg-[#DC2626] text-[#F8FAFC]',
    high: 'bg-[#F97316] text-[#F8FAFC]',
    medium: 'bg-[#FBBF24] text-[#0B1220]',
    low: 'bg-[#22C55E] text-[#0B1220]',
    info: 'bg-[#60A5FA] text-[#0B1220]',
    neutral: 'bg-[#1E293B] text-[#CBD5E1]',
  };

  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]} ${className}`.trim()}>{children}</span>;
}
