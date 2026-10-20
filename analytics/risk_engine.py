"""
Nick's ai Analytics Microservice
Provides server-side Python utilities for Monte Carlo Risk Simulation & EVM Modeling
"""

import sys
import json
import random

def run_monte_carlo(iterations=1000, base_duration=90):
    results = []
    for _ in range(iterations):
        # Triangular distribution variance modeling (-15% to +35%)
        variance = random.triangular(-0.15, 0.35, 0.05)
        simulated_days = base_duration * (1 + variance)
        results.append(simulated_days)
    
    results.sort()
    p50 = results[int(iterations * 0.50)]
    p85 = results[int(iterations * 0.85)]
    p95 = results[int(iterations * 0.95)]
    
    return {
        "iterations": iterations,
        "baseDuration": base_duration,
        "p50_confidence_days": round(p50, 1),
        "p85_confidence_days": round(p85, 1),
        "p95_confidence_days": round(p95, 1)
    }

if __name__ == "__main__":
    simulation = run_monte_carlo()
    print(json.dumps(simulation, indent=2))
