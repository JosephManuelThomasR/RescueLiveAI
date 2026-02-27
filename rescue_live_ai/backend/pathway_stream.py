import threading
from typing import Callable

try:
    import pathway as pw
except Exception:
    pw = None

from .radar_sim import radar_stream


def _conf(resp_f: float, heart_bpm: float, temp: float, stab: float, mot: float) -> float:
    rs = max(0.0, min(1.0, 1.0 - abs(resp_f - 0.3) / 0.2))
    hs = max(0.0, min(1.0, 1.0 - abs(heart_bpm - 78.0) / 60.0))
    ts = max(0.0, min(1.0, (temp - 20.0) / 20.0))
    ss = max(0.0, min(1.0, stab))
    ms = max(0.0, min(1.0, 1.0 - min(1.0, mot)))
    return max(0.0, min(1.0, 0.5 * rs + 0.2 * hs + 0.1 * ts + 0.1 * ss + 0.1 * ms))


def _state(conf: float, batt: float) -> str:
    if batt < 6.6:
        return "LOW_BATTERY"
    if conf > 0.8:
        return "LIFE_DETECTED"
    if conf >= 0.5:
        return "POSSIBLE_LIFE"
    return "NO_LIFE"


def start_pathway(callback: Callable[[dict], None]) -> threading.Thread | None:
    if pw is None:
        return None

    class InputSchema(pw.Schema):
        timestamp: float = pw.column_definition(primary_key=True)
        distance: float
        motion_energy: float
        micro_signal: float
        respiration_freq: float
        heartbeat_est: float
        temperature: float
        stability_index: float
        battery_voltage: float
        heatmap: list

    class RadarSubject(pw.io.python.ConnectorSubject):
        def run(self):
            for s in radar_stream(step_ms=500):
                self.next(
                    timestamp=s["timestamp"],
                    distance=s["distance"],
                    motion_energy=s["motion_energy"],
                    micro_signal=s["micro_signal"],
                    respiration_freq=s["respiration_freq"],
                    heartbeat_est=s["heartbeat_est"],
                    temperature=s["temperature"],
                    stability_index=s["stability_index"],
                    battery_voltage=s["battery_voltage"],
                    heatmap=s["heatmap"],
                )
                self.commit()

    subject = RadarSubject()
    table = pw.io.python.read(subject, schema=InputSchema, autocommit_duration_ms=500)

    conf = table.select(
        timestamp=table.timestamp,
        distance=table.distance,
        motion_energy=table.motion_energy,
        micro_signal=table.micro_signal,
        respiration_freq=table.respiration_freq,
        heartbeat_est=table.heartbeat_est,
        temperature=table.temperature,
        stability_index=table.stability_index,
        battery_voltage=table.battery_voltage,
        heatmap=table.heatmap,
        confidence=pw.apply(_conf, table.respiration_freq, table.heartbeat_est, table.temperature, table.stability_index, table.motion_energy),
    ).with_columns(
        state=pw.apply(_state, pw.this.confidence, pw.this.battery_voltage),
        scan_mode=pw.make_constant("RAPID"),
        silent_mode=pw.make_constant(False),
        acc_confidence=pw.this.confidence,
    )

    class Observer(pw.io.python.ConnectorObserver):
        def on_change(self, key, row, time, is_addition):
            if is_addition:
                out = dict(row)
                callback(out)

        def on_end(self):
            pass

    pw.io.python.write(conf, Observer())

    def run():
        pw.run()

    t = threading.Thread(target=run, daemon=True)
    t.start()
    return t

