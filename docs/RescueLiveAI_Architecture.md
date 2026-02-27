# RescueLiveAI — Full-Stack Streaming Architecture

```mermaid
flowchart TB
  subgraph L1[Layer 1 • Virtual Radar Hardware]
    GEN[Simulated Radar Stream 500ms] -->|JSON| PIPE
  end
  subgraph L2[Layer 2 • Pathway Streaming Pipeline]
    PIPE[Ingestion • Sliding Window • Rolling Avgs • Stateful Confidence • Events]
  end
  subgraph L3[Layer 3 • Document Store]
    DOCS[Pathway Hybrid Index (BM25+Vector)] --> RAG
  end
  subgraph L4[Layer 4 • LLM xPack]
    RAG[LLM xPack RAG • Citations] --> AI[AI Recommendations]
  end
  subgraph L5[Layer 5 • API Layer]
    API[FastAPI • WS/SSE • REST]
  end
  subgraph L6[Layer 6 • Wearable OS UI]
    UI[Next.js • WebSocket Live • OS-like]
  end
  GEN --> PIPE --> API --> UI
  DOCS --> RAG --> API
```

```mermaid
stateDiagram-v2
  [*] --> POWER_OFF
  POWER_OFF --> BOOTING
  BOOTING --> SELF_TEST
  SELF_TEST --> INITIALIZING_STREAM
  INITIALIZING_STREAM --> CALIBRATION
  CALIBRATION --> SCANNING
  SCANNING --> ANALYZING
  ANALYZING --> LIFE_DETECTED: conf > 80%
  ANALYZING --> POSSIBLE_LIFE: 50–80%
  ANALYZING --> NO_LIFE: < 50%
  SCANNING --> LOW_BATTERY: batt<th
  LOW_BATTERY --> SCANNING: recover
  [*] <-- SHUTDOWN
```

