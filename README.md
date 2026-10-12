# TwinAero: uncertainty-aware, self-calibrating digital twin for turbofan engine health

An engine-health digital twin trained and evaluated on **NASA C-MAPSS FD004** (six operating conditions, two
degradation modes: high-pressure compressor and fan). It estimates remaining useful life (RUL) with calibrated
intervals, detects anomalies, attributes fault modes, monitors twin discrepancy and self-calibrates, runs what-if
scenarios, and turns all of that into a maintenance recommendation through a traceable agent pipeline. Every number
in the dashboard is computed from data and fitted models.

> Research prototype on simulated data. Not an airworthiness tool.

## Abstract

Aircraft engines operate under complex and continuously changing conditions, making reliable health monitoring and
predictive maintenance essential. This project builds an uncertainty-aware and self-calibrating digital twin for
aerospace engine health management and counterfactual maintenance decision support, using multivariate sensor and
operating-condition data from NASA C-MAPSS with FD004 as the primary benchmark. The twin integrates health-state
estimation, anomaly detection, fault diagnosis, degradation assessment and RUL prediction; an uncertainty layer
provides prediction intervals; discrepancies between the twin's expectations and observed sensor patterns are
monitored to detect drift and trigger recalibration; a counterfactual module supports what-if analysis; and an
agentic reasoning layer orchestrates observation, diagnosis, scenario analysis and maintenance decision support.
The framework is evaluated through ablation experiments using RUL error, anomaly and fault-detection metrics,
prediction-interval coverage, calibration, and decision-support consistency.

## Dataset

This study uses the NASA C-MAPSS turbofan engine degradation simulation dataset provided through the NASA
Prognostics Center of Excellence. FD004 contains multivariate engine sensor trajectories under six operating
conditions and two degradation modes. Training sequences extend to failure; test sequences stop before failure and
come with remaining-life labels.

