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

        console.log("Dati API:", response.data);

        const threats = response.data.data || [];

        const labels = threats.map((threat) => threat || "Unknown");

        const data = threats.map((threat) => threat.length || 0);

        setChartData({
          labels: labels,
          datasets: [
            {
              data: data,
              backgroundColor: ["rgba(153, 102, 255, 0.7)"],
            },
          ],
        });
      } catch (err) {
        console.error("Errore nel fetch dei dati:", err);
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
      Chart.CategoryScale,
      Chart.LinearScale,
      Chart.BarElement,
      Chart.BarController,
      Chart.Title,
      Chart.Tooltip,
      Chart.Legend
    );

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = chartRef.current.getContext("2d");
    chartInstanceRef.current = new Chart.Chart(ctx, {
      type: "bar",
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: "#94a3b8",
            },
            grid: {
              color: "rgba(148, 163, 184, 0.1)",
            },
          },
          x: {
            ticks: {
              color: "#94a3b8",
            },
            grid: {
              color: "rgba(148, 163, 184, 0.1)",
            },
          },
        },
        plugins: {
          legend: {
            labels: {
              color: "#94a3b8",
            },
          },
          title: {
            display: true,
            text: "Popular threat categories",
            color: "#94a3b8",
            font: {
              size: 16,
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
      <div className="break-inside-avoid border border-stone-500 rounded-lg p-4 bg-slate-700 flex items-center justify-center">
        <div className="text-slate-300">Loading Virus Total data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="break-inside-avoid border border-stone-500 rounded-lg p-4 bg-slate-700">
        <div className="text-red-400">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="break-inside-avoid border border-stone-500 rounded-lg p-4 bg-slate-700">
      <canvas ref={chartRef} className="h-64"></canvas>
    </div>
  );
};

export default PopularThreats;
