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
    color: "#3b82f6",
    background: "rgba(59, 130, 246, 0.15)",
  },
  {
    key: "targets",
    label: "Number of targets",
    color: "#ef4444",
    background: "rgba(239, 68, 68, 0.15)",
  },
  {
    key: "sources",
    label: "Number of attackers",
    color: "#22c55e",
    background: "rgba(34, 197, 94, 0.15)",
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
            pointRadius: 2,
            pointHoverRadius: 4,
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
            display: true,
            color: "#e2e8f0",
            text: metric.label,
            align: "start",
            font: {
              size: 15,
              weight: "bold",
            },
            padding: { bottom: 10 },
          },
          tooltip: {
            mode: "index",
            intersect: false,
          },
        },
        scales: {
          x: {
            ticks: {
              maxRotation: 90,
              minRotation: 90,
              color: "#90a1b8",
              autoSkip: true,
              maxTicksLimit: 15,
            },
            grid: {
              color: "rgba(148, 163, 184, 0.1)",
            },
          },
          y: {
            type: "linear",
            position: "left",
            min: 0,
            ticks: {
              color: "#90a1b8",
            },
            grid: {
              color: "rgba(148, 163, 184, 0.1)",
            },
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
    <div className="h-64">
      <canvas ref={chartRef}></canvas>
    </div>
  );
};

const AttacksTrend = () => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/attacks-trend");
        if (!response.ok) {
          throw new Error(`HTTP error status: ${response.status}`);
        }

        const data = await response.json();

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

  if (loading) {
    return (
      <div className="break-inside-avoid border border-stone-500 rounded-lg p-4 bg-slate-700 flex items-center justify-center h-96">
        <div className="text-slate-300">Loading data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="break-inside-avoid border border-stone-500 rounded-lg p-4 bg-slate-700 h-96 flex items-center justify-center">
        <div className="text-red-400 text-center">
          <div className="font-semibold mb-2">Error Loading Data</div>
          <div className="text-sm">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="break-inside-avoid border border-stone-500 rounded-lg p-4 bg-slate-700">
      <div className="text-slate-300 font-bold text-xl mb-4">
        Attacks Trend - Last 30 days
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {METRICS.map((metric, index) => (
          <div
            key={metric.key}
            className={index === 0 ? "lg:col-span-2" : ""}
          >
            <SingleMetricChart
              metric={metric}
              labels={chartData.labels}
              values={chartData.values[metric.key]}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default AttacksTrend;