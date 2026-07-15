interface SectionTitleProps {
  title: string;
  description?: string;
}

export function SectionTitle({ title, description }: SectionTitleProps) {
  return (
    <div className="space-y-1">
      <h2 className="text-xl font-semibold text-[#F8FAFC]">{title}</h2>
      {description ? <p className="text-sm text-[#CBD5E1]">{description}</p> : null}
    </div>
  );
}
