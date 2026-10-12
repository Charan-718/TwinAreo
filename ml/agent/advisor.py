"""
TwinAero - Agentic maintenance decision support

A deterministic orchestration of specialized agents. Each agent reads the shared
engine state, adds a finding to the trace, and hands over to the next:

    Observer -> Diagnosis -> Prognosis -> Calibration -> Scenario -> Planner

Determinism is deliberate: the same inputs always produce the same recommendation,
which makes decision consistency measurable (see ml/experiments). The planner's
policy is exposed as `decide()` so the experiments evaluate exactly what the UI shows.

This is research decision support on simulated data. It is not an airworthiness
determination and does not reference real maintenance programmes.
"""

from typing import Any, Callable, Dict, List, Optional

REMOVE_AT = 20    # plan removal / shop visit when the decision RUL is at or below this
INSPECT_AT = 50   # schedule inspection when the decision RUL is at or below this

ACTIONS = {
    'REMOVE': 'Plan removal for shop visit',
    'INSPECT': 'Schedule on-wing inspection',
    'CONTINUE': 'Continue routine monitoring',
}


def _cycles(n: float) -> str:
    n = int(n)
    return f"{n} cycle" if n == 1 else f"{n} cycles"


def _sentence_case(label: str) -> str:
    """Lowercase only a leading capital, keeping acronyms such as HPC intact."""
    return label[0].lower() + label[1:] if label[:2].istitle() else label


def decide(decision_rul: float, remove_at: float = REMOVE_AT, inspect_at: float = INSPECT_AT) -> str:
    if decision_rul <= remove_at:
        return 'REMOVE'
    if decision_rul <= inspect_at:
        return 'INSPECT'
    return 'CONTINUE'


class MaintenanceAdvisor:
    def generate_assessment(
        self,
        engine: Dict[str, Any],
        scenario_runner: Optional[Callable[[float, float, float], Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        trace: List[Dict[str, Any]] = []
        e = engine
        cycle = e['total_cycles_observed']

        # 1. Observer
        anomaly = e.get('anomaly', {})
        obs = [f"{cycle} cycles observed; latest operating condition is regime {e['operating_regime']} ({e['regime_name']})."]
        if anomaly.get('score') is not None:
            state = 'above' if anomaly['alarm'] else 'below'
            obs.append(f"Healthy-state distance {anomaly['score']:.1f} is {state} the alarm threshold {anomaly['threshold']:.1f}.")
        trace.append({'agent': 'Observer', 'finding': ' '.join(obs)})

        # 2. Diagnosis
        if e['fault_mode'] == 'NO_CLEAR_SIGNATURE':
            diag = 'Sensor shifts are still small; no fault mode can be attributed yet.'
        else:
            conf = e.get('fault_confidence')
            conf_txt = f' (separation {conf:.2f})' if conf is not None else ''
            diag = f"Degradation signature is closest to {_sentence_case(e['fault_label'])}{conf_txt}."
        shifted = [a['component'].replace('sensor_', 'sensor ') for a in e.get('active_anomalies', [])]
        if shifted:
            diag += f" Largest shifts: {', '.join(shifted)}."
        trace.append({'agent': 'Diagnosis', 'finding': diag})

        # 3. Prognosis
        iv = e['intervals']
        trace.append({'agent': 'Prognosis', 'finding': (
            f"Predicted RUL {e['rul_pred']:.0f} cycles; 90% interval {iv['0.9']['lower']:.0f}-{iv['0.9']['upper']:.0f}, "
            f"95% interval {iv['0.95']['lower']:.0f}-{iv['0.95']['upper']:.0f}.")})

        # 4. Calibration
        drift = e['drift_status']
        level = '0.95' if drift.get('drift_detected') else '0.9'
        if drift.get('drift_detected'):
            cal = (f"Twin discrepancy {drift['drift_score']:.2f} exceeds threshold {drift['threshold']:.2f}. "
                   'Switching decisions to the 95% lower bound.')
        elif drift.get('drift_score') is None:
            cal = 'Too few cycles to test for twin discrepancy; using the 90% lower bound.'
        else:
            cal = f"Twin discrepancy {drift['drift_score']:.2f} is within threshold {drift['threshold']:.2f}; using the 90% lower bound."
        trace.append({'agent': 'Calibration', 'finding': cal})
        decision_rul = iv[level]['lower']

        # 5. Scenario
        scenario_note = None
        if scenario_runner is not None:
            cur = e['current_settings']
            derate = scenario_runner(cur['altitude_kft'], cur['mach_number'], max(60.0, cur['throttle_pct'] - 10.0))
            scenario_note = (f"A 10-point throttle derate changes modeled RUL by {derate['rul_delta']:+.0f} cycles "
                             f"(assumption-based surrogate).")
            trace.append({'agent': 'Scenario', 'finding': scenario_note})

        # 6. Planner
        action = decide(decision_rul)
        point_action = decide(e['rul_pred'])
        if action == 'REMOVE':
            plan = f"Plan removal within {_cycles(max(0, decision_rul))}."
        elif action == 'INSPECT':
            plan = f"Inspect within {_cycles(max(1, decision_rul - REMOVE_AT))}, before the conservative bound reaches {REMOVE_AT}."
        else:
            plan = f"Re-assess when the conservative bound reaches {INSPECT_AT} cycles."
        if point_action != action:
            plan += f" The point estimate alone would suggest '{ACTIONS[point_action].lower()}'; the interval is more cautious."
        trace.append({'agent': 'Planner', 'finding': plan})

        return {
            'engine_id': e['engine_id'],
            'timestamp_cycle': cycle,
            'action_code': action,
            'recommended_action': ACTIONS[action],
            'plan': plan,
            'decision_basis': {
                'confidence_level': float(level),
                'decision_rul': round(decision_rul, 1),
                'point_estimate': e['rul_pred'],
                'point_estimate_action': point_action,
                'thresholds': {'remove_at': REMOVE_AT, 'inspect_at': INSPECT_AT},
            },
            'diagnostic_summary': diag,
            'calibration_note': cal,
            'scenario_note': scenario_note,
            'observations': obs,
            'trace': trace,
            'disclaimer': 'Research decision support on simulated C-MAPSS data. Not an airworthiness determination.',
        }
