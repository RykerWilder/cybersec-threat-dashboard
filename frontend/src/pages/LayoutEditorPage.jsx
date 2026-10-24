import React, { useEffect, useState } from "react";
import AppLink from "../components/AppLink";
import GridLayout from "../components/GridLayout";
import { layoutEquals } from "../layout/engine";
import { useMediaQuery } from "../layout/hooks";
import { setDirty } from "../layout/navGuard";
import { defaultLayout, loadLayout, saveLayout } from "../layout/storage";
import { WIDGETS_BY_ID, resizeAxes } from "../layout/widgets";

const GLYPHS = {
  donut: (
    <>
      <circle cx="32" cy="32" r="20" strokeWidth="9" opacity="0.5" />
      <path d="M32 12a20 20 0 0 1 20 20" strokeWidth="9" />
    </>
  ),
  bars: (
    <>
      <path d="M12 52V34M24 52V20M36 52V28M48 52V14" strokeWidth="7" strokeLinecap="round" />
    </>
  ),
  list: (
    <>
      <path d="M12 16h40M12 32h40M12 48h40" strokeWidth="7" strokeLinecap="round" opacity="0.5" />
      <path d="M12 16h16" strokeWidth="7" strokeLinecap="round" />
    </>
  ),
  map: (
    <>
      <circle cx="32" cy="32" r="22" strokeWidth="3" opacity="0.5" />
      <path d="M10 32h44M32 10c-12 14-12 30 0 44M32 10c12 14 12 30 0 44" strokeWidth="3" opacity="0.5" />
      <circle cx="42" cy="24" r="4" fill="currentColor" stroke="none" />
    </>
  ),
  line: (
    <path d="M6 46 18 30l12 8 14-22 14 12" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
  ),
};

