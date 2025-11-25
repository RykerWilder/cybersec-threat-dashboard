// components/ThreatMap.jsx
import { useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  CircleMarker,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix per i marker icons in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const ThreatMap = () => {
  // 👇 Ora useState funzionerà perché è importato
  const [threats, setThreats] = useState([
    { id: 1, lat: 40.7128, lng: -74.006, type: "malware", severity: "high" },
    {
      id: 2,
      lat: 34.0522,
      lng: -118.2437,
      type: "phishing",
      severity: "medium",
    },
    { id: 3, lat: 51.5074, lng: -0.1278, type: "ddos", severity: "high" },
  ]);

  const getColorBySeverity = (severity) => {
    switch (severity) {
      case "high":
        return "red";
      case "medium":
        return "orange";
      case "low":
        return "green";
      default:
        return "blue";
    }
  };

  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      style={{ height: "500px", width: "100%" }}
      className="rounded-lg"
    >
      <TileLayer
        url="https://tiles.stadiamaps.com/tiles/stamen_toner/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://www.stamen.com/" target="_blank">Stamen Design</a>'
      />

      {threats.map((threat) => (
        <CircleMarker
          key={threat.id}
          center={[threat.lat, threat.lng]}
          radius={10}
          color={getColorBySeverity(threat.severity)}
          fillColor={getColorBySeverity(threat.severity)}
          fillOpacity={0.6}
        >
          <Popup>
            <div>
              <h3>🚨 Threat Detected</h3>
              <p>
                <strong>Type:</strong> {threat.type}
              </p>
              <p>
                <strong>Severity:</strong> {threat.severity}
              </p>
              <p>
                <strong>Location:</strong> {threat.lat}, {threat.lng}
              </p>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
};

export default ThreatMap;
