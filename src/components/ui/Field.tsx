"use client";

import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

const controlClass =
  "w-full border border-outline-variant bg-transparent px-4 py-3 font-body text-body-md transition-colors placeholder:text-text-muted/60 focus:border-marketplace-bronze focus:outline-none focus-visible:ring-1 focus-visible:ring-marketplace-bronze disabled:cursor-not-allowed disabled:bg-surface-container-low disabled:text-text-muted";

const labelClass = "font-body text-label-sm uppercase tracking-widest text-on-surface-variant";

/** Label + control + hint/error, with the association wired automatically. */
function FieldShell({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div data-invalid={error ? "true" : undefined}>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div className="mt-1.5">{children}</div>
      {error ? (
        <p className="mt-1.5 font-label-sm text-label-sm text-error" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 font-label-sm text-label-sm text-text-muted">{hint}</p>
      )}
    </div>
  );
}

interface FieldBase {
  label: string;
  hint?: string;
  error?: string;
}

export function TextField({
  label,
  hint,
  error,
  id,
  className = "",
  ...props
}: FieldBase & InputHTMLAttributes<HTMLInputElement>) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  return (
    <FieldShell id={fieldId} label={label} hint={hint} error={error}>
      <input
        id={fieldId}
        aria-invalid={error ? true : undefined}
        className={`${controlClass} ${className}`}
        {...props}
      />
    </FieldShell>
  );
}

export function TextAreaField({
  label,
  hint,
  error,
  id,
  className = "",
  ...props
}: FieldBase & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  return (
    <FieldShell id={fieldId} label={label} hint={hint} error={error}>
      <textarea
        id={fieldId}
        aria-invalid={error ? true : undefined}
        className={`${controlClass} resize-y ${className}`}
        {...props}
      />
    </FieldShell>
  );
}

export function SelectField({
  label,
  hint,
  error,
  id,
  className = "",
  children,
  ...props
}: FieldBase & SelectHTMLAttributes<HTMLSelectElement>) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  return (
    <FieldShell id={fieldId} label={label} hint={hint} error={error}>
      <select
        id={fieldId}
        aria-invalid={error ? true : undefined}
        className={`${controlClass} ${className}`}
        {...props}
      >
        {children}
      </select>
    </FieldShell>
  );
}

/** A value the user can see but not change — e.g. the account email. */
export function ReadOnlyField({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div>
      <p className={labelClass}>{label}</p>
      <p className="mt-1.5 border border-outline-variant bg-surface-container-low px-4 py-3 font-body text-body-md text-text-muted">
        {value}
      </p>
      {hint && <p className="mt-1.5 font-label-sm text-label-sm text-text-muted">{hint}</p>}
    </div>
  );
}

/** Groups related fields under a heading, with an optional description. */
export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="border border-outline-variant p-8">
      <h2 className="font-display text-headline-sm">{title}</h2>
      {description && (
        <p className="mt-2 font-body text-body-md text-on-surface-variant">{description}</p>
      )}
      <div className="mt-6 space-y-5">{children}</div>
    </section>
  );
}
