type LoadingStateProps = {
  label?: string;
};

export function LoadingState({ label = "Carregando informações..." }: LoadingStateProps) {
  return (
    <div className="flex min-h-40 items-center justify-center rounded-lg bg-surface shadow-[0_0_0_1px_rgba(47,42,36,0.08)]">
      <div className="flex items-center gap-3 text-sm font-medium text-text-secondary">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-primary" />
        {label}
      </div>
    </div>
  );
}
