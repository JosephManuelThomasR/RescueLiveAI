export type UIMode = "RAPID" | "DEEP";
export type UIState = "POWER_ON" | "SYSTEM_CHECK" | "CALIBRATION" | "STREAM_INITIALIZED" | "SCANNING" | "ANALYZING" | "LIFE_DETECTED" | "POSSIBLE_LIFE" | "NO_LIFE" | "LOW_BATTERY" | "FAULT" | "SHUTDOWN";
export type Metrics = {
  timestamp: number;
  distance: number;
  motion_energy: number;
  micro_signal: number;
  respiration_freq: number;
  heartbeat_est: number;
  temperature: number;
  stability_index: number;
  battery_voltage: number;
  heatmap: number[];
  confidence: number;
  acc_confidence: number;
  state: UIState;
  scan_mode: UIMode;
  silent_mode: boolean;
};

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function genHeatmap(center: number, bins: number, amp: number) {
  const v: number[] = [];
  for (let i = 0; i < bins; i++) {
    const d = Math.abs(i - center);
    v.push(Math.max(0, amp * (1 - d / 6) + 0.02 * Math.random()));
  }
  return v;
}

export class InternalEngine {
  private intervalId: any;
  private t = 0;
  private Fs = 2;
  private lambda = 0.7;
  private acc = 0;
  private disp = 0;
  private mode: UIMode = "RAPID";
  private state: UIState = "POWER_ON";
  private silent = false;
  private battery = 8.1;
  private bootTimers: any[] = [];
  private center = 8;
  private phase: "BOOT" | "SCAN" | "ANALYZE" = "BOOT";
  private phaseStart = 0;

  start(cb: (m: Metrics) => void) {
    this.stop();
    this.state = "POWER_ON";
    this.bootTimers.push(setTimeout(() => this.state = "SYSTEM_CHECK", 2000));
    this.bootTimers.push(setTimeout(() => this.state = "CALIBRATION", 3000));
    this.bootTimers.push(setTimeout(() => this.state = "STREAM_INITIALIZED", 4500));
    this.bootTimers.push(setTimeout(() => { this.state = "SCANNING"; this.phase = "SCAN"; this.phaseStart = this.t; }, 4700));
    this.intervalId = setInterval(() => {
      this.tick(cb);
    }, 500);
  }

  stop() {
    if (this.intervalId) clearInterval(this.intervalId);
    this.bootTimers.forEach((t) => clearTimeout(t));
    this.bootTimers = [];
  }

  setMode(m: UIMode) {
    this.mode = m;
  }

  toggleSilent() {
    this.silent = !this.silent;
  }

  shutdown(cb: (m: Metrics) => void) {
    this.state = "SHUTDOWN";
    this.stop();
    const m = this.sample();
    m.state = "SHUTDOWN";
    cb(m);
  }

  private sample(): Metrics {
    const respf = 0.24 + 0.04 * Math.sin(0.05 * this.t);
    const heart = 1.2 + 0.2 * Math.sin(0.07 * this.t);
    const micro = 0.8 * Math.sin(2 * Math.PI * respf * this.t) + 0.12 * Math.sin(2 * Math.PI * heart * this.t) + 0.04 * (Math.random() - 0.5);
    const stability = clamp01(0.9 - 0.1 * Math.abs(Math.sin(0.03 * this.t)));
    const distance = 3 + 0.2 * Math.sin(0.01 * this.t);
    const motion_energy = clamp01(Math.abs(micro) * 0.7 + 0.1 * Math.random());
    const temp = 25 + 3 * Math.max(0, Math.sin(0.002 * this.t));
    this.battery = Math.max(6.3, this.battery - 0.00002);
    const heatmap = genHeatmap(this.center, 32, Math.abs(micro));
    const respiration_score = clamp01(1 - Math.abs(respf - 0.3) / 0.2);
    const heartbeat_score = clamp01(1 - Math.abs(heart * 60 - 78) / 60);
    const thermal_score = clamp01((temp - 20) / 20);
    const stability_score = stability;
    const motion_consistency_score = clamp01(1 - 0.2 * Math.abs(Math.sin(0.1 * this.t)));
    const instant = clamp01(
      0.5 * respiration_score +
      0.2 * heartbeat_score +
      0.1 * thermal_score +
      0.1 * stability_score +
      0.1 * motion_consistency_score
    );
    this.acc = this.lambda * this.acc + (1 - this.lambda) * instant;
    this.disp += (instant - this.disp) * 0.15;
    const state = this.decide(this.disp);
    return {
      timestamp: Date.now() / 1000,
      distance,
      motion_energy,
      micro_signal: micro,
      respiration_freq: respf,
      heartbeat_est: heart * 60,
      temperature: temp,
      stability_index: stability,
      battery_voltage: this.battery,
      heatmap,
      confidence: this.disp,
      acc_confidence: this.acc,
      state,
      scan_mode: this.mode,
      silent_mode: this.silent
    };
  }

  private decide(c: number): UIState {
    if (this.battery < 6.6) return "LOW_BATTERY";
    if (this.state === "POWER_ON" || this.state === "SYSTEM_CHECK" || this.state === "CALIBRATION" || this.state === "STREAM_INITIALIZED") return this.state;
    const scanWindow = this.mode === "RAPID" ? 5 : 20;
    const elapsed = this.t - this.phaseStart;
    if (this.phase === "SCAN") {
      if (elapsed >= scanWindow) {
        this.phase = "ANALYZE";
        this.phaseStart = this.t;
        return "ANALYZING";
      }
      return "SCANNING";
    }
    if (this.phase === "ANALYZE") {
      if (elapsed < 1.0) return "ANALYZING";
      this.phase = "SCAN";
      this.phaseStart = this.t;
      return "SCANNING";
    }
    if (c > 0.8) return "LIFE_DETECTED";
    if (c >= 0.5) return "POSSIBLE_LIFE";
    return "NO_LIFE";
  }

  private tick(cb: (m: Metrics) => void) {
    this.t += 1 / this.Fs;
    const m = this.sample();
    cb(m);
    if (this.state === "STREAM_INITIALIZED") this.state = "SCANNING";
  }
}
