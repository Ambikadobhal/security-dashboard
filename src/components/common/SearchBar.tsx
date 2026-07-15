interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder = 'Search findings...' }: SearchBarProps) {
  return (
    <label className="flex items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 shadow-sm">
      <span className="text-slate-400">⌕</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm text-slate-700 outline-none"
      />
    </label>
  );
}
