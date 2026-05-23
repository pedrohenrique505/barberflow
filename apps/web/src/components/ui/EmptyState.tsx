type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="rounded-lg bg-surface-muted px-5 py-8 text-center shadow-[inset_0_0_0_1px_rgba(47,42,36,0.08)]">
      <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-text-secondary">
        {description}
      </p>
    </div>
  );
}
