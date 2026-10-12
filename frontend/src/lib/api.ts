import {
  AdvisorAssessment, BenchmarkSummary, CalibrationResult, CounterfactualResponse, EngineDetail,
  Experiments, FleetOverview, OperatingSettings, TestPrediction,
} from './types';

const API_BASE = process.env.REACT_APP_API_URL || '/api';

export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, init);
  } catch {
    throw new ApiError('Cannot reach the TwinAero API. Check that the backend is running on port 8000.');
  }
  if (!res.ok) {
    let detail = `Request failed (HTTP ${res.status}).`;
    try {
      const body = await res.json();
      if (typeof body?.detail === 'string') detail = body.detail;
    } catch {
      /* body was not JSON */
    }
    throw new ApiError(detail, res.status);
  }
  return res.json() as Promise<T>;
}

// Engine detail is requested by several pages; cache per engine and drop on recalibration.
const engineCache = new Map<number, Promise<EngineDetail>>();

export const api = {
  fleet: () => request<FleetOverview>('/fleet/overview'),
  benchmark: () => request<BenchmarkSummary>('/fleet/metrics'),
  experiments: () => request<Experiments>('/fleet/experiments'),
  testPredictions: () => request<TestPrediction[]>('/fleet/test-predictions'),

  engine(id: number): Promise<EngineDetail> {
    if (!engineCache.has(id)) {
      const p = request<EngineDetail>(`/engine/${id}`);
      p.catch(() => engineCache.delete(id));
      engineCache.set(id, p);
    }
    return engineCache.get(id)!;
  },

  advisor: (id: number) => request<AdvisorAssessment>(`/advisor/${id}`),

  counterfactual: (id: number, params: OperatingSettings) =>
    request<CounterfactualResponse>(`/simulation/${id}/counterfactual`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    }),

  async recalibrate(id: number): Promise<CalibrationResult> {
    const result = await request<CalibrationResult>('/drift/recalibrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ engine_id: id, forced: true }),
    });
    engineCache.delete(id);
    return result;
  },
};
