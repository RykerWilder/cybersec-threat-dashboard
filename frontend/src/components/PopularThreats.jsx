import React, { useEffect, useRef, useState } from "react";
import Chart from "chart.js/auto";
import Panel, { PanelState } from "./Panel";
import { INK, TOOLTIP } from "../theme/chartTheme";
import { getJSON } from "../lib/api";

const TITLE = "Popular threat categories";
const DESCRIPTION = "Top categories by popularity score";

const PopularThreats = () => {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await getJSON("/api/popular-threats");
        setChartData(data);
      } catch (err) {
        console.error("Data fetch error:", err);
        setError(err.message || "Error downloading data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!chartData || loading) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = chartRef.current.getContext("2d");
    chartInstanceRef.current = new Chart(ctx, {
      type: "doughnut",
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "64%",
        plugins: {
          legend: {
            display: true,
            position: "right",
            labels: {
              color: INK.fg2,
              padding: 12,
              boxWidth: 12,
              boxHeight: 12,
              usePointStyle: true,
              pointStyle: "rectRounded",
              font: { size: 12 }
            }
          },
          title: {
            display: false,
            text: TITLE,
          },
          tooltip: {
            ...TOOLTIP,
            callbacks: {
              label: function(context) {
                let label = context.label || "";
                if (label) label += ": ";
                return label + context.parsed + " (Score)";
              }
            }
          }
        },
        animation: {
          duration: 1000,
          easing: "easeInOutQuart"
        }
      }
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [chartData, loading]);

  let body;
  if (loading) {
    body = <PanelState kind="loading" title="Loading VirusTotal data" />;
  } else if (error) {
    body = <PanelState kind="error" title="Unable to load threat categories" detail={error} />;
  } else {
    body = (
      <div className="absolute inset-0 p-5">
        <div className="relative size-full">
          <canvas ref={chartRef} aria-label={TITLE} role="img"></canvas>
        </div>
      </div>
    );
  }

  return (
    <Panel
      title={TITLE}
      description={DESCRIPTION}
      meta={<span className="text-xs text-fg-3">Source: VirusTotal</span>}
      footer={
        <p className="px-5 py-3 text-xs leading-5 text-fg-2">
          Segments run from the most popular category (lightest) to the least popular (darkest).
        </p>
      }
    >
      {body}
    </Panel>
  );
};

export default PopularThreats;
