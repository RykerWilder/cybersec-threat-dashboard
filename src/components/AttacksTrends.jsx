import React, { useEffect, useRef, useState } from "react";
import * as Chart from "chart.js";

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
        const response = await fetch(
          "https://isc.sans.edu/api/dailysummary/2025-11-01/2025-12-02?json"
        );
        
        if (!response.ok) {
          throw new Error(`HTTP error status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Response data:", data);

        let dailyData = [];
        if (Array.isArray(data)) {
          dailyData = data;
        } else if (data.dailysummary && Array.isArray(data.dailysummary)) {
          dailyData = data.dailysummary;
        }

        const sortedData = dailyData.sort((a, b) => 
          new Date(a.date) - new Date(b.date)
        );

        const labels = sortedData.map(item => item.date);
        const recordsData = sortedData.map(item => parseInt(item.records) || 0);
        const targetsData = sortedData.map(item => parseInt(item.targets) || 0);
        const sourcesData = sortedData.map(item => parseInt(item.sources) || 0);
        
        console.log("Labels:", labels);

        setChartData({
          labels: labels,
          datasets: [
            {
              label: "Number of attacks",
              data: recordsData,
              borderColor: "#3b82f6",
              backgroundColor: "rgba(59, 130, 246, 0.1)",
              borderWidth: 2,
              tension: 0.4,
              fill: true,
              yAxisID: 'y',
            },
            {
              label: "Number of targets",
              data: targetsData,
              borderColor: "#ef4444",
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              borderWidth: 2,
              tension: 0.4,
              fill: true,
              yAxisID: 'y1',
            },
            {
              label: "Number of attackers",
              data: sourcesData,
              borderColor: "#22c55e",
              backgroundColor: "rgba(34, 197, 94, 0.1)",
              borderWidth: 2,
              tension: 0.4,
              fill: true,
              yAxisID: 'y1',
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
      Chart.LineElement,
      Chart.PointElement,
      Chart.LineController,
      Chart.CategoryScale,
      Chart.LinearScale,
      Chart.Title,
      Chart.Tooltip,
      Chart.Legend,
      Chart.Filler
    );

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = chartRef.current.getContext("2d");
    chartInstanceRef.current = new Chart.Chart(ctx, {
      type: "line",
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: "top",
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
            text: "Attacks Trend - Last 30 days",
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
            mode: "index",
            intersect: false,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            titleColor: "#fff",
            bodyColor: "#fff",
            borderColor: "#94a3b8",
            borderWidth: 1,
          },
        },
        scales: {
          x: {
            ticks: {
              color: "#94a3b8",
              maxRotation: 90,
              minRotation: 90,
            },
            grid: {
              color: "rgba(148, 163, 184, 0.1)",
            }
          },
          y: {
            type: 'linear',
            position: 'left',
            min: 0,
            max: 25000000,
            ticks: {
              color: "#3b82f6",
              stepSize: 5000000,
            },
            grid: {
              color: "rgba(148, 163, 184, 0.1)",
            },
            title: {
              display: true,
              text: 'Attacks',
              color: '#3b82f6',
              font: {
                size: 12,
                weight: 'bold'
              }
            }
          },
          y1: {
            type: 'linear',
            position: 'right',
            min: 0,
            max: 250000,
            ticks: {
              color: "#94a3b8"
            },
            grid: {
              drawOnChartArea: false,
            },
            title: {
              display: true,
              text: 'Targets / Attackers',
              color: '#94a3b8',
              font: {
                size: 12,
                weight: 'bold'
              }
            }
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