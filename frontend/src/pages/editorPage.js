import { lazy } from "react";

// The layout editor is only needed on #/layout, so it is split into its own chunk.
export const loadEditorPage = () => import("./LayoutEditorPage");
export const LazyLayoutEditorPage = lazy(loadEditorPage);
