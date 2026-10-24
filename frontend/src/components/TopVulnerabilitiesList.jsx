import React, { useEffect, useState } from "react";
import Panel, { PanelState } from "./Panel";
import { getJSON } from "../lib/api";

const TITLE = "Vulnerability feed";
const DESCRIPTION = "CVEs published in the last 7 days";

const ExternalIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="size-3.5 shrink-0 opacity-0 transition-opacity group-hover/link:opacity-100 group-focus-visible/link:opacity-100"
    aria-hidden
  >
    <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
  </svg>
);

const TopVulnerabilitiesList = ({ className = "" }) => {
  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await getJSON("/api/nvd-severity");
        setVulnerabilities(data);
      } catch (err) {
        console.error("Data fetch error:", err);
        setError(err.message || "Error downloading data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  let body;
  if (loading) {
    body = <PanelState kind="loading" title="Loading NVD vulnerabilities" />;
  } else if (error) {
    body = <PanelState kind="error" title="Unable to load vulnerabilities" detail={error} />;
  } else {
    // The list is absolutely positioned inside a flexible box so that it
    // scrolls instead of stretching the row it shares with the map.
    body = (
      <>
        <ul className="scroll-thin absolute inset-0 divide-y divide-ink-600 overflow-y-auto">
          {vulnerabilities.length === 0 ? (
            <li className="px-5 py-8 text-center text-fg-3">
              No vulnerabilities found in the last 7 days
            </li>
          ) : (
            vulnerabilities.map((vulnerability) => {
              const color = vulnerability.color || "#94a3b8";
              const severity = vulnerability.severity || "Unknown";
              return (
                <li
                  key={vulnerability.cveId}
                  className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-ink-700/60"
                >
                  <span
                    className="h-9 w-1 shrink-0 rounded-full"
                    style={{ backgroundColor: color }}
                    aria-hidden
                  ></span>
                  <div className="min-w-0 flex-1">
                    <a
                      href={`https://nvd.nist.gov/vuln/detail/${vulnerability.cveId}`}
                      className="group/link inline-flex max-w-full items-center gap-1.5 font-mono text-[13px] font-medium text-accent hover:text-accent-strong hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className="truncate">{vulnerability.cveId}</span>
                      <ExternalIcon />
                    </a>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-fg-3">
                      <span
                        className="rounded border px-1.5 py-px font-medium text-fg-2"
                        style={{ borderColor: `${color}66`, backgroundColor: `${color}1f` }}
                      >
                        {severity}
                      </span>
                    </div>
                  </div>
                  <div className="text-right leading-none">
                    <div className="font-mono text-lg font-medium text-fg tabular">
                      {vulnerability.cvssScore?.toFixed(1) || "N/A"}
                    </div>
                    <div className="mt-1 text-[11px] text-fg-3">CVSS</div>
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </>
    );
  }

  return (
    <Panel
      title={TITLE}
      description={DESCRIPTION}
      meta={
        !loading && !error ? (
          <span className="rounded bg-ink-700 px-2 py-0.5 font-mono text-xs text-fg-2">
            {vulnerabilities.length}
          </span>
        ) : null
      }
      className={className}
      bodyClassName="overflow-hidden rounded-b-lg"
    >
      {body}
    </Panel>
  );
};

export default TopVulnerabilitiesList;
