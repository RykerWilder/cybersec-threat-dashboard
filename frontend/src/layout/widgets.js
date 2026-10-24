/**
 * Registry of dashboard widgets: metadata, minimum sizes and the default
 * mosaic. Components live in pages/widgetComponents.jsx so the layout editor
 * does not need to load any chart code.
 *
 * Sizes are in grid units (12 columns, 56 px rows). Every widget has a
 * minimum (so its data stays readable) and a maximum (so it cannot take over
 * the page). When minW === maxW the width is locked and the widget can only be
 * resized in height (the vulnerability feed).
 *
 * Default layout (12 columns):
 *
 *   x:  0  1  2  3 | 4  5  6  7  8 | 9 10 11
 *   +--------------+--------------+----------+  y0
 *   | Popular      | NVD severity | Vuln     |
 *   | threats      |              | feed     |
 *   +--------------+--------------+          |  y7
 *   | Kaspersky map               |          |
 *   |                             +----------+  y11
 *   |                             | Targets  |
 *   +--------------------+--------+----------+  y17
 *   | Check Point map    | Attacks (records)  |
 *   |                    +--------------------+  y22
 *   |                    | Attackers          |
 *   +--------------------+--------------------+  y27
 */
export const WIDGETS = [
  {
    id: "popular-threats",
    title: "Popular threat categories",
    description: "VirusTotal",
    glyph: "donut",
    minW: 4,
    maxW: 8,
    minH: 5,
    maxH: 10,
    default: { x: 0, y: 0, w: 4, h: 7 },
  },
  {
    id: "nvd-severity",
    title: "NVD severity scores",
    description: "CVSS of the latest CVEs",
    glyph: "bars",
    minW: 4,
    maxW: 9,
    minH: 5,
    maxH: 10,
    default: { x: 4, y: 0, w: 5, h: 7 },
  },
  {
    id: "vulnerability-feed",
    title: "Vulnerability feed",
    description: "Latest CVEs from NVD",
    glyph: "list",
    minW: 3,
    maxW: 3, // width locked: height only
    minH: 6,
    maxH: 12,
    default: { x: 9, y: 0, w: 3, h: 11 },
  },
  {
    id: "kaspersky-map",
    title: "Kaspersky live map",
    description: "Real-time detections",
    glyph: "map",
    minW: 5,
    maxW: 10,
    minH: 8,
    maxH: 14,
    default: { x: 0, y: 7, w: 9, h: 10 },
  },
  {
    id: "trend-targets",
    title: "Number of targets",
    description: "ISC SANS, 30 days",
    glyph: "line",
    minW: 3,
    maxW: 8,
    minH: 5,
    maxH: 9,
    default: { x: 9, y: 11, w: 3, h: 6 },
  },
  {
    id: "checkpoint-map",
    title: "Check Point live map",
    description: "Real-time attacks",
    glyph: "map",
    minW: 5,
    maxW: 10,
    minH: 8,
    maxH: 14,
    default: { x: 0, y: 17, w: 6, h: 10 },
  },
  {
    id: "trend-records",
    title: "Number of attacks",
    description: "ISC SANS, 30 days",
    glyph: "line",
    minW: 3,
    maxW: 8,
    minH: 5,
    maxH: 9,
    default: { x: 6, y: 17, w: 6, h: 5 },
  },
  {
    id: "trend-sources",
    title: "Number of attackers",
    description: "ISC SANS, 30 days",
    glyph: "line",
    minW: 3,
    maxW: 8,
    minH: 5,
    maxH: 9,
    default: { x: 6, y: 22, w: 6, h: 5 },
  },
];

export const WIDGETS_BY_ID = Object.fromEntries(WIDGETS.map((widget) => [widget.id, widget]));

/** Which axes of a widget can be resized. */
export const resizeAxes = (widget) => ({
  width: widget.minW < widget.maxW,
  height: widget.minH < widget.maxH,
});
