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

const AttacksTrend = () => {
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

        const response = await fetch("/api/attacks-trend");
        if (!response.ok) {
          throw new Error(`HTTP error status: ${response.status}`);
        }

        const data = await response.json();

        const labels = data.map((item) => item.date);
        const recordsData = data.map((item) => item.records || 0);
        const targetsData = data.map((item) => item.targets || 0);
        const sourcesData = data.map((item) => item.sources || 0);

        setChartData({
          labels,
          datasets: [
            {
              label: "Number of attacks",
              data: recordsData,
              borderColor: "#3b82f6",
              backgroundColor: "rgba(59, 130, 246, 0.1)",
              borderWidth: 2,
              tension: 0.4,
              fill: true,
              yAxisID: "y",
            },
            {
              label: "Number of targets",
              data: targetsData,
              borderColor: "#ef4444",
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              borderWidth: 2,
              tension: 0.4,
              fill: true,
              yAxisID: "y1",
            },
            {
              label: "Number of attackers",
              data: sourcesData,
              borderColor: "#22c55e",
              backgroundColor: "rgba(34, 197, 94, 0.1)",
              borderWidth: 2,
              tension: 0.4,
              fill: true,
              yAxisID: "y1",
            },
          ],
        });
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

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = chartRef.current.getContext("2d");
    chartInstanceRef.current = new ChartJS(ctx, {
      type: "line",
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: "top",
          },
          title: {
            display: true,
            text: "Attacks Trend - Last 30 days",
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
            },
          },
          y: {
            type: "linear",
            position: "left",
            min: 0,
          },
          y1: {
            type: "linear",
            position: "right",
            min: 0,
            grid: {
              drawOnChartArea: false,
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
  }, [chartData, loading]);

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
    <div className="border border-stone-500 rounded-lg p-4 bg-slate-700">
      <div className="h-96">
        <canvas ref={chartRef}></canvas>
      </div>
    </div>
  );
};

export default AttacksTrend;
