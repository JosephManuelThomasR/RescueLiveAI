# RescueLiveAI — Real-Time Radar-Based Living Person Detection & AI Decision System

## Overview
- Full-stack system using a simulated radar stream every 500 ms, a streaming pipeline, API, and a wearable-style UI.
- Backend: FastAPI on port 8080 with WebSocket and REST, Docker-ready.
- Streaming: Sliding windows, rolling averages, stateful confidence, events.
- Document Store: Pathway-compatible doc index placeholder with citations.
- LLM: Generates strategy, risks, tools, triage with citations.
- Frontend: Next.js with OS-like UI, confidence ring, waveform, heatmap, live updates, demo fallback.

## Directory Layout
- rescue_live_ai/backend: Python backend (API, FSM, simulator, LLM/docstore).
- rescue_live_ai/ui: Next.js UI.
- docs/RescueLiveAI_Architecture.md: Architecture and state diagrams.

## Backend
### Local
1. Python 3.11
2. `pip install -r rescue_live_ai/backend/requirements.txt`
3. `python -m rescue_live_ai.backend.app`
4. API: http://localhost:8080, WS: ws://localhost:8080/ws

### Docker
1. `docker build -t rescuetools/rescue-live-ai -f rescue_live_ai/backend/Dockerfile .`
2. `docker run -p 8080:8080 rescuetools/rescue-live-ai`

### Endpoints
- GET /health
- GET /live-metrics
- GET /system-state
- GET /alerts
- GET /ai-recommendation
- POST /toggle-silent
- POST /scan-mode/{RAPID|DEEP}
- WS /ws

## Frontend
### Dev
1. Node 18+
2. `cd rescue_live_ai/ui`
3. `npm i`
4. `npm run dev`
5. Open http://localhost:3000

### Config
- NEXT_PUBLIC_BACKEND_WS (default ws://localhost:8080/ws)
- NEXT_PUBLIC_BACKEND_HTTP (default http://localhost:8080)

## Features
- Adaptive clutter rejection, auto recalibration at boot.
- Multi-scan confidence accumulation (exponential decay).
- Tactical silent mode; forced in low battery if configured.
- Rapid (5 s) and Deep (20 s) scan modes.
- Heatmap mini-view to aid repositioning.
- RTOS-like UI state transitions and color coding.

## Notes
- Pathway xPack hooks are stubbed for portability. Enable by adding the library in the backend and wiring the document pipeline in `pathway_pipeline.py`.
- Do not embed secrets. Configure LLM providers via environment variables when integrating xpacks.

