import type { ReactNode } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  children: ReactNode;
}

export function Button({ variant = 'primary', children, className = '', ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#22D3EE] focus:ring-offset-2 focus:ring-offset-[#0B1220]';
  const variants = {
    primary: 'bg-[#3B82F6] text-[#F8FAFC] hover:bg-[#2563EB]',
    secondary: 'border border-[#273548] bg-transparent text-[#CBD5E1] hover:border-[#3B82F6] hover:text-[#F8FAFC]',
    ghost: 'bg-transparent text-[#CBD5E1] hover:bg-[#1E293B] hover:text-[#F8FAFC]',
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
