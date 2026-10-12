import { render, screen } from '@testing-library/react';
import App from './App';

const fleet = {
  total_engines: 2, healthy_count: 1, monitor_count: 0, critical_count: 1, average_health_pct: 60, mean_rul: 60,
  action_counts: { REMOVE: 1, INSPECT: 0, CONTINUE: 1 }, drift_count: 0,
  engines: [
    { engine_id: 1, unit_code: 'FD004-001', current_cycle: 200, health_pct: 30, status: 'CRITICAL', rul_pred: 12, rul_lower: 4, rul_upper: 30,
      fault_mode: 'HPC_DEGRADATION', fault_label: 'HPC', operating_regime: 2, regime_name: 'r2', action_code: 'REMOVE', drift_detected: false, anomaly_alarm: true },
    { engine_id: 2, unit_code: 'FD004-002', current_cycle: 50, health_pct: 95, status: 'HEALTHY', rul_pred: 118, rul_lower: 95, rul_upper: 127,
      fault_mode: 'NO_CLEAR_SIGNATURE', fault_label: 'none', operating_regime: 0, regime_name: 'r0', action_code: 'CONTINUE', drift_detected: false, anomaly_alarm: false },
  ],
};

beforeEach(() => {
  window.location.hash = '#/fleet';
  global.fetch = jest.fn((url) =>
    Promise.resolve({ ok: String(url).includes('/fleet/overview'), status: 200, json: () => Promise.resolve(fleet) }),
  );
});

test('renders the fleet with recommended actions', async () => {
  render(<App />);
  expect(await screen.findByRole('heading', { level: 1, name: 'Fleet status' })).toBeInTheDocument();
  expect(screen.getAllByText('FD004-001').length).toBeGreaterThan(0);
  expect(screen.getAllByText('Plan removal').length).toBeGreaterThan(0);
});

test('shows a recoverable error when the API is unreachable', async () => {
  global.fetch = jest.fn(() => Promise.reject(new TypeError('network')));
  render(<App />);
  expect(await screen.findByRole('alert')).toHaveTextContent(/Cannot reach the TwinAero API/);
  expect(screen.getByRole('button', { name: /Try again/ })).toBeInTheDocument();
});
