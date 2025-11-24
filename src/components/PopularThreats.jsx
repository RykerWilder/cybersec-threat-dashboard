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

        // Prendi solo le prime 5 minacce
        const top5Threats = threats.slice(7, 15);

        const labels = top5Threats.map((threat) => {
          // Formatta i nomi delle minacce per renderli più leggibili
          return threat
            .replace(/_/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase()) || "Unknown";
        });

        // Per VirusTotal, le categorie popolari non hanno un "valore" numerico
        // quindi usiamo un valore fittizio o possiamo fare una chiamata aggiuntiva
        // per ottenere statistiche reali. Per ora uso un valore basato sulla posizione.
        const data = top5Threats.map((threat, index) => {
          // Assegna valori decrescenti (la prima minaccia ha valore più alto)
          return 100 - (index * 15);
        });

        setChartData({
          labels: labels,
          datasets: [
            {
              borderWidth: 2,
              borderRadius: 4,
              borderSkipped: false,
              data: data,
              backgroundColor: [
                "rgba(153, 102, 255, 0.7)"
              ],
              borderColor: [
                "rgba(153, 102, 255, 1)"
              ]
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
            max: 100,
            ticks: {
              color: "#94a3b8",
              precision: 1
            },
            grid: {
              color: "rgba(148, 163, 184, 0.1)",
            },
            title: {
              display: true,
              text: 'Threats Score',
              color: '#94a3b8',
              font: {
                size: 13,
                weight: 'bold'
              },
            }
          },
          x: {
            ticks: {
              color: "#94a3b8",
              maxRotation: 90,
              minRotation: 90,
            },
            grid: {
              display:true
            },
            title: {
              display: true,
              text: 'Threats',
              color: '#94a3b8',
              font: {
                size: 13,
                weight: 'bold'
              },
            }
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          title: {
            display: true,
            text: "Popular Threat Categories",
            color: "#94a3b8",
            font: {
              size: 20,
              weight: 'bold'
            },
          },
        },
        animation: {
          duration: 1000,
          easing: 'easeInOutQuart'
        }
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
    <div className="break-inside-avoid border border-stone-500 rounded-lg p-4 bg-slate-700">
      <div className="relative h-100">
        <canvas ref={chartRef} className="h-64"></canvas>
      </div>
    </div>
  );
};

export default PopularThreats;