from datetime import datetime, timedelta
from typing import List, Dict, Any
import os
from dotenv import load_dotenv

load_dotenv()

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Threat Dashboard API", version="1.0.0")

origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://localhost",
    "http://127.0.0.1",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ISC_BASE_URL = "https://isc.sans.edu/api/dailysummary"
NVD_BASE_URL = "https://services.nvd.nist.gov/rest/json/cves/2.0"

VT_API_KEY = os.getenv("VT_API_KEY")
if not VT_API_KEY:
    raise ValueError("No VT_API_KEY in .env file")
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
        async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as client:
            resp = await client.get(url)
    except httpx.RequestError as exc:
        raise HTTPException(status_code=502, detail=f"ISC API error: {exc}")

    if resp.status_code != 200:
        raise HTTPException(
            status_code=resp.status_code,
            detail=f"ISC API {resp.status_code}: {resp.text[:200]}",
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
async def get_nvd_severity() -> List[Dict[str, Any]]:
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=7)
    
    params = {
        "resultsPerPage": 10,
        "pubStartDate": start_date.isoformat() + "Z",
        "pubEndDate": end_date.isoformat() + "Z",
    }

    try:
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            resp = await client.get(NVD_BASE_URL, params=params)
    except httpx.RequestError as exc:
        raise HTTPException(status_code=502, detail=f"NVD API error: {exc}")

    if resp.status_code != 200:
        raise HTTPException(
            status_code=resp.status_code,
            detail=f"NVD API {resp.status_code}: {resp.text[:200]}"
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
async def get_popular_threats() -> Dict[str, Any]:
    headers = {
        "accept": "application/json",
        "x-apikey": VT_API_KEY,
    }

    try:
        async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as client:
            resp = await client.get(VT_BASE_URL, headers=headers)
            
        if resp.status_code != 200:
            raise HTTPException(
                status_code=resp.status_code,
                detail=f"VirusTotal {resp.status_code}: {resp.text[:300]}",
            )

        data = resp.json()
        categories = data.get("data", [])

        top_categories = categories[:8]
        labels = [cat.replace("_", " ").title() for cat in top_categories]

        n = len(top_categories)
        data_values = [95 - (i * 10) for i in range(n)]

        background_colors = [
            "#c084fc", "#a855f7", "#9333ea", "#7c3aed",
            "#6d28d9", "#5b21b6", "#4c1d95", "#3730a3"
        ][:n]

        chart_data = {
            "labels": labels,
            "datasets": [{
                "label": "Threat Popularity",
                "data": data_values,
                "backgroundColor": background_colors,
                "borderColor": "#1e293b",
                "borderWidth": 2,
            }]
        }
        
        return chart_data
        
    except httpx.RequestError as exc:
        raise HTTPException(status_code=502, detail=f"VirusTotal Network: {exc}")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Error: {exc}")


@app.get("/health")
async def health_check():
    """API health check"""
    return {
        "status": "healthy",
        "vt_key_loaded": bool(VT_API_KEY),
        "endpoints": ["/api/attacks-trend", "/api/nvd-severity", "/api/popular-threats"]
    }


if __name__ == "__main__":
    import uvicorn
    print("Starting Threat Dashboard")
    print(f"Health: http://localhost:8000/health")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
