import React, { useCallback, useEffect, useRef, useState } from "react";
import Panel from "./Panel";

const SLOW_AFTER_MS = 12000;

// Third-party maps only need scripts, their own storage and popups.
// Everything else (top navigation, downloads, ...) stays blocked.
const DEFAULT_SANDBOX =
  "allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms";

const Icon = ({ path }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="size-4"
    aria-hidden
  >
    <path d={path} />
  </svg>
);

const ICONS = {
  reload: "M20 12a8 8 0 1 1-2.34-5.66M20 4v5h-5",
  expand: "M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5",
  collapse: "M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5",
  external: "M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5",
  info: "M12 11v5m0-8.5h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
};

const actionClass =
  "inline-flex size-8 items-center justify-center rounded-md border border-transparent text-fg-3 transition-colors hover:border-ink-500 hover:bg-ink-700 hover:text-fg";

const BADGE_STYLES = {
  ready: { label: "Live", box: "border-ok/30 bg-ok/10 text-ok", dot: "bg-ok", pulse: true },
  loading: { label: "Connecting", box: "border-ink-500 bg-ink-700 text-fg-2", dot: "bg-fg-3", pulse: false },
  slow: { label: "No response", box: "border-warn/30 bg-warn/10 text-warn", dot: "bg-warn", pulse: false },
};

