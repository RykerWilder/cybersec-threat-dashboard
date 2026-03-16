from datetime import datetime, timedelta
from typing import List, Dict, Any

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

def format_date(d: datetime) -> str:
    return d.strftime("%Y-%m-%d")

def get_severity(cvss_score: float) -> str:
    if cvss_score >= 9.0: return "CRITICAL"
    if cvss_score >= 7.0: return "HIGH"
    if cvss_score >= 4.0: return "MEDIUM"
    return "LOW"

def get_severity_color(severity: str) -> str:
    colors = {
        "CRITICAL": "#dc3545",
        "HIGH": "#fd7e14", 
        "MEDIUM": "#ffc107",
        "LOW": "#28a745"
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
        raise HTTPException(status_code=resp.status_code, detail=f"ISC API returned status {resp.status_code}")

    data = resp.json()
    daily_data = data if isinstance(data, list) else data.get("dailysummary", [])

    normalized = []
    for item in daily_data:
        date_str = item.get("date")
        try:
            date_obj = datetime.strptime(date_str, "%Y-%m-%d")
        except Exception:
            continue

        normalized.append({
            "date": format_date(date_obj),
            "records": int(item.get("records", 0)) or 0,
            "targets": int(item.get("targets", 0)) or 0,
            "sources": int(item.get("sources", 0)) or 0,
        })

    normalized.sort(key=lambda x: x["date"])
    return normalized

@app.get("/api/nvd-severity")
async def get_nvd_severity() -> List[Dict[str, Any]]:
    """Ultime 10 CVE con severity colorata (7 giorni)"""
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
        raise HTTPException(status_code=resp.status_code, detail=f"NVD API returned status {resp.status_code}")

    data = resp.json()
    vulnerabilities = data.get("vulnerabilities", [])

    if not vulnerabilities:
        raise HTTPException(status_code=404, detail="No recent vulnerabilities found")

    normalized = []
    for vuln in vulnerabilities[:10]:  # max 10
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
            "borderColor": color.replace("0.8", "1") if "0.8" in color else color,
        })

    return normalized
