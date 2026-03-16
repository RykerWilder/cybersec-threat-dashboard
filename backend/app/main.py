import logging
logging.basicConfig(level=logging.DEBUG)
log = logging.getLogger(__name__)

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
# ... tuoi import

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # semplificato per test
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/attacks-trend")
async def get_attacks_trend():
    log.info("🚀 Inizio /api/attacks-trend")
    try:
        # Il tuo codice ISC...
        log.info("✅ ISC API chiamata OK")
        return normalized  # il tuo risultato
    except Exception as e:
        log.error(f"💥 ERRORE attacks-trend: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
