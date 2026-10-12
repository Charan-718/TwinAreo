"""
TwinAero - Counterfactual what-if simulator

Important scope note: in C-MAPSS the damage-propagation process is not driven by the
operating settings, so the dataset cannot validate how a different flight profile
would change wear. This module is therefore an explicit *assumption-based surrogate*:
a parametric stress model that scales the remaining-life estimate. Its internal
consistency (monotonicity, identity at the current operating point) is tested in
ml/experiments; its absolute effect sizes are illustrative.

Stress model (relative to the engine's current operating point):
    stress(alt, mach, tra) = (tra/100)^1.85 * (1 + 0.008*max(0, alt-30)) * (1 + 0.35*(mach-0.70))
    ratio = stress(scenario) / stress(current), scaled by fault-mode sensitivity
    RUL_cf = RUL / ratio        (the conformal interval is scaled the same way)
"""

from typing import Any, Dict

import numpy as np

SURROGATE_ASSUMPTIONS = [
    'C-MAPSS does not encode a causal link between operating settings and wear rate.',
    'Wear rate is assumed to scale with throttle as (TRA/100)^1.85, rise above 30 kft and with Mach number.',
    'HPC degradation is assumed more throttle-sensitive; fan degradation more Mach-sensitive.',
    'Effect sizes are illustrative. Use the direction of change, not the magnitude, for decisions.',
]

THROTTLE_EXPONENT = 1.85


def operating_stress(altitude_kft: float, mach_number: float, throttle_pct: float) -> float:
    throttle = (max(throttle_pct, 1.0) / 100.0) ** THROTTLE_EXPONENT
    altitude = 1.0 + 0.008 * max(0.0, altitude_kft - 30.0)
    mach = 1.0 + 0.35 * (mach_number - 0.70)
    return float(throttle * altitude * mach)


def mode_sensitivity(fault_mode: str, ratio: float, mach_number: float, current_mach: float) -> float:
    if 'HPC' in fault_mode:
        return ratio ** 1.15
    if 'FAN' in fault_mode:
        return ratio * (1.0 + 0.15 * (mach_number - current_mach))
    return ratio


class CounterfactualSimulator:
    def simulate_scenario(
        self,
        current_cycle: int,
        current_health_pct: float,
        baseline_rul: float,
        altitude_kft: float,
        mach_number: float,
        throttle_pct: float,
        fault_mode: str = 'NO_CLEAR_SIGNATURE',
        current_settings: Dict[str, float] = None,
        baseline_interval: Dict[str, float] = None,
    ) -> Dict[str, Any]:
        cur = current_settings or {'altitude_kft': altitude_kft, 'mach_number': mach_number, 'throttle_pct': throttle_pct}
        base_stress = operating_stress(cur['altitude_kft'], cur['mach_number'], cur['throttle_pct'])
        cf_stress = operating_stress(altitude_kft, mach_number, throttle_pct)
        ratio = mode_sensitivity(fault_mode, cf_stress / base_stress, mach_number, cur['mach_number'])
        ratio = float(np.clip(ratio, 0.4, 2.5))

        cf_rul = round(baseline_rul / ratio, 1)
        rul_delta = round(cf_rul - baseline_rul, 1)
        pct_change = round((cf_rul - baseline_rul) / max(1.0, baseline_rul) * 100.0, 1)

        interval = None
        if baseline_interval:
            interval = {
                'lower': round(baseline_interval['lower'] / ratio, 1),
                'upper': round(baseline_interval['upper'] / ratio, 1),
            }

        horizon = int(max(baseline_rul, cf_rul) * 1.1) + 5
        steps = np.linspace(0, horizon, 31)
        baseline_curve, counterfactual_curve = [], []
        for c in steps:
            cyc = int(round(current_cycle + c))
            baseline_curve.append({'cycle': cyc, 'health': round(max(0.0, current_health_pct * (1 - c / max(baseline_rul, 1))), 1)})
            counterfactual_curve.append({'cycle': cyc, 'health': round(max(0.0, current_health_pct * (1 - c / max(cf_rul, 1))), 1)})

        if rul_delta > 5:
            recommendation = (f'This profile lowers modeled stress by {abs(round((ratio - 1) * 100, 1))}% and would extend '
                              f'remaining life by about {rul_delta} cycles. Treat as a direction, not a guarantee.')
        elif rul_delta < -5:
            recommendation = (f'This profile raises modeled stress by {round((ratio - 1) * 100, 1)}% and would shorten '
                              f'remaining life by about {abs(rul_delta)} cycles.')
        else:
            recommendation = 'Modeled stress is close to the current operating point; little change in remaining life.'

        return {
            'baseline_rul': baseline_rul,
            'counterfactual_rul': cf_rul,
            'counterfactual_interval': interval,
            'rul_delta': rul_delta,
            'pct_change': pct_change,
            'stress_ratio': round(ratio, 3),
            'effective_stress': round(cf_stress, 3),
            'baseline_curve': baseline_curve,
            'counterfactual_curve': counterfactual_curve,
            'recommendation': recommendation,
            'parameters': {'altitude_kft': altitude_kft, 'mach_number': mach_number, 'throttle_pct': throttle_pct},
            'current_settings': cur,
            'model_type': 'assumption_based_surrogate',
            'assumptions': SURROGATE_ASSUMPTIONS,
        }
