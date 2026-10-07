"""
TwinAero - Counterfactual Digital Twin Simulation Engine
Evaluates what-if operational scenarios (e.g., derated thrust, altitude shifts, eco-cruise)
to forecast impact on component degradation rates and Remaining Useful Life (RUL).
"""

import numpy as np
from typing import Dict, Any, List


class CounterfactualSimulator:
    """
    Simulates twin engine response under counterfactual flight envelopes
    and operating setting modifications.
    """

    def __init__(self):
        pass

    def simulate_scenario(
        self,
        current_cycle: int,
        current_health_pct: float,
        baseline_rul: float,
        altitude_kft: float = 35.0,
        mach_number: float = 0.80,
        throttle_pct: float = 100.0,
        fault_mode: str = 'HPC_DEGRADATION'
    ) -> Dict[str, Any]:
        """
        Simulates future trajectory under modified flight conditions.
        """
        # Aerothermal stress factor calculation:
        # Throttle exponent is ~1.8 (Arrhenius / thermal fatigue rate in gas turbines)
        throttle_factor = (throttle_pct / 100.0) ** 1.85
        
        # Altitude factor: High altitude reduces air density, increasing core temperatures for same thrust
        alt_factor = 1.0 + (altitude_kft - 30.0) * 0.008 if altitude_kft > 30.0 else 0.95
        
        # Mach dynamic pressure factor
        mach_factor = 1.0 + (mach_number - 0.70) * 0.35

        composite_stress = float(throttle_factor * alt_factor * mach_factor)

        # Fault-specific vulnerability:
        if 'HPC' in fault_mode:
            # HPC is highly sensitive to throttle and core temperature
            effective_stress = composite_stress * 1.15
        elif 'FAN' in fault_mode:
            # Fan is sensitive to dynamic pressure (Mach) and altitude
            effective_stress = composite_stress * (1.0 + mach_number * 0.15)
        else:
            effective_stress = composite_stress

        # Projected RUL under counterfactual regime
        # Higher stress degrades faster -> shorter RUL
        # Lower stress extends life -> longer RUL
        stress_ratio = max(0.5, min(2.5, effective_stress))
        counterfactual_rul = max(1.0, round(float(baseline_rul / stress_ratio), 1))
        rul_delta = round(float(counterfactual_rul - baseline_rul), 1)
        pct_change = round(float((counterfactual_rul - baseline_rul) / max(1.0, baseline_rul) * 100.0), 1)

        # Generate future health projection curves for 40 cycles or until failure
        horizon = min(60, int(max(baseline_rul, counterfactual_rul) + 10))
        cycles_ahead = np.linspace(0, horizon, 25)
        
        baseline_curve = []
        counterfactual_curve = []

        base_decay_rate = current_health_pct / max(5.0, baseline_rul)
        cf_decay_rate = current_health_pct / max(5.0, counterfactual_rul)

        for c in cycles_ahead:
            cyc_num = int(current_cycle + c)
            b_h = max(0.0, current_health_pct - (c * base_decay_rate))
            cf_h = max(0.0, current_health_pct - (c * cf_decay_rate))
            baseline_curve.append({'cycle': cyc_num, 'health': round(float(b_h), 1)})
            counterfactual_curve.append({'cycle': cyc_num, 'health': round(float(cf_h), 1)})

        # Recommendation based on counterfactual analysis
        if rul_delta > 5:
            recommendation = (
                f"Operational Derate Feasible: Adopting this operating profile extends RUL by "
                f"+{rul_delta} cycles (+{pct_change}%), enabling scheduled maintenance deferral."
            )
        elif rul_delta < -5:
            recommendation = (
                f"Severe Acceleration Warning: Proposed operational profile increases component stress by "
                f"{round((stress_ratio - 1.0) * 100, 1)}%, accelerating wear and reducing RUL by {abs(rul_delta)} cycles."
            )
        else:
            recommendation = "Nominal Profile: Minor variance within expected operating tolerance."

        return {
            'baseline_rul': baseline_rul,
            'counterfactual_rul': counterfactual_rul,
            'rul_delta': rul_delta,
            'pct_change': pct_change,
            'stress_ratio': round(stress_ratio, 2),
            'effective_stress': round(effective_stress, 2),
            'baseline_curve': baseline_curve,
            'counterfactual_curve': counterfactual_curve,
            'recommendation': recommendation,
            'parameters': {
                'altitude_kft': altitude_kft,
                'mach_number': mach_number,
                'throttle_pct': throttle_pct
            }
        }
