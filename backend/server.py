# Supervisor shim.
#
# The Emergent supervisor config (/etc/supervisor/conf.d/supervisord.conf) is a
# read-only file that expects a uvicorn-served FastAPI app at /app/backend on
# port 8001. This repository is a single-root Next.js 15 app at /app; all real
# API routes are served by Next.js on port 3000 (e.g. /api/auth/callback,
# /api/admin/*, /api/recipes/*, etc.) and reach the browser via the Emergent
# ingress, NOT via this process.
#
# This file exists ONLY so supervisor's `backend` program does not flap with
# "couldn't chdir to /app/backend: ENOENT" / "exited too quickly", which used
# to flood logs and (in some platform restarts) cause cascading restart loops
# that took down the `frontend` program too.
#
# It deliberately:
#   - exposes no application routes
#   - touches no database
#   - reads no secrets
#   - imports no project code
#
# Do not add real API behavior here. All real APIs belong in /app/src/app/api.

from fastapi import FastAPI
from fastapi.responses import JSONResponse

app = FastAPI(
    title="emergent-backend-shim",
    description="Inert placeholder so supervisor's backend program stays UP. All real APIs are served by Next.js at /app on port 3000.",
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
)


@app.get("/healthz")
def healthz() -> dict:
    return {"status": "ok", "role": "supervisor-shim"}


@app.get("/")
def root() -> JSONResponse:
    return JSONResponse(
        status_code=404,
        content={
            "error": "not_found",
            "hint": "This is the supervisor shim on port 8001. Real APIs are served by Next.js on port 3000 under /api/*.",
        },
    )
