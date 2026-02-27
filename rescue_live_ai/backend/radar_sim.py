import time
import math
import random
from collections import deque
from typing import Dict, Iterator, Tuple


class AdaptiveClutter:
    def __init__(self, alpha: float = 0.01, gate: float = 0.8):
        self.alpha = alpha
        self.baseline = 0.0
        self.gate = gate

    def update(self, x: float, stability_index: float) -> float:
        if stability_index >= self.gate:
            self.baseline = (1 - self.alpha) * self.baseline + self.alpha * x
        return x - self.baseline


def generate_heatmap_bin_energy(t: float, bins: int, base_idx: int, amplitude: float) -> list:
    arr = []
    for i in range(bins):
        dist = abs(i - base_idx)
        val = amplitude * max(0.0, 1.0 - dist / 5.0) + 0.02 * random.random()
        arr.append(val)
    return arr


def radar_stream(step_ms: int = 500) -> Iterator[Dict]:
    t = 0.0
    Fs = 1.0 / (step_ms / 1000.0)
    clutter = AdaptiveClutter()
    bins = 32
    base_idx = 8
    while True:
        resp_freq = random.uniform(0.2, 0.35)
        heart_freq = random.uniform(1.1, 1.6)
        resp = 0.8 * math.sin(2 * math.pi * resp_freq * t)
        heart = 0.12 * math.sin(2 * math.pi * heart_freq * t) + 0.04 * math.sin(2 * math.pi * 2 * heart_freq * t)
        micro_signal = resp + heart + 0.05 * random.gauss(0, 1)
        stability = max(0.0, min(1.0, 0.9 - 0.1 * abs(math.sin(0.05 * t))))
        filtered = clutter.update(micro_signal, stability)
        motion_energy = max(0.0, min(1.0, abs(filtered) * 0.8 + 0.1 * random.random()))
        distance = max(0.5, 6.0 + 0.2 * math.sin(0.01 * t))
        temperature = 24.0 + 4.0 * max(0.0, math.sin(0.005 * t))
        battery = 8.2 - 0.00005 * t
        heatmap = generate_heatmap_bin_energy(t, bins, base_idx, abs(filtered))
        yield {
            "timestamp": time.time(),
            "distance": distance,
            "motion_energy": motion_energy,
            "micro_signal": filtered,
            "respiration_freq": resp_freq,
            "heartbeat_est": heart_freq * 60.0,
            "temperature": temperature,
            "stability_index": stability,
            "battery_voltage": battery,
            "heatmap": heatmap,
        }
        t += 1.0 / Fs
        time.sleep(step_ms / 1000.0)


class SlidingWindow:
    def __init__(self, seconds: int, step_ms: int = 500):
        self.capacity = max(1, int((seconds * 1000) / step_ms))
        self.buf = deque(maxlen=self.capacity)

    def append(self, v: float):
        self.buf.append(v)

    def mean(self) -> float:
        if not self.buf:
            return 0.0
        return sum(self.buf) / len(self.buf)

    def var(self) -> float:
        if not self.buf:
            return 0.0
        m = self.mean()
        return sum((x - m) ** 2 for x in self.buf) / len(self.buf)


def compute_scores(sample: Dict, win_resp: SlidingWindow, win_motion: SlidingWindow) -> Tuple[float, Dict[str, float]]:
    win_resp.append(abs(sample["micro_signal"]))
    win_motion.append(sample["motion_energy"])
    respiration_score = max(0.0, min(1.0, 1.0 - abs(sample["respiration_freq"] - 0.3) / 0.2))
    heartbeat_score = max(0.0, min(1.0, 1.0 - abs(sample["heartbeat_est"] - 78.0) / 60.0))
    thermal_score = max(0.0, min(1.0, (sample["temperature"] - 20.0) / 20.0))
    stability_score = sample["stability_index"]
    motion_consistency_score = max(0.0, 1.0 - min(1.0, win_motion.var()))
    confidence = (
        0.5 * respiration_score
        + 0.2 * heartbeat_score
        + 0.1 * thermal_score
        + 0.1 * stability_score
        + 0.1 * motion_consistency_score
    )
    parts = {
        "respiration_score": respiration_score,
        "heartbeat_score": heartbeat_score,
        "thermal_score": thermal_score,
        "stability_score": stability_score,
        "motion_consistency_score": motion_consistency_score,
    }
    return confidence, parts

