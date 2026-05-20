import asyncio
import os
import json
import numpy as np
from typing import Dict, Any, List
from datetime import datetime, timezone

from agents.base_agent import BaseAgent
from core.schemas import ModelDriftPrediction, PostureDriftAlert, BehavioralDriftAlert

CONFIG = {
    "ewma_alpha": float(os.getenv("EWMA_ALPHA", "0.2")),
    "critical_fpr_threshold": float(os.getenv("CRITICAL_FPR_THRESHOLD", "0.15")),
    "drift_eval_interval_seconds": int(os.getenv("DRIFT_EVAL_INTERVAL_SECONDS", "3600")), # 1 hour
    "c10_state_path": os.getenv("C10_STATE_PATH", "f:\\Guard\\data\\c10_state.json")
}

class DriftMonitorAgent(BaseAgent):
    """
    Agent C10 (Drift Monitor): The 3-Dimensional Actuary.
    Monitors Posture Drift, Behavioral Drift, and Model/Threshold Drift.
    Now fully state-persistent to survive server reboots.
    """
    def __init__(self, orchestrator_queue: asyncio.PriorityQueue):
        super().__init__("C10_Drift_Monitor", orchestrator_queue)
        self.alpha = CONFIG["ewma_alpha"]
        self.critical_fpr = CONFIG["critical_fpr_threshold"]
        self.eval_interval = 60 # Simulated short interval for testing. Real is 3600.
        self.state_file = CONFIG["c10_state_path"]
        
        # Pillar 3: Load Local state memory from disk
        saved_state = self._load_state()
        self.rule_baselines: Dict[str, Dict[str, Any]] = saved_state.get("rule_baselines", {})
        self.behavioral_state: Dict[str, Dict[str, Any]] = saved_state.get("behavioral_state", {})
        self.posture_state: Dict[str, Dict[str, Any]] = saved_state.get("posture_state", {})
        
        self.running = False

    async def run(self):
        """
        Anti-Failure Rule 1: The 3-Category Architecture.
        Launches three separate asynchronous monitoring loops + universal heartbeat.
        """
        await super().run() # Starts the heartbeat from BaseAgent
        self.logger.info("Starting C10 Drift Monitor 3-Category loops.")
        self.running = True
        await asyncio.gather(
            self._monitor_posture_drift(),
            self._monitor_behavioral_drift(),
            self._monitor_model_drift()
        )

    def _load_state(self) -> Dict[str, Any]:
        """Pillar 3: Memory Excellence. Loads drift baselines from disk on startup."""
        if os.path.exists(self.state_file):
            try:
                with open(self.state_file, "r") as f:
                    state = json.load(f)
                    self.logger.info("Successfully recovered C10 drift states from disk.")
                    return state
            except Exception as e:
                self.logger.error(f"Failed to load C10 state from {self.state_file}: {e}")
        return {}

    def _save_state(self):
        """Pillar 3: Memory Excellence. Saves all three drift categories to disk."""
        os.makedirs(os.path.dirname(self.state_file), exist_ok=True)
        try:
            with open(self.state_file, "w") as f:
                json.dump({
                    "rule_baselines": self.rule_baselines,
                    "behavioral_state": self.behavioral_state,
                    "posture_state": self.posture_state
                }, f)
        except Exception as e:
            self.logger.error(f"Failed to save C10 state to {self.state_file}: {e}")

    async def process_event(self, event: Dict[str, Any]):
        """
        Agent C10 primarily operates autonomously via background loops.
        It intercepts events to update its internal baseline states.
        """
        try:
            if not self.running:
                # Using create_task so it doesn't block process_event
                asyncio.create_task(self.run())

            event_type = event.get("type", "")
            payload = event.get("data", {})
            
            # Simulated state ingestion (In a real system, it would parse updates from C7, C0, C1)
            if event_type == "posture_update":
                self._update_posture_state(payload)
            elif event_type == "behavioral_update":
                self._update_behavioral_state(payload)
            elif event_type == "model_telemetry":
                self._update_rule_baseline(payload)
                
        except Exception as e:
            # Pillar 5: Dead Letter Queue via BaseAgent
            self._log_failed_event(event, e)

    # --- CATEGORY 1: POSTURE DRIFT ---
    async def _monitor_posture_drift(self):
        """
        Simulate checking metrics from C7 (Architect).
        If 'Patch level' drops by >5% in 72 hours, emit PostureDriftAlert.
        """
        while True:
            await asyncio.sleep(self.eval_interval)
            
            for metric_name, state in self.posture_state.items():
                old_value = state.get("old_value", 100.0)
                new_value = state.get("current_value", 100.0)
                
                # Check for >5% drop
                drop_percentage = (old_value - new_value) / old_value if old_value > 0 else 0
                
                if drop_percentage > 0.05:
                    alert = PostureDriftAlert(
                        metric_name=metric_name,
                        old_value=old_value,
                        new_value=new_value,
                        time_window_hours=72,
                        impacted_assets=state.get("impacted_assets", []),
                        plain_english_summary=f"Posture metric '{metric_name}' degraded by {drop_percentage*100:.1f}%. Immediate review required."
                    )
                    
                    self.logger.warning(f"Posture Drift detected: {metric_name} dropped to {new_value}")
                    await self.emit_event("posture_drift_detected", alert.model_dump(mode='json'), priority=30)
                    
                    # Reset baseline to avoid alert spam
                    state["old_value"] = new_value
                    self._save_state()

    def _update_posture_state(self, payload: Dict[str, Any]):
        metric = payload.get("metric_name", "Unknown")
        if metric not in self.posture_state:
            self.posture_state[metric] = {"old_value": payload.get("value", 100.0), "impacted_assets": payload.get("assets", [])}
        self.posture_state[metric]["current_value"] = payload.get("value", 100.0)
        self._save_state()

    # --- CATEGORY 2: BEHAVIORAL DRIFT ---
    async def _monitor_behavioral_drift(self):
        """
        Simulate checking metrics from C0 (Baseline).
        Anti-Failure Rule 2: Velocity vs. Level.
        If score is high but velocity is stable, suppress. If accelerating, emit.
        """
        while True:
            await asyncio.sleep(self.eval_interval)
            
            for entity_id, state in self.behavioral_state.items():
                current_score = state.get("current_score", 0.0)
                last_score = state.get("last_score", 0.0)
                last_velocity = state.get("last_velocity", 0.0)
                
                # Calculate velocity (rate of change)
                current_velocity = current_score - last_score
                
                # Calculate acceleration (rate of change of velocity)
                acceleration = current_velocity - last_velocity
                is_accelerating = acceleration > 0.5 # Threshold for meaningful acceleration
                
                # Velocity vs Level logic
                if current_score > 70.0:
                    if is_accelerating:
                        # High score AND accelerating -> Slow compromise!
                        alert = BehavioralDriftAlert(
                            entity_id=entity_id,
                            drift_score=current_score,
                            velocity=current_velocity,
                            is_accelerating=True,
                            recommendation="Immediate investigation by C2. Accelerating behavioral drift indicates potential slow compromise."
                        )
                        self.logger.warning(f"Behavioral Drift (Accelerating) detected on {entity_id}")
                        await self.emit_event("behavioral_drift_detected", alert.model_dump(mode='json'), priority=20)
                    else:
                        # High score but stable -> Regime change (new normal). Suppress.
                        self.logger.info(f"Behavioral Drift on {entity_id} is high ({current_score}) but stable velocity. Suppressing alert.")
                
                # Update state for next cycle
                state["last_score"] = current_score
                state["last_velocity"] = current_velocity
            self._save_state()

    def _update_behavioral_state(self, payload: Dict[str, Any]):
        entity = payload.get("entity_id", "Unknown")
        if entity not in self.behavioral_state:
            self.behavioral_state[entity] = {"last_score": 0.0, "last_velocity": 0.0}
        self.behavioral_state[entity]["current_score"] = payload.get("anomaly_score_0_to_100", 0.0)
        self._save_state()

    # --- CATEGORY 3: MODEL / THRESHOLD DRIFT ---
    async def _monitor_model_drift(self):
        """
        Anti-Failure Rule 3: The Predictive Output.
        Uses SPC and numpy to calculate exactly 'days_until_critical'.
        """
        while True:
            await asyncio.sleep(self.eval_interval)
            
            for rule_id, state in self.rule_baselines.items():
                prediction = self._evaluate_rule_spc(rule_id, state)
                if prediction and prediction.status in ["WARNING", "CRITICAL"]:
                    self.logger.warning(f"Model Drift detected on {rule_id}. Days until critical: {prediction.days_until_critical}")
                    await self.emit_event("model_drift_prediction", prediction.model_dump(mode='json'), priority=40)

    def _update_rule_baseline(self, payload: Dict[str, Any]):
        rule_id = payload.get("rule_id", "Unknown")
        if rule_id not in self.rule_baselines:
            self.rule_baselines[rule_id] = {
                "baseline_fpr": payload.get("fpr", 0.05),
                "ewma_fpr": payload.get("fpr", 0.05),
                "velocity_history": []
            }
        
        # EWMA update of FPR
        current_fpr = payload.get("fpr", 0.05)
        old_ewma = self.rule_baselines[rule_id]["ewma_fpr"]
        new_ewma = (self.alpha * current_fpr) + ((1 - self.alpha) * old_ewma)
        
        # Track velocity
        velocity = new_ewma - old_ewma
        history = self.rule_baselines[rule_id]["velocity_history"]
        history.append(velocity)
        if len(history) > 10:
            history.pop(0)
            
        self.rule_baselines[rule_id]["ewma_fpr"] = new_ewma
        self._save_state()

    def _evaluate_rule_spc(self, rule_id: str, state: Dict[str, Any]) -> ModelDriftPrediction:
        """
        High-performance numpy math to predict days until the rule hits the critical FPR threshold.
        """
        baseline_fpr = state["baseline_fpr"]
        current_ewma = state["ewma_fpr"]
        velocity_history = state["velocity_history"]
        
        if not velocity_history:
            avg_velocity = 0.0
        else:
            avg_velocity = float(np.mean(velocity_history))
            
        days_until_critical = 999
        status = "STABLE"
        
        if current_ewma >= self.critical_fpr:
            status = "CRITICAL"
            days_until_critical = 0
        elif avg_velocity > 0:
            remaining_headroom = self.critical_fpr - current_ewma
            days_until_critical = int(np.ceil(remaining_headroom / avg_velocity))
            
            if days_until_critical <= 7:
                status = "WARNING"
                
        return ModelDriftPrediction(
            rule_id=rule_id,
            baseline_fpr=baseline_fpr,
            current_ewma_fpr=current_ewma,
            drift_velocity=avg_velocity,
            days_until_critical=days_until_critical,
            status=status
        )