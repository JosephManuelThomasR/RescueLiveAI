from enum import Enum, auto
from dataclasses import dataclass, field
import time


class SystemState(Enum):
    POWER_OFF = auto()
    BOOTING = auto()
    SELF_TEST = auto()
    INITIALIZING_STREAM = auto()
    SCANNING = auto()
    ANALYZING = auto()
    LIFE_DETECTED = auto()
    POSSIBLE_LIFE = auto()
    NO_LIFE = auto()
    LOW_BATTERY = auto()
    FAULT = auto()
    SHUTDOWN = auto()
    CALIBRATION = auto()


@dataclass
class ScanConfig:
    mode: str = "RAPID"
    rapid_seconds: int = 5
    deep_seconds: int = 20


@dataclass
class SystemFlags:
    silent_mode: bool = False
    calibrated: bool = False
    fault_reason: str | None = None


@dataclass
class SystemContext:
    state: SystemState = SystemState.POWER_OFF
    confidence: float = 0.0
    battery_voltage: float = 8.0
    last_transition_ts: float = field(default_factory=time.time)
    scan_config: ScanConfig = field(default_factory=ScanConfig)
    flags: SystemFlags = field(default_factory=SystemFlags)
    acc_confidence: float = 0.0
    lambda_decay: float = 0.7

    def set_state(self, s: SystemState):
        self.state = s
        self.last_transition_ts = time.time()

    def toggle_silent(self):
        self.flags.silent_mode = not self.flags.silent_mode

    def set_scan_mode(self, mode: str):
        self.scan_config.mode = "DEEP" if mode.upper() == "DEEP" else "RAPID"


class RTOSLikeManager:
    def __init__(self):
        self.ctx = SystemContext()

    def power_on(self):
        self.ctx.set_state(SystemState.BOOTING)

    def self_test(self, ok: bool):
        if ok:
            self.ctx.set_state(SystemState.SELF_TEST)
            self.ctx.set_state(SystemState.CALIBRATION)
        else:
            self.ctx.flags.fault_reason = "Self-test failed"
            self.ctx.set_state(SystemState.FAULT)

    def calibrated(self):
        self.ctx.flags.calibrated = True
        self.ctx.set_state(SystemState.INITIALIZING_STREAM)

    def stream_ready(self):
        self.ctx.set_state(SystemState.SCANNING)

    def start_analyzing(self):
        self.ctx.set_state(SystemState.ANALYZING)

    def low_battery(self):
        self.ctx.set_state(SystemState.LOW_BATTERY)
        self.ctx.flags.silent_mode = True

    def update_battery(self, v: float, threshold: float = 6.6):
        self.ctx.battery_voltage = v
        if v < threshold:
            self.low_battery()

    def fault(self, reason: str):
        self.ctx.flags.fault_reason = reason
        self.ctx.set_state(SystemState.FAULT)

    def accumulate_confidence(self, instant_conf: float):
        self.ctx.acc_confidence = self.ctx.lambda_decay * self.ctx.acc_confidence + (1 - self.ctx.lambda_decay) * instant_conf

    def decide(self, instant_conf: float):
        self.ctx.confidence = instant_conf
        self.accumulate_confidence(instant_conf)
        if self.ctx.battery_voltage < 6.6:
            self.low_battery()
            return
        if instant_conf > 0.8:
            self.ctx.set_state(SystemState.LIFE_DETECTED)
        elif 0.5 <= instant_conf <= 0.8:
            self.ctx.set_state(SystemState.POSSIBLE_LIFE)
        else:
            self.ctx.set_state(SystemState.NO_LIFE)

    def shutdown(self):
        self.ctx.set_state(SystemState.SHUTDOWN)

