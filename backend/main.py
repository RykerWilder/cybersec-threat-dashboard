@app.get("/api/nvd-severity")
async def get_nvd_severity():
    """Fix versione semplificata NVD"""
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=7)
    
    # Formato NVD corretto (senza Z finale)
    params = {
        "resultsPerPage": 10,
        "pubStartDate": start_date.strftime("%Y-%m-%dT%H:%M:%S"),
        "pubEndDate": end_date.strftime("%Y-%m-%dT%H:%M:%S"),
    }
    
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:  # NVD lento
            resp = await client.get(NVD_BASE_URL, params=params)
            
        if resp.status_code != 200:
            return [{"error": f"NVD API {resp.status_code}", "params": params}]
        
        data = resp.json()
        vulns = data.get("vulnerabilities", [])
        
        if not vulns:
            return []
            
        # Parsing safe
        result = []
        for vuln in vulns[:10]:
            cve = vuln.get("cve", {})
            metrics = cve.get("metrics", {})
            
            # Prendi primo score disponibile
            score = 0
            for version in ["cvssMetricV31", "cvssMetricV2"]:
                cvss_list = metrics.get(version, [])
                if cvss_list:
                    cvss_data = cvss_list[0].get("cvssData", {})
                    score = cvss_data.get("baseScore", 0)
                    if score > 0:
                        break
            
            severity = get_severity(score)
            result.append({
                "cveId": cve.get("id", "N/A"),
                "cvssScore": float(score),
                "severity": severity,
                "color": get_severity_color(severity),
            })
        
        return result
        
    except Exception as e:
        return [{"error": str(e), "hint": "NVD API momentaneamente down?"}]
