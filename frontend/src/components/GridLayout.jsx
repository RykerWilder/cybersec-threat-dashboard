import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  COLS,
  GAP,
  ROW_HEIGHT,
  applyChange,
  clamp,
  pixelHeight,
  rectOf,
  rowsOf,
} from "../layout/engine";

const KEY_DIRECTIONS = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

const EDGE_SCROLL_ZONE = 80;
const EDGE_SCROLL_SPEED = 14;

// Size limits of one item, in grid units. Missing limits mean "no limit".
const limitsOf = (meta, id) => {
  const m = meta[id] ?? {};
  return {
    title: m.title ?? id,
    minW: m.minW ?? 1,
    maxW: Math.min(m.maxW ?? COLS, COLS),
    minH: m.minH ?? 1,
    maxH: m.maxH ?? Infinity,
  };
};

const spanPx = (units, colWidth) => units * colWidth + (units - 1) * GAP;
const heightPx = (units) => units * ROW_HEIGHT + (units - 1) * GAP;

/**
 * Absolutely positioned 12-column grid.
 * - Read-only: renders each item at its grid position.
 * - Editable: items can be dragged, or resized from their right edge, bottom
 *   edge or bottom-right corner, within each item's min/max size. An axis whose
 *   min and max are equal is locked and gets no handle. Keyboard: arrows move,
 *   Shift+arrows resize. Other items are pushed out of the way.
 */
