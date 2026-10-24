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

It also embeds two live attack maps from [Kaspersky](https://cybermap.kaspersky.com) and [Check Point](https://threatmap.checkpoint.com).

The dashboard is a mosaic of eight panels. You can rearrange and resize them in the [Layout editor](#layout-editor).

1. **Popular threat categories** (doughnut chart) uses `/api/popular-threats` and shows the top 8 threat categories from VirusTotal. The score shown for each category is derived from its rank in the VirusTotal response.

2. **NVD severity scores** (bar chart) uses `/api/nvd-severity` and displays the top 10 CVEs published in the last 7 days, colored by severity.

3. **Vulnerability feed** (list) uses the same `/api/nvd-severity` data and lists the latest vulnerabilities with their CVSS score and severity. Each CVE links to its page on the NVD NIST website.

4. **Kaspersky live map** (embedded iframe) loads the [Kaspersky Cyberthreat Real-Time Map](https://cybermap.kaspersky.com), which displays security events detected by the Kaspersky telemetry network. The data does not represent the exact physical location of an attacker, but rather detection events collected by Kaspersky security products and systems worldwide.

5. **Check Point live map** (embedded iframe) loads the [Check Point Live Cyber Threat Map](https://threatmap.checkpoint.com), an interactive map that shows cyber attacks observed in real or near real time.

6. **Attack trend charts** (three line charts: number of attacks, targets and attackers) use `/api/attacks-trend` and show the trend over the last 30 days from ISC SANS.

Both maps are third-party pages. Each one has controls to reload, view full screen or open it in a new tab, and shows a message if the provider does not respond (some networks or providers do not allow embedding).


## API Endpoints

| Endpoint | Data | Source | Chart | Cache |
|----------|------|--------|-------|-------|
| `/api/attacks-trend` | 30-day attack trend (records, targets, sources) | **ISC SANS** | Line | 3 hours |
| `/api/nvd-severity` | Top 10 CVEs last 7 days (score, severity, colors) | **NVD NIST** | Bar and list | 10 minutes |
| `/api/popular-threats` | Top 8 threat categories (name + score) | **VirusTotal** | Doughnut | 15 minutes |
| `/api/health` | API status | - | - | none |

## Configuration

Settings are read from `backend/.env`.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VT_API_KEY` | yes | - | VirusTotal API key |
| `CACHE_TTL_NVD` | no | `600` | Seconds the NVD data is cached |
| `CACHE_TTL_VT` | no | `900` | Seconds the VirusTotal data is cached |
| `CACHE_TTL_ISC` | no | `10800` | Seconds the ISC SANS data is cached |
| `BROWSER_MAX_AGE` | no | `60` | Seconds browsers may reuse a response |

## Installation

1. Clone repository
```bash
git clone https://github.com/RykerWilder/cybersec-threat-dashboard
cd cybersec-threat-dashboard
```

2. Run the setup script. It asks for your [VirusTotal API key](https://www.virustotal.com) (the input is hidden), saves it in `backend/.env` and offers to start the project
```bash
./setup.sh
```
You can also create the file by hand: `echo "VT_API_KEY=your_virustotal_key_here" > backend/.env`. On Windows run the script from WSL or Git Bash.

3. If you did not start the project from the script, start the containers (startup around 30s) and open http://localhost:3000
```bash
docker compose up -d --build
```

## License

MIT, see [LICENSE](LICENSE).