const LiveBadge = ({ status }) => {
  const style = BADGE_STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${style.box}`}
    >
      <span className="relative flex size-1.5">
        {style.pulse && (
          <span className={`absolute inline-flex size-full rounded-full opacity-60 motion-safe:animate-ping ${style.dot}`} />
        )}
        <span className={`relative inline-flex size-1.5 rounded-full ${style.dot}`} />
      </span>
      {style.label}
    </span>
  );
};

/**
 * Embeds a third-party live map with enterprise chrome:
 * connection state, reload, fullscreen, "open in new tab" and an optional
 * legend of the provider's categories.
 */
const ExternalMap = ({
  id,
  title,
  description,
  provider,
  src,
  href,
  notice,
  legend,
  legendTitle = "Categories",
  lazy = false,
  sandbox = DEFAULT_SANDBOX,
  className = "",
}) => {
  const stageRef = useRef(null);
  const [status, setStatus] = useState("loading"); // loading | slow | ready
  const [attempt, setAttempt] = useState(0);
  const [visible, setVisible] = useState(!lazy);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // For lazy maps, only start the clock once the map is close to the viewport.
  useEffect(() => {
    if (visible || !stageRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px" }
    );
    observer.observe(stageRef.current);
    return () => observer.disconnect();
  }, [visible]);

  // Some providers silently refuse to be embedded, so surface a hint if the
  // map has not reported a load after a while.
  useEffect(() => {
    if (!visible || status !== "loading") return;
    const timer = setTimeout(() => setStatus("slow"), SLOW_AFTER_MS);
    return () => clearTimeout(timer);
  }, [visible, status, attempt]);

  useEffect(() => {
    const onChange = () => setIsFullscreen(document.fullscreenElement === stageRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const reload = useCallback(() => {
    setStatus("loading");
    setAttempt((n) => n + 1);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      stageRef.current?.requestFullscreen?.();
    }
  }, []);

  const openHref = href || src;

  const actions = (
    <div className="flex items-center gap-0.5">
      <button type="button" onClick={reload} className={actionClass} aria-label={`Reload ${provider} map`} title="Reload">
        <Icon path={ICONS.reload} />
      </button>
      <button
        type="button"
        onClick={toggleFullscreen}
        className={actionClass}
        aria-label={isFullscreen ? "Exit full screen" : "View full screen"}
        title={isFullscreen ? "Exit full screen" : "Full screen"}
      >
        <Icon path={isFullscreen ? ICONS.collapse : ICONS.expand} />
      </button>
      <a
        href={openHref}
        target="_blank"
        rel="noopener noreferrer"
        className={actionClass}
        aria-label={`Open ${provider} map in a new tab`}
        title="Open in new tab"
      >
        <Icon path={ICONS.external} />
      </a>
    </div>
  );

  const footer =
    notice || legend?.length ? (
      <div className="flex flex-col gap-2 px-5 py-3">
        {notice && (
          <p className="flex items-start gap-2 text-xs leading-5 text-fg-3">
            <span className="mt-0.5 text-fg-3">
              <Icon path={ICONS.info} />
            </span>
            <span>{notice}</span>
          </p>
        )}
        {legend?.length > 0 && (
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-medium text-fg-2 hover:text-fg [&::-webkit-details-marker]:hidden">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-3.5 transition-transform group-open:rotate-90 motion-reduce:transition-none"
                aria-hidden
              >
                <path d="m9 6 6 6-6 6" />
              </svg>
              {legendTitle}
              <span className="rounded bg-ink-700 px-1.5 py-px font-mono text-[11px] text-fg-3">{legend.length}</span>
            </summary>
            {/* Opens over the map so the widget keeps its size in the grid. */}
            <dl className="scroll-thin absolute inset-x-0 bottom-full z-10 grid max-h-72 gap-x-6 gap-y-3 overflow-y-auto border-t border-ink-600 bg-ink-800/95 px-5 py-4 shadow-panel backdrop-blur sm:grid-cols-2 xl:grid-cols-4">
              {legend.map((item) => (
                <div key={item.code} className="flex gap-2.5">
                  <dt className="mt-px h-5 shrink-0 rounded border border-ink-500 bg-ink-700 px-1.5 font-mono text-[11px] font-medium leading-5 text-accent-strong">
                    {item.code}
                  </dt>
                  <dd className="text-xs leading-5 text-fg-3">
                    <span className="font-medium text-fg-2">{item.label}.</span> {item.description}
                  </dd>
                </div>
              ))}
            </dl>
          </details>
        )}
      </div>
    ) : null;

  return (
    <Panel
      title={title}
      description={description}
      meta={<LiveBadge status={status} />}
      actions={actions}
      footer={footer}
      className={className}
      bodyClassName="p-2"
    >
      <div
        id={id}
        ref={stageRef}
        className={`absolute inset-2 overflow-hidden border-ink-600 bg-ink-950 ${
          isFullscreen ? "" : "rounded-md border"
        }`}
      >
        {visible && (
          <iframe
            key={attempt}
            src={src}
            title={`${provider} live threat map`}
            sandbox={sandbox}
            allow="fullscreen"
            referrerPolicy="strict-origin-when-cross-origin"
            onLoad={() => setStatus("ready")}
            className="absolute inset-0 size-full border-0 bg-ink-950"
          />
        )}

        {status !== "ready" && (
          <div
            role="status"
            aria-live="polite"
            className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-ink-950 px-6 text-center"
          >
            {status === "loading" ? (
              <>
                <span className="size-6 animate-spin rounded-full border-2 border-ink-500 border-t-accent motion-reduce:animate-none" />
                <p className="text-[13px] text-fg-2">Connecting to {provider}</p>
              </>
            ) : (
              <>
                <p className="font-semibold text-fg">{provider} is taking longer than expected</p>
                <p className="max-w-md text-[13px] leading-5 text-fg-3">
                  The map may still be loading, or the provider may not allow embedding in this
                  network. You can retry or open it in its own tab.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={reload}
                    className="rounded-md border border-ink-500 bg-ink-700 px-3 py-1.5 text-[13px] font-medium text-fg transition-colors hover:border-accent/60 hover:bg-ink-600"
                  >
                    Retry
                  </button>
                  <a
                    href={openHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md bg-accent px-3 py-1.5 text-[13px] font-medium text-ink-950 transition-colors hover:bg-accent-strong"
                  >
                    Open in new tab
                  </a>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </Panel>
  );
};

export default ExternalMap;
