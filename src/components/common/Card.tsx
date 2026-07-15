import type { ReactNode } from 'react';

interface CardProps {
  title?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}

export function Card({ title, children, className = '', action }: CardProps) {
  return (
    <section className={`rounded-2xl border border-[#273548] bg-[#182231] p-6 shadow-[0_10px_30px_rgba(15,23,42,0.35)] ${className}`.trim()}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title ? <h3 className="text-lg font-semibold text-[#F8FAFC]">{title}</h3> : null}
          {action ? <div>{action}</div> : null}
        </div>
      )}
      {children}
    </section>
  );
}
