import React, { useEffect, useRef, useState } from "react";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LineController,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import Panel, { PanelState } from "./Panel";
import { AXIS_LINE, GRID, TICKS, TOOLTIP } from "../theme/chartTheme";
import { getJSON } from "../lib/api";

ChartJS.register(
  LineElement,
  PointElement,
  LineController,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

const METRICS = [
  {
    key: "records",
    label: "Number of attacks",
    color: "#3987e5",
    background: "rgba(57, 135, 229, 0.14)",
  },
  {
    key: "targets",
    label: "Number of targets",
    color: "#d95926",
    background: "rgba(217, 89, 38, 0.14)",
  },
  {
    key: "sources",
    label: "Number of attackers",
    color: "#199e70",
    background: "rgba(25, 158, 112, 0.14)",
  },
];

const SingleMetricChart = ({ metric, labels, values }) => {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = chartRef.current.getContext("2d");
    chartInstanceRef.current = new ChartJS(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: metric.label,
            data: values,
            borderColor: metric.color,
            backgroundColor: metric.background,
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: metric.color,
            pointHoverBorderColor: "#0f1a2b",
            pointHoverBorderWidth: 2,
            tension: 0.35,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: "index",
          intersect: false,
        },
        plugins: {
          legend: {
            display: false,
          },
          title: {
            display: false,
            text: metric.label,
          },
          tooltip: {
            ...TOOLTIP,
            mode: "index",
            intersect: false,
          },
        },
        scales: {
          x: {
            ticks: {
              ...TICKS,
              maxRotation: 90,
              minRotation: 90,
              autoSkip: true,
              maxTicksLimit: 15,
            },
            grid: { display: false },
            border: AXIS_LINE,
          },
          y: {
            type: "linear",
            position: "left",
            min: 0,
            ticks: TICKS,
            grid: GRID,
            border: { display: false },
          },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [metric, labels, values]);

  return (
    <div className="relative size-full">
      <canvas ref={chartRef} role="img" aria-label={metric.label}></canvas>
    </div>
  );
};

/**
 * One attack-trend chart. The three metrics (records, targets, sources) are
 * separate dashboard widgets that share a single /api/attacks-trend request.
 */
const AttacksTrend = ({ metricKey }) => {
  const metric = METRICS.find((item) => item.key === metricKey) ?? METRICS[0];
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await getJSON("/api/attacks-trend");

        const labels = data.map((item) => item.date);
        const values = {
          records: data.map((item) => item.records || 0),
          targets: data.map((item) => item.targets || 0),
          sources: data.map((item) => item.sources || 0),
        };

        setChartData({ labels, values });
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
  let latest;
  if (loading) {
    body = <PanelState kind="loading" title="Loading attack trend data" />;
  } else if (error) {
    body = <PanelState kind="error" title="Unable to load attack trend" detail={error} />;
  } else {
    const series = chartData.values[metric.key];
    latest = series[series.length - 1];
    body = (
      <div className="absolute inset-0 p-5">
        <SingleMetricChart metric={metric} labels={chartData.labels} values={series} />
      </div>
    );
  }

  return (
    <Panel
      title={
        <span className="flex items-center gap-2">
          <span
            className="h-0.5 w-4 rounded-full"
            style={{ backgroundColor: metric.color }}
            aria-hidden
          ></span>
          {metric.label}
        </span>
      }
      description="Daily count over the last 30 days"
      meta={
        latest !== undefined ? (
          <div className="text-right leading-none">
            <span className="font-mono text-base font-medium text-fg tabular">
              {latest.toLocaleString()}
            </span>
            <span className="ml-1.5 text-xs text-fg-3">latest day</span>
          </div>
        ) : null
      }
      footer={
        <p className="px-5 py-2.5 text-xs text-fg-3">Source: ISC SANS Internet Storm Center</p>
      }
    >
      {body}
    </Panel>
  );
};

export default AttacksTrend;
