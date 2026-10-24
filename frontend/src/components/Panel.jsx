import React from "react";

/**
 * Shared card chrome used by every widget on the dashboard:
 * title + description on the left, optional meta/actions on the right,
 * hairline divider, then the body.
 */
export const Panel = ({
  title,
  description,
  meta,
  actions,
  footer,
  className = "",
  bodyClassName = "",
  children,
}) => (
  <section
    className={`flex h-full min-w-0 flex-col rounded-lg border border-ink-600 bg-ink-800 shadow-panel ${className}`}
  >
    <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 border-b border-ink-600 px-5 py-3.5">
      <div className="min-w-0">
        <h3 className="text-[15px] font-semibold leading-6 text-fg">{title}</h3>
        {description && (
          <p className="text-[13px] leading-5 text-fg-3">{description}</p>
        )}
      </div>
      {(meta || actions) && (
        <div className="flex items-center gap-3">
          {meta}
          {actions}
        </div>
      )}
    </header>
    <div className={`relative min-h-0 flex-1 ${bodyClassName}`}>{children}</div>
    {footer && <footer className="relative border-t border-ink-600">{footer}</footer>}
  </section>
);

/** Loading and error states, sized to sit inside a Panel body. */
export const PanelState = ({ kind, title, detail, className = "h-full" }) => {
  if (kind === "loading") {
    return (
      <div
        role="status"
        aria-live="polite"
        className={`relative flex flex-col items-center justify-center gap-3 overflow-hidden ${className}`}
      >
        <span className="size-5 animate-spin rounded-full border-2 border-ink-500 border-t-accent motion-reduce:animate-none" />
        <span className="text-[13px] text-fg-2">{title}</span>
        <span
          aria-hidden
          className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.025] to-transparent motion-safe:animate-[shimmer_1.8s_infinite]"
        />
      </div>
    );
  }

  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center gap-2 px-6 text-center ${className}`}
    >
      <span className="flex size-9 items-center justify-center rounded-full border border-crit/40 bg-crit/10 text-crit">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
        </svg>
      </span>
      <div className="font-semibold text-fg">{title}</div>
      <div className="max-w-sm break-words font-mono text-xs text-fg-3">{detail}</div>
    </div>
  );
};

export default Panel;