const GridLayout = ({
  layout,
  onLayoutChange,
  editable = false,
  meta = {},
  renderItem,
  onAnnounce,
}) => {
  const containerRef = useRef(null);
  const [width, setWidth] = useState(0);
  const [drag, setDrag] = useState(null);

  const geometry = useRef({ width: 0 });
  const dragRef = useRef(null);
  const pointerRef = useRef(null);
  const proposedRef = useRef(null);
  const frameRef = useRef(0);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return undefined;
    const observer = new ResizeObserver(([entry]) => {
      geometry.current.width = entry.contentRect.width;
      setWidth(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => () => cancelAnimationFrame(frameRef.current), []);

  const update = useCallback(() => {
    const state = dragRef.current;
    const pointer = pointerRef.current;
    if (!state || !pointer) return;

    const gridWidth = geometry.current.width;
    const colWidth = (gridWidth - GAP * (COLS - 1)) / COLS;
    const stepX = colWidth + GAP;
    const stepY = ROW_HEIGHT + GAP;
    const dx = pointer.clientX + window.scrollX - state.startX;
    const dy = pointer.clientY + window.scrollY - state.startY;
    const { item, orig, mode } = state;
    const limits = limitsOf(meta, item.i);

    let proposed;
    let px;
    if (mode === "move") {
      const left = clamp(orig.left + dx, 0, gridWidth - orig.w);
      const top = Math.max(0, orig.top + dy);
      proposed = applyChange(state.base, item.i, {
        x: clamp(Math.round(left / stepX), 0, COLS - item.w),
        y: Math.max(0, Math.round(top / stepY)),
      });
      px = { left, top, w: orig.w, h: orig.h };
    } else {
      const growsX = mode === "resize-e" || mode === "resize-se";
      const growsY = mode === "resize-s" || mode === "resize-se";
      const maxCols = Math.min(limits.maxW, COLS - item.x);

      // Pixel size follows the pointer but never leaves the allowed range,
      // so the box visibly stops at its limits.
      let w = orig.w;
      let h = orig.h;
      const patch = {};
      if (growsX) {
        w = clamp(orig.w + dx, spanPx(limits.minW, colWidth), spanPx(maxCols, colWidth));
        patch.w = clamp(Math.round((w + GAP) / stepX), limits.minW, maxCols);
      }
      if (growsY) {
        const maxPx = Number.isFinite(limits.maxH) ? heightPx(limits.maxH) : Infinity;
        h = clamp(orig.h + dy, heightPx(limits.minH), maxPx);
        patch.h = clamp(Math.round((h + GAP) / stepY), limits.minH, limits.maxH);
      }
      proposed = applyChange(state.base, item.i, patch);
      px = { left: orig.left, top: orig.top, w, h };
    }

    proposedRef.current = proposed;
    setDrag({ id: item.i, mode, proposed, px });
  }, [meta]);

  const finish = useCallback(
    (commit) => {
      if (!dragRef.current) return;
      cancelAnimationFrame(frameRef.current);
      dragRef.current = null;
      const proposed = proposedRef.current;
      proposedRef.current = null;
      setDrag(null);
      if (commit && proposed) onLayoutChange(proposed);
    },
    [onLayoutChange]
  );

  const begin = (event, item, mode) => {
    if (!editable || (event.pointerType === "mouse" && event.button !== 0)) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture?.(event.pointerId);

    const orig = rectOf(item, geometry.current.width);
    dragRef.current = {
      item,
      mode,
      base: layout,
      orig,
      startX: event.clientX + window.scrollX,
      startY: event.clientY + window.scrollY,
    };
    pointerRef.current = { clientX: event.clientX, clientY: event.clientY };
    proposedRef.current = null;
    setDrag({ id: item.i, mode, proposed: layout, px: orig });

    // Scroll the page while a panel is held near the top or bottom edge.
    const tick = () => {
      if (!dragRef.current) return;
      const { clientY } = pointerRef.current;
      let delta = 0;
      if (clientY < EDGE_SCROLL_ZONE) delta = -EDGE_SCROLL_SPEED;
      else if (clientY > window.innerHeight - EDGE_SCROLL_ZONE) delta = EDGE_SCROLL_SPEED;
      if (delta) {
        window.scrollBy(0, delta);
        update();
      }
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
  };

  const handlers = (item, mode) => ({
    onPointerDown: (event) => begin(event, item, mode),
    onPointerMove: (event) => {
      if (!dragRef.current) return;
      pointerRef.current = { clientX: event.clientX, clientY: event.clientY };
      update();
    },
    onPointerUp: () => finish(true),
    onPointerCancel: () => finish(false),
  });

  const onKeyDown = (event, item) => {
    const direction = KEY_DIRECTIONS[event.key];
    if (!direction || !editable) return;
    event.preventDefault();
    const limits = limitsOf(meta, item.i);
    const patch = event.shiftKey
      ? {
          w: clamp(item.w + direction[0], limits.minW, Math.min(limits.maxW, COLS - item.x)),
          h: clamp(item.h + direction[1], limits.minH, limits.maxH),
        }
      : {
          x: clamp(item.x + direction[0], 0, COLS - item.w),
          y: Math.max(0, item.y + direction[1]),
        };
    const next = applyChange(layout, item.i, patch);
    onLayoutChange(next);
    const moved = next.find((entry) => entry.i === item.i);
    const atLimit =
      event.shiftKey && moved.w === item.w && moved.h === item.h ? " (size limit reached)" : "";
    onAnnounce?.(
      `${limits.title}: column ${moved.x + 1}, row ${moved.y + 1}, size ${moved.w} by ${moved.h}${atLimit}`
    );
  };

  const shown = drag ? drag.proposed : layout;
  const rows = rowsOf(shown) + (editable ? 3 : 0);
  const colWidth = (width - GAP * (COLS - 1)) / COLS;
  // Ignore transient widths too small to hold the 12 columns.
  const ready = colWidth >= 1;

  const background =
    editable && ready
      ? {
          backgroundImage:
            "radial-gradient(circle, rgb(120 160 220 / 0.28) 1px, transparent 1.5px)",
          backgroundSize: `${colWidth + GAP}px ${ROW_HEIGHT + GAP}px`,
          backgroundPosition: `${-GAP / 2}px ${-GAP / 2}px`,
        }
      : undefined;

  const placeholder = drag ? shown.find((item) => item.i === drag.id) : null;
  const placeholderRect = placeholder ? rectOf(placeholder, width) : null;

  return (
    <div
      ref={containerRef}
      className="relative"
      style={{ height: pixelHeight(rows), ...background }}
    >
      {ready && placeholderRect && (
        <div
          aria-hidden
          className="absolute left-0 top-0 rounded-lg border border-dashed border-accent/70 bg-accent/10 transition-transform duration-150 motion-reduce:transition-none"
          style={{
            width: placeholderRect.w,
            height: placeholderRect.h,
            transform: `translate(${placeholderRect.left}px, ${placeholderRect.top}px)`,
          }}
        />
      )}

      {ready &&
        shown.map((item) => {
          const active = drag?.id === item.i;
          const rect = active ? drag.px : rectOf(item, width);
          const limits = limitsOf(meta, item.i);
          const canWidth = limits.minW < Math.min(limits.maxW, COLS);
          const canHeight = limits.minH < limits.maxH;
          const resizing = active && drag.mode !== "move";
          return (
            <div
              key={item.i}
              className="grid-item group/tile absolute left-0 top-0"
              data-editable={editable}
              data-active={active}
              style={{
                width: rect.w,
                height: rect.h,
                transform: `translate(${rect.left}px, ${rect.top}px)`,
                zIndex: active ? 30 : 1,
              }}
            >
              {renderItem(item, { active, mode: active ? drag.mode : null })}

              {editable && (
                <>
                  <div
                    role="group"
                    tabIndex={0}
                    aria-label={`${limits.title}, column ${item.x + 1}, row ${item.y + 1}, size ${item.w} by ${item.h}. Use arrow keys to move and Shift with arrow keys to resize.`}
                    className={`absolute inset-0 touch-none rounded-lg ${
                      active && drag.mode === "move" ? "cursor-grabbing" : "cursor-grab"
                    }`}
                    onKeyDown={(event) => onKeyDown(event, item)}
                    {...handlers(item, "move")}
                  />

                  {canWidth && (
                    <div
                      aria-hidden
                      title="Drag to change width"
                      className="absolute bottom-7 right-0 top-7 flex w-4 cursor-ew-resize touch-none items-center justify-end"
                      {...handlers(item, "resize-e")}
                    >
                      <span
                        className={`mr-0.5 h-10 w-1 rounded-full transition-colors ${
                          resizing && drag.mode === "resize-e"
                            ? "bg-accent"
                            : "bg-fg-3/50 group-hover/tile:bg-accent/70"
                        }`}
                      />
                    </div>
                  )}

                  {canHeight && (
                    <div
                      aria-hidden
                      title="Drag to change height"
                      className="absolute bottom-0 left-7 right-7 flex h-4 cursor-ns-resize touch-none items-end justify-center"
                      {...handlers(item, "resize-s")}
                    >
                      <span
                        className={`mb-0.5 h-1 w-10 rounded-full transition-colors ${
                          resizing && drag.mode === "resize-s"
                            ? "bg-accent"
                            : "bg-fg-3/50 group-hover/tile:bg-accent/70"
                        }`}
                      />
                    </div>
                  )}

                  {canWidth && canHeight && (
                    <div
                      aria-hidden
                      title="Drag to change width and height"
                      className={`absolute bottom-0 right-0 flex size-7 cursor-nwse-resize touch-none items-end justify-end p-1.5 transition-colors ${
                        resizing && drag.mode === "resize-se"
                          ? "text-accent"
                          : "text-fg-3 group-hover/tile:text-accent"
                      }`}
                      {...handlers(item, "resize-se")}
                    >
                      <svg viewBox="0 0 12 12" className="size-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <path d="M11 3 3 11M11 7l-4 4" />
                      </svg>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
    </div>
  );
};

export default GridLayout;
