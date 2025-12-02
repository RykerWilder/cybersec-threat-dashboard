import React, { useEffect, useRef, useState } from "react";
import * as Chart from "chart.js";
import axios from "axios";

const PopularThreats = () => {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const VIRUSTOTAL_API_KEY = import.meta.env.VITE_VIRUSTOTAL_API_KEY;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const response = await axios.get(
          "https://www.virustotal.com/api/v3/popular_threat_categories",
          {
            headers: {
              accept: "application/json",
              "x-apikey": VIRUSTOTAL_API_KEY,
            },
          }
        );

        const threats = response.data.data || [];

        const top5Threats = threats.slice(7, 15);

        const labels = top5Threats.map((threat) => {
          return (
            threat
              .replace(/_/g, " ")
              .replace(/\b\w/g, (l) => l.toUpperCase()) || "Unknown"
          );
        });

        const data = top5Threats.map((threat, index) => {
          return 100 - index * 15;
        });

        const backgroundColors = [
          "#c084fc",
          "#a855f7",
          "#9333ea",
          "#7c3aed",
          "#6d28d9",
          "#5b21b6",
          "#4c1d95"
        ];

        const borderColor = ["#324158"];

        setChartData({
          labels: labels,
          datasets: [
            {
              data: data,
              backgroundColor: backgroundColors,
              borderColor: borderColor,
              borderWidth: 2,
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

    Chart.Chart.register(
      Chart.ArcElement,
      Chart.DoughnutController,
      Chart.Title,
      Chart.Tooltip,
      Chart.Legend
    );

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = chartRef.current.getContext("2d");
    chartInstanceRef.current = new Chart.Chart(ctx, {
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
              font: {
                size: 12,
              },
            },
          },
          title: {
            display: true,
            text: "Popular Threat Categories",
            color: "#94a3b8",
            font: {
              size: 20,
              weight: "bold",
            },
            padding: {
              bottom: 20,
            },
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                let label = context.label || "";
                if (label) {
                  label += ": ";
                }
                label += context.parsed + " (Score)";
                return label;
              },
            },
          },
        },
        animation: {
          duration: 1000,
          easing: "easeInOutQuart",
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
      <div className="break-inside-avoid border border-stone-500 rounded-lg p-4 bg-slate-700 flex items-center justify-center">
        <div className="text-slate-300">Loading Virus Total data...</div>
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
      <div className="h-100">
        <canvas ref={chartRef}></canvas>
      </div>
    </div>
  );
};

export default PopularThreats;
