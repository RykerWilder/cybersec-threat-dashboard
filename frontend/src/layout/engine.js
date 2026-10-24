/**
 * Minimal grid layout engine (12 columns, fixed row height, vertical gravity).
 * Items are { i, x, y, w, h } in grid units. No external dependencies.
 */
export const COLS = 12;
export const ROW_HEIGHT = 56;
export const GAP = 16;

const collides = (a, b) =>
  a.i !== b.i &&
  a.x < b.x + b.w &&
  a.x + a.w > b.x &&
  a.y < b.y + b.h &&
  a.y + a.h > b.y;

const byPosition = (a, b) => a.y - b.y || a.x - b.x;

/**
 * Resolves overlaps and pulls every item up as far as it can go.
 * When `activeId` is given, that item keeps its position and the others are
 * pushed below it. The result keeps the input order.
 */
export function settle(layout, activeId = null) {
  const items = layout.map((item) => ({ ...item }));
  const active = activeId ? items.find((item) => item.i === activeId) : null;
  const placed = active ? [active] : [];
  const rest = items.filter((item) => item !== active).sort(byPosition);

  for (const item of rest) {
    let hit;
    while ((hit = placed.find((other) => collides(item, other)))) {
      item.y = hit.y + hit.h;
    }
    while (
      item.y > 0 &&
      !placed.some((other) => collides({ ...item, y: item.y - 1 }, other))
    ) {
      item.y -= 1;
    }
    placed.push(item);
  }

  return items;
}

/** Applies a position/size patch to one item and re-flows the others. */
export function applyChange(layout, id, patch) {
  const next = layout.map((item) => (item.i === id ? { ...item, ...patch } : item));
  return settle(settle(next, id), null);
}

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function rowsOf(layout) {
  return layout.reduce((max, item) => Math.max(max, item.y + item.h), 0);
}

export function layoutEquals(a, b) {
  if (a.length !== b.length) return false;
  const key = (item) => `${item.i}:${item.x},${item.y},${item.w},${item.h}`;
  const left = a.map(key).sort();
  const right = b.map(key).sort();
  return left.every((value, index) => value === right[index]);
}

/** Pixel rectangle of an item for a given container width. */
export function rectOf(item, width) {
  const colWidth = (width - GAP * (COLS - 1)) / COLS;
  return {
    left: item.x * (colWidth + GAP),
    top: item.y * (ROW_HEIGHT + GAP),
    w: item.w * colWidth + (item.w - 1) * GAP,
    h: item.h * ROW_HEIGHT + (item.h - 1) * GAP,
  };
}

export const pixelHeight = (rows) => rows * ROW_HEIGHT + Math.max(0, rows - 1) * GAP;
