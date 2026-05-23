type ErrorStateProps = {
  title?: string;
  message: string;
};

export function ErrorState({
  title = "Algo não saiu como esperado",
  message,
}: ErrorStateProps) {
  return (
    <div className="rounded-lg bg-danger-soft px-5 py-4 shadow-[inset_0_0_0_1px_rgba(150,48,40,0.18)]">
      <h3 className="text-sm font-semibold text-danger">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-danger">{message}</p>
    </div>
  );
}
