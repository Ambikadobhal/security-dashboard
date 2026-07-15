interface StatusDotProps {
  color: string;
}

export function StatusDot({ color }: StatusDotProps) {
  return <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />;
}
