import React, { useEffect, useState } from "react";

const TopVulnerabilitiesList = () => {
  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/nvd-severity");
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }
        const data = await response.json();
        setVulnerabilities(data);
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
    <div className="break-inside-avoid border border-stone-500 rounded-lg p-4 bg-slate-700 h-[500px] flex flex-col w-[35%]">
      <h3 className="text-xl text-slate-400 font-semibold text-center mb-4">
        NVD Latest Vulnerabilities
      </h3>
      <div className="space-y-3 flex-1 overflow-y-auto">
        {vulnerabilities.length === 0 ? (
          <div className="text-slate-400 text-center py-4">
            No vulnerabilities found in the last 7 days
          </div>
        ) : (
          vulnerabilities.map((vulnerability, index) => (
            <div
              key={vulnerability.cveId}
              className="p-3 rounded-lg border border-slate-600 bg-slate-800 hover:bg-slate-750 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div 
                    className="w-3 h-3 rounded-full mt-1.5" 
                    style={{ backgroundColor: vulnerability.color || '#94a3b8' }}
                  ></div>
                  <div className="flex-1">
                    <a
                      href={`https://nvd.nist.gov/vuln/detail/${vulnerability.cveId}`}
                      className="underline text-sm text-slate-200 font-semibold"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {vulnerability.cveId}
                    </a>
                    <div className="text-xs text-slate-400 mt-2 line-clamp-3">
                      CVSS {vulnerability.cvssScore?.toFixed(1) || 'N/A'} - {vulnerability.severity || 'Unknown'}
                    </div>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                      <span>Severity: {vulnerability.severity || 'Unknown'}</span>
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
