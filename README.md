# ✈ TwinAero: Uncertainty-Aware Self-Calibrating Aerospace Digital Twin

[![NASA C-MAPSS FD004](https://img.shields.io/badge/Dataset-NASA%20C--MAPSS%20FD004-blue.svg)](https://zenodo.org/records/15346912)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com)
[![React 19](https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-61dafb.svg)](https://react.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

An uncertainty-aware, self-calibrating Digital Twin framework for intelligent aerospace engine health management and predictive maintenance, trained and evaluated primarily on **NASA C-MAPSS FD004** (six operating conditions, dual degradation modes: High-Pressure Compressor and Fan degradation).

---

## Abstract

Modern aerospace engines operate under complex and continuously changing conditions, where degradation and component faults can lead to performance loss, unexpected failures, and increased maintenance requirements. This project proposes an uncertainty-aware and self-calibrating Digital Twin framework for intelligent aerospace engine health management and predictive maintenance. Multivariate sensor and operating-condition data from the NASA Commercial Modular Aero-Propulsion System Simulation (C-MAPSS) dataset, with FD004 as the primary benchmark, is analyzed using machine-learning and deep-learning models to estimate engine health, detect anomalies, diagnose faults, and predict Remaining Useful Life (RUL). An uncertainty estimation layer provides prediction intervals to quantify the reliability of RUL predictions rather than relying on a single deterministic estimate. The Digital Twin continuously compares predicted engine behavior with observed sensor patterns to identify model drift and trigger self-calibration when persistent deviations occur. A counterfactual simulation module evaluates alternative operating conditions and their potential effects on engine degradation and predicted RUL. An agentic reasoning layer orchestrates observation, fault diagnosis, scenario analysis, and maintenance decision support. The framework is evaluated through ablation experiments using RUL prediction error, anomaly and fault-detection metrics, prediction-interval coverage, calibration measures, and decision-support consistency. An interactive dashboard visualizes engine health, sensor behavior, degradation trends, RUL, uncertainty, detected faults, and counterfactual scenarios. The proposed framework provides an integrated approach for combining predictive analytics, adaptive Digital Twin modeling, uncertainty estimation, and intelligent decision support for aerospace engine predictive and prescriptive maintenance.

---

## Dataset Provenance & Benchmark Specification

This study uses the **NASA C-MAPSS turbofan engine degradation simulation dataset** provided through the NASA Prognostics Center of Excellence (PCoE). The primary benchmark is the **FD004 subset**, which contains multivariate engine sensor trajectories under six operating conditions and two degradation modes. Training sequences extend to failure, whereas test sequences terminate prior to failure and are accompanied by remaining useful life labels.

### Dataset Mirrors & Sources

| Source | Link | Use / Provenance |
| :--- | :--- | :--- |
| **Zenodo Mirror** (Primary) | [PCoE Turbofan Engine Degradation Simulation – Zenodo](https://zenodo.org/records/15346912) | High-speed direct archive download `CMAPSSData.zip`. |
| **NASA Official Catalogue** | [NASA Open Data – C-MAPSS Aircraft Engine Simulator Data](https://data.nasa.gov/dataset/c-mapss-aircraft-engine-simulator-data) | Official record and research provenance citation. |
| **NASA Legacy Archive** | [CMAPSSData.zip](https://data.nasa.gov/docs/legacy/CMAPSSData.zip) | Traditional NASA archive for FD001–FD004. |
| **Kaggle Mirror** | [NASA Turbofan Jet Engine Data Set – Kaggle](https://www.kaggle.com/datasets/behrad3d/nasa-cmaps) | Notebook workflows and community benchmarks. |
| **Hugging Face** | [NASA C-MAPSS RUL – Hugging Face](https://huggingface.co/datasets/THULab/nasa_cmapss_rul) | Preprocessed C-MAPSS metadata. |

### Files in FD004:
- `train_FD004.txt`: 248 run-to-failure engine trajectories (61,249 snapshots)
- `test_FD004.txt`: 249 hold-out engine trajectories (41,214 snapshots)
- `RUL_FD004.txt`: Ground-truth remaining operational cycles for holdout test units
- **Operating Conditions**: 6 Flight Regimes across Altitude ($0-42\text{ kft}$), Mach number ($0-0.84$), and Throttle Resolver Angle ($20-100^\circ\text{ TRA}$)
- **Degradation Modes**: Dual-mode (High-Pressure Compressor degradation + Fan subsystem degradation)

### Sensor Channel Telemetry Mapping

| Channel | Variable | Physical Description | Nominal Unit |
| :--- | :--- | :--- | :--- |
| `sensor_1` | $T_2$ | Total temperature at fan inlet | $^\circ\text{R}$ |
| `sensor_2` | $T_{24}$ | Total temperature at LPC outlet | $^\circ\text{R}$ |
| `sensor_3` | $T_{30}$ | Total temperature at HPC outlet | $^\circ\text{R}$ |
| `sensor_4` | $T_{50}$ | Total temperature at LPT outlet | $^\circ\text{R}$ |
| `sensor_5` | $P_2$ | Pressure at fan inlet | $\text{psia}$ |
| `sensor_6` | $P_{15}$ | Total pressure in bypass-duct | $\text{psia}$ |
| `sensor_7` | $P_{30}$ | Total pressure at HPC outlet | $\text{psia}$ |
| `sensor_8` | $N_f$ | Physical fan speed | $\text{rpm}$ |
| `sensor_9` | $N_c$ | Physical core speed | $\text{rpm}$ |
| `sensor_10` | $\text{epr}$ | Engine pressure ratio ($P_{50}/P_2$) | $-$ |
| `sensor_11` | $P_{s30}$ | Static pressure at HPC outlet | $\text{psia}$ |
| `sensor_12` | $\phi$ | Ratio of fuel flow to $P_{s30}$ | $\text{pps/psi}$ |
| `sensor_13` | $NR_f$ | Corrected fan speed | $\text{rpm}$ |
| `sensor_14` | $NR_c$ | Corrected core speed | $\text{rpm}$ |
| `sensor_15` | $\text{BPR}$ | Bypass Ratio | $-$ |
| `sensor_16` | $\text{farB}$ | Burner fuel-air ratio | $-$ |
| `sensor_17` | $ht\text{Bleed}$ | Bleed Enthalpy | $\text{BTU/lbm}$ |
| `sensor_18` | $N_{f,\text{dmd}}$ | Demanded fan speed | $\text{rpm}$ |
| `sensor_19` | $PCNfR_{\text{dmd}}$| Demanded corrected fan speed | $\text{rpm}$ |
| `sensor_20` | $W_{31}$ | HPT coolant bleed | $\text{lbm/s}$ |
| `sensor_21` | $W_{32}$ | LPT coolant bleed | $\text{lbm/s}$ |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  ✈ TwinAero UI (React + TypeScript + Tailwind CSS)           │
│  Avionics Cockpit • Sensor Timelines • Digital Twin Cutaway │
└──────────────────────────────┬──────────────────────────────┘
                               │ REST API / WebSocket
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  FastAPI Backend Orchestration                              │
│  Fleet Telemetry • Prognostic Inference • Agent Reasoner    │
└──────────────┬───────────────┬──────────────────────────────┘
               │               │
       ┌───────▼───────┐ ┌─────▼────────┐ ┌───────────────────┐
       │ ML Prognostic │ │ Digital Twin │ │ AI Advisor Agent  │
       │ Ensemble      │ │ Simulation   │ │ Reasoning Layer   │
       │ RUL + Conformal│ │ What-If      │ │ Prescriptive      │
       │ Intervals     │ │ Scenarios    │ │ MSG-3 Guidance    │
       └───────────────┘ └──────────────┘ └───────────────────┘
```

---

## Mathematical Formulation & Framework Principles

### 1. Flight Regime Normalization
In FD004, sensor variations are dominated by changes in the flight envelope (altitude, Mach number, and throttle angle). To isolate component degradation from flight conditions, the $k=6$ canonical operating clusters are identified using Euclidean distance:
$$\tilde{s}_{i, r} = \frac{s_i - \mu_{i, r}}{\sigma_{i, r}}$$
where $\mu_{i, r}$ and $\sigma_{i, r}$ are the mean and standard deviation of sensor $i$ in operating regime $r \in \{0, \dots, 5\}$.

### 2. Piecewise Linear RUL Target & Asymmetric NASA Scoring
Because component degradation is imperceptible in early engine life, the target RUL is clipped at $RUL_{\max} = 125$ cycles. Predictions are evaluated using the asymmetric NASA C-MAPSS scoring metric, which penalizes dangerous late predictions exponentially more severely than conservative early predictions:
$$S = \sum_{i=1}^N s_i, \quad s_i = \begin{cases} \exp(-d_i / 13) - 1, & d_i < 0 \text{ (Early)} \\ \exp(d_i / 10) - 1, & d_i \ge 0 \text{ (Late)} \end{cases}$$
where $d_i = \hat{RUL}_i - RUL_i$.

### 3. Split Conformal Prediction Intervals
To provide mathematically guaranteed finite-sample coverage at confidence level $1 - \alpha = 0.90$, nonconformity scores $R_i = |y_i - \hat{\mu}(x_i)|$ are calibrated on holdout validation engines:
$$q_{1-\alpha} = \text{Quantile}_{\lceil (n+1)(1-\alpha) \rceil / n}(R_1, \dots, R_n)$$
$$C(x) = \left[ \max(0, \hat{y} - q_{1-\alpha}), \; \hat{y} + q_{1-\alpha} \right]$$
Guaranteed: $\mathbb{P}(Y \in C(X)) \ge 1 - \alpha$.

### 4. Kolmogorov-Smirnov Drift Detection & Self-Calibration
The Digital Twin continuously computes two-sample Kolmogorov-Smirnov (KS) statistics and Wasserstein distances between nominal baseline distributions and sliding telemetry windows:
$$D_{KS} = \sup_x |F_{\text{baseline}}(x) - F_{\text{recent}}(x)|$$
When $D_{KS} > \tau_{\text{drift}} = 0.22$, the system triggers adaptive recalibration of operating regime normalization weights.

### 5. Arrhenius-Based Counterfactual Simulation
The what-if operational simulator models degradation velocity scaling using turbofan thermal fatigue relationships:
$$\text{Stress Multiplier} = \left(\frac{\text{TRA}}{100}\right)^{1.85} \cdot \left(1 + \Delta_{\text{alt}} \cdot 0.008\right) \cdot \left(1 + \Delta_{\text{Mach}} \cdot 0.35\right)$$
Derating takeoff/cruise throttle by $10\%$ yields a $+15\text{ to }+25\%$ extension in remaining flight cycles.

---

## Directory Structure

```
TwinAero/
├── frontend/                  # React + TypeScript + Tailwind CSS UI
│   ├── src/
│   │   ├── components/        # Cockpit, Digital Twin, Charts, AI Advisor
│   │   ├── types.ts           # Avionics domain types
│   │   ├── api.ts             # Backend API client
│   │   ├── App.tsx            # Main application workspace
│   │   └── index.css          # Avionics glassmorphism design system
│   └── package.json
│
├── backend/                   # FastAPI high-performance backend
│   ├── api/                   # REST routers (fleet, engine, simulation, drift, advisor)
│   ├── models/                # Pydantic telemetry and prognostic schemas
│   ├── services/              # Digital Twin singleton service
│   ├── main.py                # App entrypoint and static mount
│   └── Dockerfile
│
├── ml/                        # Machine Learning and Prognostic Engines
│   ├── preprocessing/         # C-MAPSS FD004 parser & 6-regime normalizer
│   ├── rul/                   # RUL ensemble predictor & NASA scoring function
│   ├── uncertainty/           # Split Conformal Prediction engine
│   ├── anomaly/               # HPC vs Fan dual-mode fault classifier
│   ├── drift/                 # Kolmogorov-Smirnov statistical drift detector
│   ├── digital_twin/          # Physics-guided counterfactual simulator
│   ├── agent/                 # Agentic reasoning and MSG-3 maintenance advisor
│   ├── models/                # Serialized model artifacts (.joblib)
│   └── train_and_evaluate.py  # End-to-end benchmark training script
│
├── data/
│   ├── raw/                   # NASA C-MAPSS dataset files (train/test/RUL FD004)
│   └── processed/
│
├── notebooks/                 # Jupyter EDA and evaluation notebooks
├── docker-compose.yml         # Full-stack container orchestration
├── requirements.txt           # Python dependencies
└── README.md
```

---

## Quick Start & Local Execution

### Prerequisites
- Python 3.9+
- Node.js 18+ and npm

### 1. Clone & Set Up Python Virtual Environment
```bash
git clone https://github.com/Charan-718/TwinAreo.git
cd TwinAero

# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install backend & ML dependencies
pip install -r requirements.txt
```

### 2. Run C-MAPSS FD004 Training & Benchmark
```bash
python3 ml/train_and_evaluate.py
```
*Outputs test evaluation metrics (RMSE: 18.80 cycles, MAE: 13.59 cycles, NASA Score: 2665.8) and serializes models to `ml/models/`.*

### 3. Launch FastAPI Backend
```bash
python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation available at: `http://localhost:8000/docs`

### 4. Launch React Frontend
```bash
cd frontend
npm install --legacy-peer-deps
npm start
```
Interactive cockpit dashboard available at: `http://localhost:3000`

---

## Running with Docker Compose

To launch both backend and frontend in isolated production containers:
```bash
docker-compose up --build
```
Access the TwinAero cockpit at `http://localhost:3000` and the API at `http://localhost:8000`.

---

## Citation & Acknowledgments

If you utilize this framework or data configuration, please cite:

```bibtex
@misc{twinaero2026,
  title={TwinAero: An Uncertainty-Aware and Self-Calibrating Digital Twin Framework for Aerospace Engine Health Management},
  author={TwinAero Project Team},
  year={2026},
  publisher={GitHub},
  howpublished={\url{https://github.com/Charan-718/TwinAreo}}
}
```

*Data provenance acknowledgement: This study uses the NASA C-MAPSS turbofan engine degradation simulation dataset provided through the NASA Prognostics Center of Excellence (PCoE).*
