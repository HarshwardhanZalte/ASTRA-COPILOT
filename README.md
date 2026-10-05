# ASTRA-COPILOT

**Detect. Diagnose. Explain. Respond.**

ASTRA-COPILOT is a simulated spacecraft anomaly-detection and mission-operations prototype. It generates SAT-01 telemetry, injects simulated faults, scores telemetry with an Isolation Forest and deterministic subsystem rules, creates in-memory incidents, retrieves simulated mission documents, and provides an operator-facing Copilot.

> **Safety:** This application is a simulation and decision-support demonstration only. It has no connection to a real spacecraft and does not issue spacecraft commands. Recommendations require human review and approval.

## Contents

- [What the application does](#what-the-application-does)
- [How the system works](#how-the-system-works)
- [Navigation and pages](#navigation-and-pages)
- [Requirements](#requirements)
- [Setup and run on Windows](#setup-and-run-on-windows)
- [Run on macOS or Linux](#run-on-macos-or-linux)
- [Try the demonstration](#try-the-demonstration)
- [Configuration](#configuration)
- [HTTP and WebSocket API](#http-and-websocket-api)
- [Project structure](#project-structure)
- [Tests and build checks](#tests-and-build-checks)
- [Current limitations](#current-limitations)
- [Safety and intended use](#safety-and-intended-use)

## What the application does

The application simulates one spacecraft, `SAT-01`, with five logical subsystems:

- Power
- Thermal
- Communication
- Computing
- Payload

The simulator generates these telemetry channels:

| Channel | Unit shown in UI |
| --- | --- |
| Battery voltage | V |
| Battery current | A |
| Battery temperature | °C |
| Solar power | kW |
| Power consumption | W |
| CPU temperature | °C |
| CPU load | % |
| Memory usage | % |
| Communication signal | dBm |
| Packet loss | % |
| Communication latency | ms |
| Payload temperature | °C |
| Reaction wheel speed | RPM |

Four simulated fault types are available: battery degradation, thermal runaway, communication failure, and sensor drift. Noise, missing readings, and outliers can also be enabled from the simulator.

The user interface is a dark, compact engineering console. The mission overview and simulator are separate workflows: the former is for monitoring and investigation; the latter is for controlling the simulation and demonstrating faults.

## How the system works

When the simulator is running, the backend repeats this sequence approximately once per second:

1. Generate a timestamped SAT-01 reading, including small random variations and simple orbital effects.
2. Apply the selected fault, if any. Fault effects progress with elapsed time and severity.
3. Apply configured noise, outliers, and/or missing-value simulation.
4. Calculate per-field status and run anomaly analysis.
5. Save the current reading in process memory and append it to a rolling history.
6. Broadcast the reading to connected browser clients over a WebSocket.
7. When the detector transitions into an anomalous state, create an incident and timeline entries in process memory.

On startup, the backend also seeds an in-memory demo history of 240 telemetry samples and four representative incidents (battery degradation, thermal overload, communication degradation, and sensor drift). This pre-populates the mission charts, incidents list, timelines, event log, and evidence panels before a user starts the live simulator. The UI marks this as **DEMO HISTORY**. Starting the simulator appends live readings to that history. The seed data is recreated on each backend restart and is not persisted.

### Detection and root cause

The detector is an Isolation Forest with a `StandardScaler`. On startup, it trains against 1,000 generated nominal samples; it does not load a persisted model. It uses 13 telemetry channels. Its anomaly score is calibrated against the training-score percentile and combined with deterministic subsystem scores, which compare telemetry values to nominal means and standard deviations. The subsystem with the highest score is mapped to a probable root cause.

The reported score, severity, and confidence are application outputs, not certified mission probabilities. This project currently does not calculate or present a validated precision, recall, F1 score, false-positive rate, or fault-classification confusion matrix.

### Evidence and Copilot

Simulated procedure, incident, and mission-log text files are loaded from `backend/data/`. The in-process retrieval code attempts to embed document text with Sentence Transformers and ranks documents by cosine similarity. If embeddings are unavailable, it falls back to keyword search.

With no `GEMINI_API_KEY`, the Copilot uses deterministic demo response templates and reports `DEMO` mode. If a Gemini API key is configured, it sends retrieved documents and telemetry evidence to the configured Gemini model; a request failure falls back to demo responses. The Copilot is for operator support only, not command execution.

## Navigation and pages

The left sidebar contains these pages:

### Mission

| Tab | Route | What it does |
| --- | --- | --- |
| **Overview** | `/mission` | Mission snapshot for SAT-01: overall health estimate, active incident count, latest anomaly score and root cause, subsystem scores, incident links, and compact power, thermal, computing, and communications charts. Live charts update when the simulator is running. |
| **Telemetry** | `/telemetry` | Detailed table for all 13 telemetry channels, with subsystem, latest value, unit, and status. Includes a grid of live telemetry plots and a WebSocket connection indicator. |
| **Incidents** | `/incidents` | Lists in-memory incidents, their severity and status, probable root cause, detection time, and a link to inspect each incident. An incident detail page is available at `/incidents/:id`. |
| **Copilot** | `/copilot` | Operator chat panel with suggested questions. It uses the newest incident when one exists; otherwise, it can answer without an incident context. Responses display summary, facts, root cause, recommendations, uncertainty, and sources when supplied by the backend. |

### Simulation

| Tab | Route | What it does |
| --- | --- | --- |
| **Anomaly Simulator** | `/simulator` | Engineering test console. Start, pause, or reset the simulation; select a fault and severity; inject or clear it; toggle supported data-quality effects; inspect the model result, subsystem scores, live telemetry table, six charts, and event log. |
| **Scenarios** | `/scenarios` | Currently an informational placeholder directing users to the Anomaly Simulator. It does not yet provide a separate scenario catalogue or controls. |

### System

| Tab | Route | What it does |
| --- | --- | --- |
| **Model Status** | `/model-status` | Displays detector configuration, training-sample and feature counts, Copilot mode, loaded document count, simulator status, and a database-status panel. Some displayed values are configuration or placeholder values; see [Current limitations](#current-limitations). |
| **Settings** | `/settings` | Shows the environment variables used for backend configuration. Settings are changed in the backend `.env` file, not through editable controls in this page. |

### Simulator controls in detail

- **Start / Pause / Reset:** Start telemetry generation, pause it, or reset back to the seeded demo baseline. Reset clears simulated incidents/events and restores the four sample incidents and telemetry history.
- **Scenario:** Select Normal Mission or one of the four faults. Selecting a fault does not inject it; use **Inject Fault** while the simulation is running.
- **Severity:** Select Low, Medium, High, or Critical before injection.
- **Clear Fault:** Remove the active fault and return the scenario label to normal.
- **Noise:** Adds Gaussian variation to numeric readings.
- **Missing Values:** Randomly replaces numeric readings with missing values. The ML preprocessor imputes missing channels to nominal means before inference.
- **Outliers:** Occasionally adds a large perturbation to a numeric reading.
- **Delayed Data:** The UI and API accept this option, but delayed timestamps are not currently applied to generated telemetry.

## Requirements

- Python 3.10 or newer (the project has been developed with Python 3.13).
- Node.js and npm.
- Git is optional for running the project.
- No database is required for the in-memory demo.
- A Neon PostgreSQL connection and Gemini API key are optional configuration values, but database persistence is not currently implemented end-to-end.

The first backend dependency installation can take time. The Sentence Transformers package may download its embedding model the first time the knowledge base initializes. The model can also run in keyword-search fallback mode if embedding initialization fails.

## Setup and run on Windows

Open two PowerShell terminals in the project directory.

### 1. Configure the backend environment

The settings loader reads `.env` relative to the backend working directory. Copy the example file into `backend`:

```powershell
Copy-Item .env.example backend\.env
```

Edit `backend\.env` if needed. For the basic demo, leaving `DATABASE_URL` and `GEMINI_API_KEY` empty is sufficient; the Copilot then uses deterministic demo responses. To enable Gemini, create an API key in [Google AI Studio](https://aistudio.google.com/app/apikey), set `GEMINI_API_KEY` in `backend\.env`, and optionally set `GEMINI_MODEL` (default `gemini-2.5-flash`). Restart the backend after changing environment variables.

### 2. Install and start the backend

In the first terminal:

```powershell
Set-Location backend
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
uvicorn app.main:app --reload
```

If PowerShell blocks activation, use the virtual environment executable directly instead:

```powershell
Set-Location backend
py -3 -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

The backend listens on `http://localhost:8000`. Interactive API documentation is at `http://localhost:8000/docs`. Health check: `http://localhost:8000/api/health`.

On startup, the backend attempts to initialize the database if configured, trains the anomaly detector on synthetic nominal telemetry, and loads the local text documents.

### 3. Install and start the frontend

In a second terminal:

```powershell
Set-Location frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal, usually `http://localhost:5173`. The frontend proxies API and WebSocket traffic to the backend on port 8000.

### 4. Stop the application

Press `Ctrl+C` in each terminal. The simulator runs in the backend process, so stopping that process ends the simulation and clears its in-memory state.

## Run on macOS or Linux

From the project root, configure the backend environment and start each service in its own terminal:

```bash
cp .env.example backend/.env
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
uvicorn app.main:app --reload
```

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

## Try the demonstration

1. Start the backend and frontend, then open the app.
2. Open **Anomaly Simulator** from the sidebar.
3. Press **START**. Confirm the running indicator, WebSocket indicator, telemetry values, and charts update.
4. Select **Battery Degradation** and choose **HIGH** severity.
5. Press **INJECT FAULT**. Watch battery telemetry, model output, and event log.
6. Open **Mission → Overview** to see health, subsystem scores, charts, and any generated active incident.
7. Open **Mission → Incidents**, then choose **Inspect** on an incident to view its evidence, timeline, recommendations, and Copilot panel.
8. Ask the Copilot questions such as “Why did this anomaly occur?”, “What evidence supports the diagnosis?”, or “What should the operator investigate next?”
9. To try a different fault, return to the simulator, clear the current fault, select another fault, and inject it.

All displayed recommendations are proposed investigation steps only. They do not execute spacecraft actions.

## Configuration

The root `.env.example` lists the supported settings. The backend reads a `.env` file from its current working directory (`backend` when started with the commands above).

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Optional Neon PostgreSQL connection string. Keep credentials private. Current telemetry and incident APIs still use process memory; database persistence is incomplete. |
| `GEMINI_API_KEY` | Optional Gemini Developer API key used for Gemini-backed Copilot responses. Empty means demo responses. Obtain one from [Google AI Studio](https://aistudio.google.com/app/apikey). |
| `GEMINI_MODEL` | Gemini model name; default is `gemini-2.5-flash`. |
| `EMBEDDING_MODEL` | Sentence Transformers model name; default is `all-MiniLM-L6-v2`. |
| `FRONTEND_URL` | Frontend origin allowed by backend CORS; default is `http://localhost:5173`. |
| `BACKEND_URL` | Backend URL setting; default is `http://localhost:8000`. |

Never commit `backend/.env` or share API keys or database credentials. The repository ignores `.env` files.

## HTTP and WebSocket API

The FastAPI application exposes these routes:

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Backend health and simulation-running flag. |
| `GET` | `/api/system/status` | Detector, RAG, and simulator status summary. |
| `GET` | `/api/telemetry/latest` | Latest in-memory reading. |
| `GET` | `/api/telemetry/history?limit=100` | Recent in-memory readings. |
| `POST` | `/api/simulator/start` | Start the telemetry loop. |
| `POST` | `/api/simulator/pause` | Pause the telemetry loop. |
| `POST` | `/api/simulator/reset` | Reset telemetry history and event log. |
| `GET` | `/api/simulator/status` | Simulator controls/status and connection counts. |
| `GET` | `/api/simulator/events` | Recent simulator events. |
| `POST` | `/api/simulator/fault` | Inject a fault with JSON `{"fault_type":"battery_degradation","severity":"HIGH"}`. |
| `POST` | `/api/simulator/fault/battery` | Inject battery degradation. |
| `POST` | `/api/simulator/fault/thermal` | Inject thermal runaway. |
| `POST` | `/api/simulator/fault/communication` | Inject communication failure. |
| `POST` | `/api/simulator/fault/sensor-drift` | Inject sensor drift. |
| `POST` | `/api/simulator/clear-fault` | Clear the active fault. |
| `POST` | `/api/simulator/conditions` | Configure noise, missing values, delay flag, and outliers. |
| `GET` | `/api/anomalies` | Find anomalous readings in recent telemetry history. |
| `GET` | `/api/anomalies/latest` | Anomaly status for the latest reading. |
| `GET` | `/api/incidents` | List current in-memory incidents. |
| `GET` | `/api/incidents/{incident_id}` | Retrieve by incident UUID or number, e.g. `INC-0001`. |
| `GET` | `/api/incidents/{incident_id}/timeline` | Timeline for a UUID incident ID. |
| `GET` | `/api/incidents/{incident_id}/evidence` | Telemetry evidence and retrieved documents. |
| `POST` | `/api/copilot/chat` | Ask a question, optionally with `incident_id` and conversation history. |
| `GET` | `/api/copilot/mode` | Copilot and embedding configuration summary. |
| `WS` | `/ws/telemetry` | Main telemetry stream consumed by the frontend. |
| `WS` | `/api/telemetry/ws` | Compatibility alias for the telemetry stream. |

FastAPI’s interactive documentation at `/docs` is the most convenient way to inspect and call these endpoints.

## Project structure

```text
astra-copilot/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI routers
│   │   ├── ml/           # Preprocessing, Isolation Forest, scoring, root cause
│   │   ├── models/       # SQLAlchemy schema definitions
│   │   ├── rag/          # Embeddings, retrieval, Copilot generation
│   │   ├── services/     # Simulator state, incidents, evidence services
│   │   ├── simulator/    # Telemetry generation, faults, data conditions
│   │   ├── config.py
│   │   ├── database.py
│   │   └── main.py
│   ├── data/
│   │   ├── incidents/    # Simulated past-incident documents
│   │   ├── logs/         # Simulated mission logs
│   │   └── procedures/   # Simulated operating procedures
│   ├── tests/            # Backend unit tests
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/   # Charts, panels, badges, Copilot panel
│   │   ├── hooks/        # Telemetry WebSocket and simulator polling
│   │   ├── layouts/      # Sidebar and application shell
│   │   ├── pages/        # Mission, simulator, incidents, and system pages
│   │   └── services/     # Frontend API wrapper
│   └── package.json
├── .env.example
└── .gitignore
```

## Tests and build checks

Run the backend regression tests from `backend` with its environment activated:

```powershell
python -m unittest discover -s tests
```

Compile-check backend source:

```powershell
python -m compileall -q app tests
```

Build the frontend production bundle:

```powershell
Set-Location frontend
npm run build
```

The current backend test suite is small and does not yet cover all fault scenarios, APIs, retrieval behavior, or ML performance. A successful frontend build verifies bundle compilation, not end-to-end runtime behavior.

## Current limitations

This repository is a prototype; not every item in the original build specification is complete:

- **Persistence:** Simulator telemetry, incidents, and incident events are stored in process memory. Restarting the backend loses them. SQLAlchemy models and a database connection/table-initialization scaffold exist, but the API services do not persist or query these records from Neon. The system-status response currently reports database connectivity as `false`.
- **Vector storage:** Retrieval currently keeps documents and embeddings in process memory. The `documents` schema includes a pgvector-compatible column, but retrieval is not wired to PostgreSQL/pgvector, and document chunking is not implemented.
- **Data delay:** The delayed-data control is present in the API/UI configuration, but it does not currently delay delivery or alter timestamps.
- **Demo Copilot grounding:** The DEMO response templates include fixed sample claims and recommendations. Retrieved documents and telemetry evidence are attached in parts of the response flow, but demo text is not a fully generated, per-incident factual analysis. Treat it as a scripted demonstration.
- **Model metrics:** The model page displays training configuration, not measured validation metrics. There is no implemented train/test evaluation pipeline yet.
- **Scenarios page:** This is currently a placeholder; use the Anomaly Simulator page for fault selection and injection.
- **Settings page:** This is read-only guidance; configuration is changed in `backend/.env`.
- **Incident lifecycle:** Incident generation, numbering, history, and reset behavior are in-memory prototype behavior, not a production incident-management workflow.
- **Operator interface:** Human approval is communicated in the UI and Copilot prompt; there is no approval workflow or simulated command execution.

## Safety and intended use

ASTRA-COPILOT is for local development, testing, and demonstration. Telemetry and documents are simulated. Do not use its outputs as operational guidance for a real spacecraft or other safety-critical system. Recommendations are not commands, are not executed by this application, and must always be independently assessed by a qualified human operator.
