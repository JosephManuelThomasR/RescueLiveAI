import asyncio
import json
import os
import threading
from typing import List, Dict
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
import uvicorn
from .state_manager import RTOSLikeManager, SystemState
from .radar_sim import radar_stream, SlidingWindow, compute_scores
from .llm_integration import generate_recommendation
from sse_starlette.sse import EventSourceResponse
from .pathway_pipeline import start_docstore_if_available
from .pathway_stream import start_pathway


class Metrics(BaseModel):
    timestamp: float
    distance: float
    motion_energy: float
    micro_signal: float
    respiration_freq: float
    heartbeat_est: float
    temperature: float
    stability_index: float
    battery_voltage: float
    heatmap: List[float]
    confidence: float
    acc_confidence: float
    state: str
    scan_mode: str
    silent_mode: bool


class ConnectionManager:
    def __init__(self):
        self.active: List[WebSocket] = []
        self.lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        async with self.lock:
            self.active.append(websocket)

    async def disconnect(self, websocket: WebSocket):
        async with self.lock:
            if websocket in self.active:
                self.active.remove(websocket)

    async def broadcast(self, message: str):
        async with self.lock:
            to_remove = []
            for ws in self.active:
                try:
                    await ws.send_text(message)
                except Exception:
                    to_remove.append(ws)
            for ws in to_remove:
                self.active.remove(ws)


app = FastAPI()
manager = ConnectionManager()
rtos = RTOSLikeManager()
latest_metrics: Dict | None = None


def pipeline_thread():
    global latest_metrics
    rtos.power_on()
    rtos.self_test(True)
    rtos.calibrated()
    rtos.stream_ready()
    try:
        start_docstore_if_available(os.path.join(os.getcwd(), "rescue_live_ai", "docs"))
    except Exception:
        pass
    def cb(row: dict):
        global latest_metrics
        rtos.start_analyzing()
        rtos.update_battery(row.get("battery_voltage", 8.0))
        rtos.decide(float(row.get("confidence", 0.0)))
        out = dict(row)
        out["confidence"] = rtos.ctx.confidence
        out["acc_confidence"] = rtos.ctx.acc_confidence
        out["state"] = rtos.ctx.state.name
        out["scan_mode"] = rtos.ctx.scan_config.mode
        out["silent_mode"] = rtos.ctx.flags.silent_mode
        latest_metrics = out
    t = start_pathway(cb)
    if t is None:
        win_resp = SlidingWindow(10)
        win_motion = SlidingWindow(10)
        scan_id = 0
        for sample in radar_stream(step_ms=500):
            if rtos.ctx.scan_config.mode == "RAPID":
                scan_len = rtos.ctx.scan_config.rapid_seconds
            else:
                scan_len = rtos.ctx.scan_config.deep_seconds
            conf, parts = compute_scores(sample, win_resp, win_motion)
            rtos.start_analyzing()
            rtos.update_battery(sample["battery_voltage"])
            rtos.decide(conf)
            scan_id += 1
            latest_metrics = {
                "timestamp": sample["timestamp"],
                "distance": sample["distance"],
                "motion_energy": sample["motion_energy"],
                "micro_signal": sample["micro_signal"],
                "respiration_freq": sample["respiration_freq"],
                "heartbeat_est": sample["heartbeat_est"],
                "temperature": sample["temperature"],
                "stability_index": sample["stability_index"],
                "battery_voltage": sample["battery_voltage"],
                "heatmap": sample["heatmap"],
                "confidence": rtos.ctx.confidence,
                "acc_confidence": rtos.ctx.acc_confidence,
                "state": rtos.ctx.state.name,
                "scan_mode": rtos.ctx.scan_config.mode,
                "silent_mode": rtos.ctx.flags.silent_mode,
                "parts": parts,
                "scan_len": scan_len,
                "scan_id": scan_id,
            }
    else:
        t.join()


bg_thread = threading.Thread(target=pipeline_thread, daemon=True)
bg_thread.start()


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/system-state")
def system_state():
    ctx = rtos.ctx
    return {
        "state": ctx.state.name,
        "confidence": ctx.confidence,
        "acc_confidence": ctx.acc_confidence,
        "battery_voltage": ctx.battery_voltage,
        "scan_mode": ctx.scan_config.mode,
        "silent_mode": ctx.flags.silent_mode,
        "fault_reason": ctx.flags.fault_reason,
    }


@app.get("/live-metrics")
def live_metrics():
    return latest_metrics or {}


@app.get("/alerts")
def alerts():
    if not latest_metrics:
        return []
    state = latest_metrics["state"]
    alerts = []
    if state == "LIFE_DETECTED":
        alerts.append({"type": "life", "message": "Life detected"})
    if rtos.ctx.battery_voltage < 6.6:
        alerts.append({"type": "battery", "message": "Battery low"})
    return alerts


@app.get("/ai-recommendation")
def ai_recommendation():
    if not latest_metrics:
        return {}
    state = latest_metrics["state"]
    rec = generate_recommendation(state, latest_metrics, docs_dir=os.path.join(os.getcwd(), "rescue_live_ai", "docs"))
    return rec


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await asyncio.sleep(0.5)
            if latest_metrics:
                await manager.broadcast(json.dumps(latest_metrics))
    except WebSocketDisconnect:
        await manager.disconnect(websocket)
    except Exception:
        await manager.disconnect(websocket)

@app.get("/sse")
async def sse():
    async def event_generator():
        while True:
            await asyncio.sleep(0.5)
            if latest_metrics:
                yield {"event": "metrics", "data": json.dumps(latest_metrics)}
    return EventSourceResponse(event_generator())

@app.post("/toggle-silent")
def toggle_silent():
    rtos.ctx.flags.silent_mode = not rtos.ctx.flags.silent_mode
    return {"silent_mode": rtos.ctx.flags.silent_mode}


@app.post("/scan-mode/{mode}")
def set_scan_mode(mode: str):
    rtos.set_scan_mode(mode)
    return {"scan_mode": rtos.ctx.scan_config.mode}


def main():
    uvicorn.run(app, host="0.0.0.0", port=8080)


if __name__ == "__main__":
    main()