| Source | Link | Use |
| :--- | :--- | :--- |
| NASA Open Data | [C-MAPSS Aircraft Engine Simulator Data](https://data.nasa.gov/dataset/c-mapss-aircraft-engine-simulator-data) | Official record; cite for provenance |
| Zenodo mirror | [PCoE Turbofan Engine Degradation Simulation](https://zenodo.org/records/15346912) | Recommended download |
| NASA legacy archive | [CMAPSSData.zip](https://data.nasa.gov/docs/legacy/CMAPSSData.zip) | Original archive (may be unavailable) |
| Kaggle mirror | [NASA Turbofan Jet Engine Data Set](https://www.kaggle.com/datasets/behrad3d/nasa-cmaps) | Notebook workflows |

Place `train_FD00x.txt`, `test_FD00x.txt` and `RUL_FD00x.txt` in `data/raw/`. FD004 is the benchmark; FD001, FD002
and FD003 are used only for the sanity baseline, the transfer experiment and fault-mode checks. Subsets are never
merged into one training table.

**Engine counts.** The FD004 files contain **249 training and 248 test engines**. NASA's bundled `readme.txt` lists
these the other way round; the numbers here are counted from the files.

### Sensor channels

| Channel | Mnemonic (Saxena et al., 2008) | Description | Unit |
| :

The dataset ships unlabeled columns, and its values come from a simulation. The dashboard therefore labels channels
as "Sensor 1" to "Sensor 21", with the mnemonic shown as secondary literature context. Sensors 1, 5, 16, 18 and 19
are constant in FD004.

## Method

| Component | Implementation | Module |
| :--- | :--- | :--- |
| Regime normalization | Six FD004 operating conditions; each sensor standardized per condition | `ml/preprocessing/loader.py` |
| RUL | Gradient-boosted trees on normalized sensors, 10-cycle rolling stats and settings; target capped at 125 | `ml/rul/predictor.py` |
| Uncertainty | Conformalized quantile regression with 5-fold cross-conformal calibration; label-shift reweighting (BBSE + weighted conformal) to the deployed fleet | `ml/uncertainty/conformal.py` |
| Anomaly detection | Mahalanobis distance to the early-life sensor distribution; threshold at the 99th percentile of held-out healthy cycles | `ml/anomaly/health_monitor.py` |
| Fault modes | k=2 clustering of early-to-late sensor shifts on FD004; HPC cluster identified with FD002 (HPC only) | `ml/anomaly/fault_classifier.py` |
| Twin discrepancy | KS / Wasserstein tests of recent cycles against training cycles at the same predicted life stage | `ml/drift/detector.py` |
| What-if | Assumption-based stress surrogate relative to the current operating point, with the interval propagated | `ml/digital_twin/counterfactual.py` |
| Agents | Observer, Diagnosis, Prognosis, Calibration, Scenario and Planner; decisions on the conservative bound | `ml/agent/advisor.py` |

Protocols are engine-level: an engine never contributes to both fitting and evaluating a component. The test set is
evaluated at each engine's last observed cycle, with RUL capped at 125.

## Results (FD004 test set, 248 engines)

Served model: RMSE **19.06**, MAE 13.83, NASA score 3188;
90% interval coverage **90.32%** at a mean width of 56.36 cycles.

### Ablation

| | Configuration | RMSE | NASA score | 90% coverage | Width | Missed removals |
| :--- | :--- | ---: | ---: | ---: | ---: | ---: |
| A0 | Conventional RUL | 18.85 | 2951 | – | – | – |
| A1 | Digital twin features | 19.06 | 3188 | – | – | 11 |
| A2 | + Uncertainty | 19.06 | 3188 | 86.69 | 53.15 | 0 |
| A3 | + Self-calibration | 19.06 | 3188 | 90.32 | 56.36 | – |
| A4 | + Counterfactual | 19.06 | 3188 | 90.32 | 56.36 | – |
| A5 | Full agentic framework | 19.06 | 3188 | 90.32 | 56.36 | 0 |

A1 to A5 share one point model; each row adds a layer. The raw-sensor baseline (A0) is slightly *more* accurate than
the regime-normalized features for this tree model. The twin features earn their place in the anomaly, fault-mode
and drift components, not in point accuracy.

### Decision-support consistency

The policy plans removal when the decision RUL is 20 cycles or less, and inspection at 50 or less. The oracle applies
the same policy to the true RUL.

| Decision basis | Agreement | Missed removals | Unnecessary removals |
| :--- | ---: | ---: | ---: |
| point_estimate | 87.1% | 11/40 | 0 |
| split_lower_90 | 75.0% | 0/40 | 7 |
| cqr_adapted_lower_90 | 76.6% | 0/40 | 3 |
| agent | 76.2% | 0/40 | 3 |

### Domain shift: FD002 (HPC only) to FD004 (HPC and fan)

| Self-calibration | RMSE | 90% coverage | Width | Missed removals |
| :--- | ---: | ---: | ---: | ---: |
| No self-calibration | 22.76 | 68.55% | 41.74 | 12 |
| Label-free fleet adaptation | 22.76 | 68.55% | 41.73 | 12 |
| Recalibrate with 25 new failures | 22.76 | 91.53% | 76.42 | 1 |
| Retrain + recalibrate | 23.87 | 91.53% | 57.82 | 1 |

The discrepancy detector flags 5.8% of in-domain engines against
46.8% after the shift. Label-free reweighting cannot repair a new fault
mode; refitting the corrections on new failures can.

### Diagnostics

- Anomaly detection on 50 held-out run-to-failure engines: AUROC 0.989, precision 0.988, recall 0.655; persistent alarm on 76.0% of engines, a median 39.5 cycles before failure.
- Fault modes: silhouette 0.671; FD001 (HPC only, an independent check) is assigned 100.0% HPC; FD003 (HPC and fan) splits 56.0% / 44.0%.
- What-if surrogate: identity and monotonicity checks pass on all 120 scenarios. C-MAPSS cannot validate its effect sizes.

## Running it

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

python3 ml/train_and_evaluate.py            # trains, calibrates, writes ml/models/ (~2 min)
python3 ml/experiments/run_experiments.py   # ablation, transfer, decision studies (~4 min)

cd frontend && npm install --legacy-peer-deps && npm run build && cd ..
python3 -m uvicorn backend.main:app --port 8000
```

Open `http://localhost:8000`. The API serves the built frontend, and the API docs are at `/docs`. For frontend
development, run `npm start` in `frontend/` (port 3000) with the API on port 8000.

## Frontend

React 19 + TypeScript + Tailwind, organized as `src/styles/tokens.css` (semantic design tokens, light and dark
themes), `src/components/ui` (buttons, panels, tags, stats, feedback states), `src/components/charts` (SVG line,
interval scatter and histogram charts with tooltips), `src/components/layout`, and `src/pages`. Routing is
hash-based, so every view is linkable. Fonts are self-hosted IBM Plex, so the app makes no third-party requests.

## Citation

A. Saxena, K. Goebel, D. Simon and N. Eklund, "Damage Propagation Modeling for Aircraft Engine Run-to-Failure
Simulation," PHM08, Denver, CO, 2008.
