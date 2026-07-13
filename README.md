# Threat Dashboard Documentation

![License](https://img.shields.io/badge/license-MIT-blue)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black&labelColor=F7DF1E)
![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)

<img src="https://github.com/RykerWilder/static_files/blob/main/cyber-threat-dash1.webp" alt="Threat Dashboard">

## Overview
Cybersecurity dashboard displaying real, up-to-date data from 3 different sources:
- **ISC SANS** (Internet Storm Center)
- **NVD NIST** (National Vulnerability Database)
- **VirusTotal** (Threat Intelligence)

The dashboard has five main charts:

1. The first chart (doughnut) uses `/api/popular-threats` and shows the top 8 threat categories from VirusTotal.

2. The second chart (bar chart) uses `/api/nvd-severity` and displays the top 10 CVEs from the last 7 days, colored by severity from NVD NIST.

3. The iframe opens the [Check Point Live Cyber ​​Threat Map](https://threatmap.checkpoint.com), an interactive map that shows cyber attacks observed in real or near real time.

4. The fourth graph is a list using `/api/nvd-severity` and displays all the latest vulnerabilities, with the option to learn more by going directly to the NVD NIST website.

5. The embedded iframe in the dashboard loads the [Kaspersky](https://cybermap.kaspersky.com) Cyberthreat Live Map, an external map that displays real-time security events detected by the Kaspersky telemetry network. The data displayed does not represent the exact physical location of an attacker, but rather detection events collected by Kaspersky security products and systems worldwide.

The map displays several detection categories:

- OAS (On-Access Scan): Malware detected when a file is opened, copied, executed, or saved.

- ODS (On-Demand Scan): Malware detected during a manual or scheduled scan initiated by the user.

- WAV (Web Anti-Virus): Threats detected in web traffic or content.

- MAV (Mail Anti-Virus): Threats detected in email messages or attachments.

- IDS (Intrusion Detection System): Attacks or malicious activity detected at the network level.

- VUL / VLNS (Vulnerability Scan): Detections related to known vulnerabilities in systems.

- KAS (Kaspersky Anti-Spam): Suspicious or unwanted email traffic identified by Kaspersky reputation systems.

- BAD (Botnet Activity Detection): Statistics on IP addresses associated with DDoS attack victims and botnet command and control servers detected by Kaspersky.

6. The sixth graph (line chart) uses the `/api/attacks-trend` endpoint and shows the attack trend over the last 30 days with three lines for records, targets, and sources from ISC SANS.

## API Endpoints

| Endpoint | Data | Source | Chart | Update |
|----------|------|--------|-------|--------|
| `/api/attacks-trend` | 30-day attack trend (records, targets, sources) | **ISC SANS** | Line | **Daily** |
| `/api/nvd-severity` | Top 10 CVEs last 7 days (score, severity, colors) | **NVD NIST** | Bar/Scatter | **Real** |
| `/api/popular-threats` | Top 8 threat categories (% + name) | **VirusTotal** | **Doughnut** | **Real** |
| `/health` | API Status | - | - | - |

## Installation

1. Clone repository
```bash
git clone https://github.com/RykerWilder/cybersec-threat-dashboard
```

2. Insert Virus Total API Key
```bash
echo "VT_API_KEY=your_virustotal_key_here" > backend/.env
```

3. Start container (Startup around 30s)
```bash
docker compose up -d --build
```
