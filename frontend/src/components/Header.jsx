import React, { useState, useEffect } from "react";
import AppLink from "./AppLink";
import { useRoute } from "../layout/hooks";

const STATUS_CONFIG = {
  active: { label: "Active", dotColor: "bg-ok", textColor: "text-ok" },
  degraded: { label: "Degraded", dotColor: "bg-warn", textColor: "text-warn" },
  inactive: { label: "Inactive", dotColor: "bg-crit", textColor: "text-crit" },
  checking: { label: "Checking...", dotColor: "bg-fg-3", textColor: "text-fg-3" },
};

// Rename the entry here if you prefer another label.
const LAYOUT_EDITOR_LABEL = "Layout editor";

const Header = () => {
  const route = useRoute();
  const [currentTime, setCurrentTime] = useState(
    new Date().toTimeString().split(" ")[0]
  );
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().toTimeString().split(" ")[0]);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch("/api/health");
        if (response.ok) {
          setStatus("active");
        } else {
          setStatus("degraded");
        }
      } catch (err) {
        setStatus("inactive");
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 10000);

    return () => clearInterval(interval);
  }, []);

  const { label, dotColor, textColor } = STATUS_CONFIG[status];

  return (
    <header className="sticky top-0 z-40 border-b border-ink-600 bg-ink-900/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-[1560px] items-center gap-6 px-5 lg:px-10">
        <AppLink href="#/" className="flex shrink-0 items-center gap-3" aria-label="Cyberthreat Live Dashboard, go to dashboard">
          <span className="flex size-8 items-center justify-center rounded-md border border-accent/40 bg-accent/10 text-accent">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.75"
              stroke="currentColor"
              className="size-5"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.25-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z"
              />
            </svg>
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-fg">
            Cyberthreat
            <span className="ml-1.5 hidden font-normal text-fg-3 sm:inline">Live Dashboard</span>
          </span>
        </AppLink>

        <nav aria-label="Main" className="ml-4 hidden items-center gap-1 md:flex">
          <AppLink
            href="#/layout"
            aria-current={route === "layout" ? "page" : undefined}
            className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${
              route === "layout"
                ? "bg-ink-700 text-fg"
                : "text-fg-2 hover:bg-ink-700 hover:text-fg"
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinejoin="round"
              className="size-4"
              aria-hidden
            >
              <rect x="3" y="3" width="8" height="10" rx="1.5" />
              <rect x="13" y="3" width="8" height="6" rx="1.5" />
              <rect x="13" y="11" width="8" height="10" rx="1.5" />
              <rect x="3" y="15" width="8" height="6" rx="1.5" />
            </svg>
            {LAYOUT_EDITOR_LABEL}
          </AppLink>
        </nav>

        <div className="ml-auto flex items-center gap-5">
          <div
            className="flex items-center gap-2 rounded-md border border-ink-600 bg-ink-800 px-3 py-1.5 text-[13px]"
            role="status"
            aria-live="polite"
          >
            <span className="relative flex size-2">
              {status === "active" && (
                <span className={`absolute inline-flex size-full rounded-full opacity-60 motion-safe:animate-ping ${dotColor}`} />
              )}
              <span className={`relative inline-flex size-2 rounded-full ${dotColor}`}></span>
            </span>
            <span className="hidden text-fg-3 lg:inline">System status</span>
            <span className={`font-medium ${textColor}`}>{label}</span>
          </div>

          <div className="hidden flex-col items-end leading-none lg:flex">
            <span className="font-mono text-lg font-medium text-fg tabular" id="clock">
              {currentTime}
            </span>
            <span className="mt-1 text-[11px] text-fg-3">Local time</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
