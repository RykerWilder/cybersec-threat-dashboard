import { COLS, clamp, settle } from "./engine";
import { WIDGETS, WIDGETS_BY_ID } from "./widgets";

export const STORAGE_KEY = "cyberthreat-dashboard:layout";
const STORAGE_VERSION = 1;

export function defaultLayout() {
  return WIDGETS.map((widget) => ({ i: widget.id, ...widget.default }));
}

/**
 * Turns whatever was stored into a valid layout: unknown widgets are dropped,
 * sizes are clamped to each widget's limits, widgets that were not saved
 * (for example added in a later version) get their default slot, and any
 * overlap is resolved.
 */
export function normalizeLayout(input) {
  const defaults = defaultLayout();
  const stored = new Map();
  const num = (value, fallback) => (Number.isFinite(value) ? Math.round(value) : fallback);

  if (Array.isArray(input)) {
    for (const raw of input) {
      const widget = WIDGETS_BY_ID[raw?.i];
      if (!widget || stored.has(widget.id)) continue;
      const w = clamp(num(raw.w, widget.default.w), widget.minW, Math.min(widget.maxW, COLS));
      const h = clamp(num(raw.h, widget.default.h), widget.minH, widget.maxH);
      const x = clamp(num(raw.x, 0), 0, COLS - w);
      const y = Math.max(0, num(raw.y, 0));
      stored.set(widget.id, { i: widget.id, x, y, w, h });
    }
  }

  const merged = defaults.map((item) => stored.get(item.i) ?? item);
  return settle(merged, null);
}

export function loadLayout() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultLayout();
    const parsed = JSON.parse(raw);
    return normalizeLayout(parsed?.layout);
  } catch {
    return defaultLayout();
  }
}

/** Returns true when the layout was stored. */
export function saveLayout(layout) {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: STORAGE_VERSION,
        layout: layout.map(({ i, x, y, w, h }) => ({ i, x, y, w, h })),
      })
    );
    return true;
  } catch {
    return false;
  }
}
