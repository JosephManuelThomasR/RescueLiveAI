# RescueLiveAI — Single‑Link Demo OS + Pathway Backend + ESP‑IDF Firmware

## Summary
- One link demo: Next.js wearable‑style UI with boot/scan/detect states, confidence ring, waveform, heatmap, AI panel with citations.
- Backend: FastAPI + SSE with a Pathway streaming pipeline (custom connector → transforms → writer) for continuous updates.
- Firmware: ESP‑IDF FreeRTOS skeleton for 3.5″ SPI TFT + touch + UART radar + I2C sensors + I2S audio.
- Fallback: If backend is missing, the UI runs an internal streaming engine with zero errors and no env vars.

## Repository Structure
```
.
├─ rescue_live_ai/
│  ├─ backend/          # FastAPI + SSE + Pathway streaming
│  └─ ui/               # Next.js wearable OS UI (Vercel-ready)
├─ firmware/
│  └─ radar_x/          # ESP‑IDF skeleton with FreeRTOS tasks/queues
└─ docs/                # Technical documentation and diagrams
```

## Quickstart
### Frontend (single-link demo)
- Deploy to Vercel with Root Directory set to `rescue_live_ai/ui`.
- Framework: Next.js. Build: `npm run build`. No env vars required.
- Open the Vercel URL: the OS UI boots, scans, and detects. If no backend is set, it runs internally.

### Backend (Pathway)
- Python 3.11+ (Linux/macOS recommended).
- Install: `pip install -r rescue_live_ai/backend/requirements.txt`
- Run: `python -m rescue_live_ai.backend.app` (port 8080).
- Live SSE: `http://localhost:8080/sse` (UI consumes this when proxied or same‑origin).

### Single Link with Live Streaming
- Add Vercel rewrites (Project → Settings → Routing → Rewrites):
  - `/sse` → `https://YOUR-BACKEND/sse`
  - `/health` → `https://YOUR-BACKEND/health`
  - `/ai-recommendation` → `https://YOUR-BACKEND/ai-recommendation`
- The UI auto‑updates via Pathway when backend is available; otherwise it uses its internal engine.

## Pathway Usage (Hackathon Compliance)
- The backend uses the actual Pathway library with a custom Python connector to ingest radar frames, incremental transforms to compute confidence/state, and a writer to emit updates. The engine runs with `pw.run()` ensuring automatic, continuous updates.
- Code: `rescue_live_ai/backend/pathway_stream.py` and integration in `rescue_live_ai/backend/app.py`.

## ESP‑IDF Firmware (Device UI)
- Project: `firmware/radar_x`
- Build:
  - `idf.py set-target esp32`
  - `idf.py build`
  - `idf.py -p COMX flash monitor`
- Integrate TFT/Touch/Audio/Sensors per the pin map and state machine in `docs/RADAR_X_TechDoc.md`.

## Scripts
- Frontend:
  - `npm run dev` — local dev server
  - `npm run build` — production build
- Backend:
  - `python -m rescue_live_ai.backend.app` — runs FastAPI on port 8080

## Highlights
- Adaptive clutter rejection, multi‑scan confidence accumulation, tactical silent mode, Rapid/Deep scans.
- AI panel with citations and typing animation.
- Hardware‑ready badges and Pathway badge integrated into a premium embedded‑style UI.

## Contributing
- Issues and PRs welcome. Please keep node_modules and build outputs out of Git (see `.gitignore`). Use lint/format scripts for UI and ruff for backend.

