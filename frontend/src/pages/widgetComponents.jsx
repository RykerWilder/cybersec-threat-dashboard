import React from "react";
import ExternalMap from "../components/ExternalMap";
import PopularThreats from "../components/PopularThreats";
import NVDVulnerabilitySeverity from "../components/NVDVulnerabilitySeverity";
import TopVulnerabilitiesList from "../components/TopVulnerabilitiesList";
import AttacksTrend from "../components/AttacksTrends";

const KASPERSKY_MAP_URL = "https://cybermap.kaspersky.com/en/widget/dynamic/dark";
const KASPERSKY_SITE_URL = "https://cybermap.kaspersky.com";
const CHECKPOINT_MAP_URL = "https://threatmap.checkpoint.com";

const KASPERSKY_CATEGORIES = [
  { code: "OAS", label: "On-Access Scan", description: "Malware detected when a file is opened, copied, executed or saved." },
  { code: "ODS", label: "On-Demand Scan", description: "Malware found during a manual or scheduled scan started by the user." },
  { code: "WAV", label: "Web Anti-Virus", description: "Threats detected in web traffic or content." },
  { code: "MAV", label: "Mail Anti-Virus", description: "Threats detected in email messages or attachments." },
  { code: "IDS", label: "Intrusion Detection System", description: "Attacks or malicious activity detected at network level." },
  { code: "VUL", label: "Vulnerability Scan", description: "Detections related to known vulnerabilities in systems." },
  { code: "KAS", label: "Kaspersky Anti-Spam", description: "Suspicious or unwanted email traffic identified by reputation systems." },
  { code: "BAD", label: "Botnet Activity Detection", description: "IP addresses linked to DDoS victims and botnet command and control servers." },
];

/** Widget id -> rendered widget. Each one fills the grid cell it is given. */
export const WIDGET_COMPONENTS = {
  "popular-threats": () => <PopularThreats />,
  "nvd-severity": () => <NVDVulnerabilitySeverity />,
  "vulnerability-feed": () => <TopVulnerabilitiesList />,
  "kaspersky-map": () => (
    <ExternalMap
      title="Kaspersky Cyberthreat Real-Time Map"
      description="Detection events reported by Kaspersky security products worldwide"
      provider="Kaspersky"
      src={KASPERSKY_MAP_URL}
      href={KASPERSKY_SITE_URL}
      legendTitle="Detection categories"
      legend={KASPERSKY_CATEGORIES}
      notice="Events show where a detection happened, not the exact physical location of an attacker."
    />
  ),
  "checkpoint-map": () => (
    <ExternalMap
      title="Check Point Live Cyber Threat Map"
      description="Cyber attacks observed in real or near real time"
      provider="Check Point"
      src={CHECKPOINT_MAP_URL}
      lazy
    />
  ),
  "trend-records": () => <AttacksTrend metricKey="records" />,
  "trend-targets": () => <AttacksTrend metricKey="targets" />,
  "trend-sources": () => <AttacksTrend metricKey="sources" />,
};
