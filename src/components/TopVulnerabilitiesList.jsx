import React, { useEffect, useState } from "react";
import axios from "axios";

const TopVulnerabilitiesList = () => {
  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Calcola le date per gli ultimi 7 giorni
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);

        const pubEndDate = endDate.toISOString();
        const pubStartDate = startDate.toISOString();

        const response = await axios.get(
          `https://services.nvd.nist.gov/rest/json/cves/2.0`,
          {
            params: {
              resultsPerPage: 10,
              pubStartDate: pubStartDate,
              pubEndDate: pubEndDate
            },
            headers: {
              accept: "application/json",
            },
          }
        );

        const vulnerabilitiesData = response.data.vulnerabilities || [];
        setVulnerabilities(vulnerabilitiesData);
      } catch (err) {
        console.error("Errore nel fetch dei dati:", err);
        setError(err.message || "Error downloading data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="break-inside-avoid border border-stone-500 rounded-lg p-4 bg-slate-700 flex items-center justify-center">
        <div className="text-slate-300">
          Loading NVD Vulnerabilities data...
        </div>
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
    <div className="break-inside-avoid border border-stone-500 rounded-lg p-4 bg-slate-700 ">
      <h3 className="text-xl text-slate-400 font-semibold text-center mb-4">
        NVD Latest Vulnerabilities Explanation
      </h3>
      <div className="space-y-3 max-h-90 overflow-y-auto relative">
        {vulnerabilities.length === 0 ? (
          <div className="text-slate-400 text-center py-4">
            No vulnerabilities found in the last 7 days
          </div>
        ) : (
          vulnerabilities.map((vulnerability, index) => (
            <div
              key={vulnerability.cve.id}
              className="p-3 rounded-lg border border-slate-600 bg-slate-800 hover:bg-slate-750 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="w-3 h-3 rounded-full bg-violet-400 mt-1.5"></div>
                  <div className="flex-1">
                    {/* Titolo CVE */}
                    <div className="font-mono text-sm text-slate-200 font-semibold">
                      {vulnerability.cve.id}
                    </div>
                    {/* Descrizione */}
                    <div className="text-xs text-slate-400 mt-2 line-clamp-3">
                      {vulnerability.cve.descriptions?.[0]?.value ||
                        "No description available"}
                    </div>
                    {/* Metadata aggiuntivo */}
                    <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                      <span>
                        Published:{" "}
                        {new Date(
                          vulnerability.cve.published
                        ).toLocaleDateString()}
                      </span>
                      <span>Status: {vulnerability.cve.vulnStatus}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TopVulnerabilitiesList;