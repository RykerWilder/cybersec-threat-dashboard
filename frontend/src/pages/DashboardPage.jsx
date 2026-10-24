import React, { useState } from "react";
import GridLayout from "../components/GridLayout";
import { pixelHeight } from "../layout/engine";
import { useMediaQuery } from "../layout/hooks";
import { loadLayout } from "../layout/storage";
import { WIDGET_COMPONENTS } from "./widgetComponents";

const DashboardPage = () => {
  // The layout saved in the layout editor (or the default mosaic).
  const [layout] = useState(loadLayout);
  const isWide = useMediaQuery("(min-width: 1024px)");

  return (
    <>
      <div className="mb-8 max-w-3xl">
        <h1 className="text-[28px] font-semibold leading-9 tracking-tight text-fg">
          Global threat overview
        </h1>
        <p className="mt-2 text-[15px] leading-6 text-fg-2">
          Live attack maps, newly published vulnerabilities and attack telemetry in a single
          view, refreshed from public threat intelligence sources.
        </p>
      </div>

      {isWide ? (
        <GridLayout
          layout={layout}
          renderItem={(item) => (
            <div className="size-full">{WIDGET_COMPONENTS[item.i]()}</div>
          )}
        />
      ) : (
        // Narrow screens: a single column in reading order.
        <div className="flex flex-col gap-4">
          {[...layout]
            .sort((a, b) => a.y - b.y || a.x - b.x)
            .map((item) => (
              <div key={item.i} style={{ height: pixelHeight(Math.max(item.h, 6)) }}>
                {WIDGET_COMPONENTS[item.i]()}
              </div>
            ))}
        </div>
      )}
    </>
  );
};

export default DashboardPage;
