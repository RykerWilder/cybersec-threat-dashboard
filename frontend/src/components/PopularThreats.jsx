import React, { useEffect, useRef, useState } from "react";
import Chart from "chart.js/auto";

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

        const response = await fetch("/api/popular-threats");
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }
        const data = await response.json();
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
        plugins: {
          legend: {
            display: true,
            position: "right",
            labels: {
              color: "#94a3b8",
              padding: 15,
              font: { size: 12 }
            }
          },
          title: {
            display: true,
            text: "Popular Threat Categories",
            color: "#94a3b8",
            font: { size: 20, weight: "bold" },
            padding: { bottom: 20 }
          },
          tooltip: {
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

  if (loading) {
    return (
      <div className="break-inside-avoid border border-stone-500 rounded-lg p-4 bg-slate-700 flex items-center justify-center">
        <div className="text-slate-300">Loading VirusTotal data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="break-inside-avoid border border-stone-500 rounded-lg p-4 bg-slate-700">
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

export default PopularThreats;