const Grip = () => (
  <svg viewBox="0 0 16 16" className="size-4 shrink-0 text-fg-3" fill="currentColor" aria-hidden>
    {[3, 8, 13].flatMap((cx) => [4, 12].map((cy) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.2" />))}
  </svg>
);

/** Lightweight stand-in for a widget while arranging (no data, no iframes). */
const sizeHint = (widget) => {
  const axes = resizeAxes(widget);
  const width = axes.width ? `width ${widget.minW}–${widget.maxW}` : null;
  const height = axes.height ? `height ${widget.minH}–${widget.maxH}` : null;
  if (width && height) return `Resizable: ${width}, ${height}`;
  if (height) return `Height only: ${widget.minH}–${widget.maxH} rows`;
  return "Fixed size";
};

const Tile = ({ item, active }) => {
  const widget = WIDGETS_BY_ID[item.i];
  const axes = resizeAxes(widget);
  const atLimit =
    (axes.width && (item.w === widget.minW || item.w === widget.maxW)) ||
    (axes.height && (item.h === widget.minH || item.h === widget.maxH));
  return (
    <div
      className={`flex size-full flex-col overflow-hidden rounded-lg border bg-ink-800 p-4 transition-colors ${
        active ? "border-accent shadow-panel" : "border-ink-500"
      }`}
    >
      <div className="flex items-start gap-2">
        <Grip />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold text-fg">{widget.title}</div>
          <div className="truncate text-xs text-fg-3">{widget.description}</div>
        </div>
        <span
          className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[11px] tabular ${
            active && atLimit ? "bg-warn/15 text-warn" : "bg-ink-700 text-fg-2"
          }`}
          title={active && atLimit ? "Size limit reached" : undefined}
        >
          {item.w} × {item.h}
        </span>
      </div>
      <div className="mt-3 flex min-h-0 flex-1 items-center justify-center text-ink-500">
        <svg
          viewBox="0 0 64 64"
          fill="none"
          stroke="currentColor"
          className="max-h-full max-w-[9rem]"
          aria-hidden
        >
          {GLYPHS[widget.glyph]}
        </svg>
      </div>
      <div className="mt-2 truncate text-[11px] text-fg-3">{sizeHint(widget)}</div>
    </div>
  );
};

const buttonBase =
  "inline-flex items-center justify-center rounded-md border px-3.5 py-2 text-[13px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";

const LayoutEditorPage = () => {
  const isWide = useMediaQuery("(min-width: 1024px)");
  const [saved, setSaved] = useState(loadLayout);
  const [draft, setDraft] = useState(saved);
  const [message, setMessage] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [saveFailed, setSaveFailed] = useState(false);

  const dirty = !layoutEquals(draft, saved);
  const isDefault = layoutEquals(draft, defaultLayout());

  // Warn before leaving (menu links use AppLink; closing the tab uses beforeunload).
  useEffect(() => {
    setDirty(dirty);
    if (!dirty) return undefined;
    const warn = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  useEffect(() => () => setDirty(false), []);

  const save = () => {
    const ok = saveLayout(draft);
    setSaveFailed(!ok);
    if (ok) {
      setSaved(draft);
      setMessage("Layout saved. The dashboard will use it from now on.");
    } else {
      setMessage("");
    }
  };

  const changeDraft = (next) => {
    setDraft(next);
    setMessage("");
    setSaveFailed(false);
  };

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-[28px] font-semibold leading-9 tracking-tight text-fg">Layout editor</h1>
          <p className="mt-2 text-[15px] leading-6 text-fg-2">
            Drag a panel to move it. Pull its right edge, bottom edge or bottom-right corner to
            resize it; each panel has a minimum and maximum size, and the vulnerability feed can
            only change in height. Other panels move out of the way. The layout is stored in this
            browser once you save it.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <AppLink
            href="#/"
            className={`${buttonBase} border-transparent text-fg-2 hover:bg-ink-700 hover:text-fg`}
          >
            Back to dashboard
          </AppLink>
          <button
            type="button"
            onClick={() => changeDraft(defaultLayout())}
            disabled={isDefault}
            className={`${buttonBase} border-ink-500 bg-ink-800 text-fg hover:bg-ink-700`}
          >
            Reset to default
          </button>
          <button
            type="button"
            onClick={() => changeDraft(saved)}
            disabled={!dirty}
            className={`${buttonBase} border-ink-500 bg-ink-800 text-fg hover:bg-ink-700`}
          >
            Discard changes
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!dirty}
            className={`${buttonBase} border-accent bg-accent text-ink-950 hover:bg-accent-strong`}
          >
            Save layout
          </button>
        </div>
      </div>

      <div className="mb-4 flex min-h-6 items-center gap-2 text-[13px]" role="status" aria-live="polite">
        {saveFailed ? (
          <span className="text-crit">
            Could not save: this browser is blocking local storage. Your changes are still on screen.
          </span>
        ) : dirty ? (
          <>
            <span className="size-2 rounded-full bg-warn" aria-hidden />
            <span className="text-fg-2">Unsaved changes</span>
          </>
        ) : (
          <span className="text-fg-3">{message || "No unsaved changes"}</span>
        )}
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>

      {isWide ? (
        <>
          <GridLayout
            layout={draft}
            onLayoutChange={changeDraft}
            editable
            meta={WIDGETS_BY_ID}
            onAnnounce={setAnnouncement}
            renderItem={(item, state) => <Tile item={item} active={state.active} />}
          />
          <p className="mt-4 text-xs text-fg-3">
            Keyboard: focus a panel, then use the arrow keys to move it and Shift with the arrow
            keys to resize it.
          </p>
        </>
      ) : (
        <div className="rounded-lg border border-ink-600 bg-ink-800 p-6 text-[13px] leading-6 text-fg-2">
          The layout editor needs a screen at least 1024 pixels wide. On smaller screens the
          dashboard shows the panels in a single column.
        </div>
      )}
    </>
  );
};

export default LayoutEditorPage;
