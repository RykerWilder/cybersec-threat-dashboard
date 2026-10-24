import { Chart } from "chart.js";

/**
 * Shared look & feel for every Chart.js chart.
 * Importing this module applies the global defaults; the exported objects
 * are spread into each chart's options so charts stay visually consistent.
 */

export const FONT_SANS =
  '"IBM Plex Sans", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
export const FONT_MONO =
  '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

export const INK = {
  surface: "#0f1a2b",
  raised: "#15233a",
  line: "#1d2f4a",
  lineStrong: "#2a4063",
  fg: "#e8eef8",
  fg2: "#a9b7cc",
  fg3: "#7b8fac",
};

Chart.defaults.font.family = FONT_SANS;
Chart.defaults.font.size = 12;
Chart.defaults.color = INK.fg3;
Chart.defaults.borderColor = "rgba(148, 163, 184, 0.12)";

export const GRID = {
  color: "rgba(148, 163, 184, 0.12)",
  drawTicks: false,
};

export const AXIS_LINE = {
  color: INK.lineStrong,
};

export const TICKS = {
  color: INK.fg3,
  padding: 8,
  font: { family: FONT_MONO, size: 11 },
};

export const TOOLTIP = {
  backgroundColor: INK.raised,
  borderColor: INK.lineStrong,
  borderWidth: 1,
  titleColor: INK.fg,
  bodyColor: INK.fg2,
  titleFont: { family: FONT_SANS, size: 12, weight: "600" },
  bodyFont: { family: FONT_MONO, size: 12 },
  padding: 10,
  cornerRadius: 6,
  boxPadding: 4,
};
