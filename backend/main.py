from datetime import datetime, timedelta
from typing import List, Dict, Any
import os

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ISC_BASE_URL = "https://isc.sans.edu/api/dailysummary"
NVD_BASE_URL = "https://services.nvd.nist.gov/rest/json/cves/2.0"


VT_API_KEY = os.getenv("VT_API_KEY", "INSERISCI_API_KEY_QUI")
VT_BASE_URL = "https://www.virustotal.com/api/v3/popular_threat_categories"


def format_date(d: datetime) -> str:
    return d.strftime("%Y-%m-%d")


def get_severity(cvss_score: float) -> str:
    if cvss_score >= 9.0:
        return "CRITICAL"
    if cvss_score >= 7.0:
        return "HIGH"
    if cvss_score >= 4.0:
        return "MEDIUM"
    return "LOW"


def get_severity_color(severity: str) -> str:
    colors = {
        "CRITICAL": "#dc3545",
        "HIGH": "#fd7e14",
        "MEDIUM": "#ffc107",
        "LOW": "#28a745",
    }
    return colors.get(severity, "#94a3b8")


@app.get("/api/attacks-trend")
async def get_attacks_trend() -> List[Dict[str, Any]]:
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=30)
    start_str = format_date(start_date)
    end_str = format_date(end_date)
    url = f"{ISC_BASE_URL}/{start_str}/{end_str}?json"

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.get(url)
    except httpx.RequestError as exc:
        raise HTTPException(status_code=502, detail=f"Error calling ISC API: {exc}")

    if resp.status_code != 200:
        raise HTTPException(
            status_code=resp.status_code,
            detail=f"ISC API returned status {resp.status_code}",
        )

    data = resp.json()
    daily_data = data if isinstance(data, list) else data.get("dailysummary", [])

    normalized = []
    for item in daily_data:
        date_str = item.get("date")
        try:
            date_obj = datetime.strptime(date_str, "%Y-%m-%d")
        except Exception:
            continue

        normalized.append(
            {
                "date": format_date(date_obj),
                "records": int(item.get("records", 0)) or 0,
                "targets": int(item.get("targets", 0)) or 0,
                "sources": int(item.get("sources", 0)) or 0,
            }
        )

    normalized.sort(key=lambda x: x["date"])
    return normalized


@app.get("/api/nvd-severity")
async def get_nvd_severity():
    """Ultime 10 CVE degli ultimi 7 giorni con severity, score e colori"""
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=7)
    
    params = {
        "resultsPerPage": 10,
        "pubStartDate": start_date.isoformat() + "Z",
        "pubEndDate": end_date.isoformat() + "Z",
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(NVD_BASE_URL, params=params)
    except httpx.RequestError as exc:
        raise HTTPException(status_code=502, detail=f"Error calling NVD API: {exc}")

    if resp.status_code != 200:
        raise HTTPException(
            status_code=resp.status_code,
            detail=f"NVD API returned status {resp.status_code}"
        )

    data = resp.json()
    vulnerabilities = data.get("vulnerabilities", [])

    if not vulnerabilities:
        return []

    normalized = []
    for vuln in vulnerabilities[:10]:
        cve = vuln.get("cve", {})
        cvss_v31 = cve.get("metrics", {}).get("cvssMetricV31", [{}])[0]
        cvss_v2 = cve.get("metrics", {}).get("cvssMetricV2", [{}])[0]
        
        cvss_v3_score = cvss_v31.get("cvssData", {}).get("baseScore", 0)
        cvss_v2_score = cvss_v2.get("cvssData", {}).get("baseScore", 0)
        cvss_score = cvss_v3_score or cvss_v2_score or 0
        
        severity = get_severity(cvss_score)
        color = get_severity_color(severity)
        
        normalized.append({
            "cveId": cve.get("id", "Unknown"),
            "cvssScore": float(cvss_score),
            "severity": severity,
            "color": color,
            "borderColor": color.replace("#", "#aa") if "#" in color else color,
        })

    return normalized


@app.get("/api/popular-threats")
async def get_popular_threats():
    """
    Restituisce i dati già nel formato Chart.js per il frontend
    """
    headers = {
        "accept": "application/json",
        "x-apikey": VT_API_KEY,
    }

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.get(VT_BASE_URL, headers=headers)
    except httpx.RequestError as exc:
        raise HTTPException(status_code=502, detail=f"Error calling VirusTotal API: {exc}")

    if resp.status_code != 200:
        raise HTTPException(
            status_code=resp.status_code,
            detail=f"VirusTotal API returned status {resp.status_code}: {resp.text}",
        )

    data = resp.json()
    vt_items = data.get("data", [])

    raw_categories = []
    for item in vt_items:
        if isinstance(item, str):
            raw_categories.append(item)
        elif isinstance(item, dict):
            attr = item.get("attributes", {})
            cat = (
                attr.get("label")
                or attr.get("category")
                or item.get("id")
                or item.get("type")
            )
            if isinstance(cat, str):
                raw_categories.append(cat)

    if not raw_categories:
        raise HTTPException(status_code=502, detail="No categories returned by VirusTotal")

    if len(raw_categories) > 15:
        top_cats = raw_categories[7:15]
    else:
        top_cats = raw_categories[:5]

    labels = [
        (cat.replace("_", " ").title() if isinstance(cat, str) else "Unknown")
        for cat in top_cats
    ]

    data_values = [100 - idx * 15 for idx in range(len(top_cats))]

    background_colors = [
        "#c084fc",
        "#a855f7",
        "#9333ea",
        "#7c3aed",
        "#6d28d9",
        "#5b21b6",
        "#4c1d95",
    ][:len(top_cats)]

    border_color = ["#324158"]

    chart_data = {
        "labels": labels,
        "datasets": [
            {
                "data": data_values,
                "backgroundColor": background_colors,
                "borderColor": border_color,
                "borderWidth": 2,
            }
        ],
    }

    return chart_data


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
