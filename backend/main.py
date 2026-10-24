from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any
import os
from dotenv import load_dotenv

load_dotenv()

import httpx
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from cache import TTLCache


def _int_env(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, default))
    except (TypeError, ValueError):
        return default


# Cache lifetimes in seconds. The upstream APIs are rate limited, so the
# dashboard reads from memory and refreshes at most once per interval.
CACHE_TTL_NVD = _int_env("CACHE_TTL_NVD", 600)      # 10 minutes
CACHE_TTL_VT = _int_env("CACHE_TTL_VT", 900)        # 15 minutes
CACHE_TTL_ISC = _int_env("CACHE_TTL_ISC", 10800)    # 3 hours (ISC publishes daily)
# How long browsers may reuse a response without asking the API again.
BROWSER_MAX_AGE = _int_env("BROWSER_MAX_AGE", 60)

cache = TTLCache()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # One shared client: connections to the upstream APIs are kept alive and reused.
    async with httpx.AsyncClient(
        timeout=30.0,
        follow_redirects=True,
        limits=httpx.Limits(max_connections=20, max_keepalive_connections=10),
    ) as client:
        app.state.http = client
        yield


app = FastAPI(title="Threat Dashboard API", version="1.0.0", lifespan=lifespan)

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
app.add_middleware(GZipMiddleware, minimum_size=500)

ISC_BASE_URL = "https://isc.sans.edu/api/dailysummary"
NVD_BASE_URL = "https://services.nvd.nist.gov/rest/json/cves/2.0"

VT_API_KEY = os.getenv("VT_API_KEY")
if not VT_API_KEY:
    raise ValueError("No VT_API_KEY in .env file")
VT_BASE_URL = "https://www.virustotal.com/api/v3/popular_threat_categories"


def utc_now() -> datetime:
    """Current UTC time as a naive datetime (same shape the code used before)."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


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
        "CRITICAL": "#e5484d",
        "HIGH": "#ec835a",
        "MEDIUM": "#fab219",
        "LOW": "#2fbf71",
    }
    return colors.get(severity, "#94a3b8")


def set_browser_cache(response: Response) -> None:
    response.headers["Cache-Control"] = f"public, max-age={BROWSER_MAX_AGE}"


async def fetch_attacks_trend(client: httpx.AsyncClient) -> List[Dict[str, Any]]:
    end_date = utc_now()
    start_date = end_date - timedelta(days=30)
    start_str = format_date(start_date)
    end_str = format_date(end_date)
    url = f"{ISC_BASE_URL}/{start_str}/{end_str}?json"

    try:
        resp = await client.get(url, timeout=20.0)
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


async def fetch_nvd_severity(client: httpx.AsyncClient) -> List[Dict[str, Any]]:
    end_date = utc_now()
    start_date = end_date - timedelta(days=7)
    params = {
        "resultsPerPage": 10,
        "pubStartDate": start_date.isoformat() + "Z",
        "pubEndDate": end_date.isoformat() + "Z",
    }

    try:
        resp = await client.get(NVD_BASE_URL, params=params, timeout=30.0)
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
            "borderColor": color,
        })

    return normalized


async def fetch_popular_threats(client: httpx.AsyncClient) -> Dict[str, Any]:
    headers = {
        "accept": "application/json",
        "x-apikey": VT_API_KEY,
    }

    try:
        resp = await client.get(VT_BASE_URL, headers=headers, timeout=20.0)
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

        # Ordered blue ramp (rank 1 = lightest), matches the dashboard theme
        background_colors = [
            "#c2eaff", "#9fd5ff", "#7ac0fa", "#52aaef",
            "#2b95e0", "#2d7fbd", "#2c6b9b", "#2a567a"
        ][:n]

        return {
            "labels": labels,
            "datasets": [{
                "label": "Threat Popularity",
                "data": data_values,
                "backgroundColor": background_colors,
                "borderColor": "#0f1a2b",
                "borderWidth": 2,
            }]
        }
    except HTTPException:
        raise
    except httpx.RequestError as exc:
        raise HTTPException(status_code=502, detail=f"VirusTotal Network: {exc}")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Error: {exc}")


@app.get("/api/attacks-trend")
async def get_attacks_trend(request: Request, response: Response) -> List[Dict[str, Any]]:
    client = request.app.state.http
    data = await cache.get_or_fetch(
        "attacks-trend", CACHE_TTL_ISC, lambda: fetch_attacks_trend(client)
    )
    set_browser_cache(response)
    return data


@app.get("/api/nvd-severity")
async def get_nvd_severity(request: Request, response: Response) -> List[Dict[str, Any]]:
    client = request.app.state.http
    data = await cache.get_or_fetch(
        "nvd-severity", CACHE_TTL_NVD, lambda: fetch_nvd_severity(client)
    )
    set_browser_cache(response)
    return data


@app.get("/api/popular-threats")
async def get_popular_threats(request: Request, response: Response) -> Dict[str, Any]:
    client = request.app.state.http
    data = await cache.get_or_fetch(
        "popular-threats", CACHE_TTL_VT, lambda: fetch_popular_threats(client)
    )
    set_browser_cache(response)
    return data


@app.get("/api/health")
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
    print(f"Health: http://localhost:8000/api/health")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
