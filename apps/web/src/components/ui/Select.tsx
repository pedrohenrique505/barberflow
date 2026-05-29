import type { SelectHTMLAttributes } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  error?: string;
  label: string;
  options: Array<{ label: string; value: string }>;
};

export function Select({
  error,
  id,
  label,
  options,
  className = "",
  ...props
}: SelectProps) {
  const selectId = id ?? props.name;
  const errorId = error && selectId ? `${selectId}-error` : undefined;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-text-primary" htmlFor={selectId}>
        {label}
      </label>
      <select
        aria-describedby={errorId}
        aria-invalid={Boolean(error)}
        className={`min-h-11 w-full rounded-md bg-white px-3 py-2 text-sm text-text-primary shadow-[inset_0_0_0_1px_rgba(47,42,36,0.16)] outline-none transition-shadow duration-150 ease-out focus:shadow-[inset_0_0_0_2px_rgba(47,42,36,0.72)] disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
        id={selectId}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value || option.label} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? (
        <p className="text-sm text-danger" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
