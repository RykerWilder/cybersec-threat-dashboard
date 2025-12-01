import { useState, useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const ThreatMap = () => {
  const [threats, setThreats] = useState([]);

  useEffect(() => {
    fetchThreatData();
    const interval = setInterval(fetchThreatData, 300000);
    return () => clearInterval(interval);
  }, []);

  const ABUSEIPDB_API_KEY = import.meta.env.VITE_ABUSEIPDB_API_KEY;

  const fetchThreatData = async () => {
    try {
      const response = await fetch('https://threatfeeds.io/api/v1/latest');
      
      if (!response.ok) {
        throw new Error('Failed to fetch');
      }

      const data = await response.json();
      
      const formattedThreats = data.threats.map((threat, index) => ({
        id: `threat-${index}-${Date.now()}`,
        lat: threat.latitude,
        lng: threat.longitude,
        type: threat.type,
        severity: threat.severity,
        sourceIp: threat.source_ip,
        timestamp: threat.timestamp
      }));

      setThreats(formattedThreats);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const getColorBySeverity = (severity) => {
    switch (severity) {
      case "high":
        return "#dc2626";
      case "medium":
        return "#f59e0b";
      case "low":
        return "#10b981";
      default:
        return "#3b82f6";
    }
  };

  return (
    <div className="bg-slate-700 break-inside-avoid border border-stone-500 rounded-lg p-4 w-[60%]">
      <h3 className="text-xl text-slate-400 font-semibold text-center mb-4">
        Cyber Threat Map
      </h3>
      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ height: "400px", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap &copy; CARTO'
        />
        {threats.map((threat) => (
          <CircleMarker
            key={threat.id}
            center={[threat.lat, threat.lng]}
            radius={8}
            pathOptions={{
              color: getColorBySeverity(threat.severity),
              fillColor: getColorBySeverity(threat.severity),
              fillOpacity: 0.7,
              weight: 2
            }}
          >
            <Popup>
              <div>
                <p><strong>Type:</strong> {threat.type}</p>
                <p><strong>Severity:</strong> {threat.severity}</p>
                <p><strong>Source IP:</strong> {threat.sourceIp}</p>
                <p><strong>Time:</strong> {new Date(threat.timestamp).toLocaleString()}</p>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
};

export default ThreatMap;