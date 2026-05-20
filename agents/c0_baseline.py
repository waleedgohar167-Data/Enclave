import asyncio
from datetime import datetime
from typing import Dict, Any
import numpy as np

from pydantic import ValidationError

from agents.base_agent import BaseAgent
from core.schemas import BaselineProfile, ScoredEvent

class BaselineAgent(BaseAgent):
    """
    Agent C0 (Baseline): The Foundation.
    Establishes normal behavioral patterns using EWMA.
    Replaces raw telemetry with ScoredEvents.
    """
    def __init__(self, orchestrator_queue: asyncio.PriorityQueue):
        super().__init__("C0_Baseline", orchestrator_queue)
        
        # 4-Dimensional Profiling State
        # Memory Bloat Prevention: Storing ONLY mathematical summaries.
        self.baselines = {
            "users": {},
            "devices": {},
            "network_segments": {},
            "service_accounts": {}
        }
        
        # EWMA Smoothing Factor
        self.alpha = 0.1
        self.spike_threshold_z = 3.0 # Z-score threshold for "sudden spike"

    async def process_event(self, event: Dict[str, Any]):
        """
        Receives raw event, calculates statistical deviations, updates baseline,
        and emits a ScoredEvent to the Orchestrator.
        """
        payload = event.get("data", {})
        
        # Infer or extract entity details
        entity_id = payload.get("entity_id") or payload.get("entity", "unknown")
        entity_type = self._determine_entity_type(payload)
        
        if entity_id == "unknown":
            return # Cannot baseline an unknown entity
            
        profile = self._get_or_create_profile(entity_id, entity_type)
        
        # Extract an observable metric (e.g., data_volume_bytes, login_hour, etc.)
        # Defaulting to 1.0 for discrete event occurrence if volume isn't provided
        metric_name = "activity_volume"
        current_val = float(payload.get("data_volume_bytes", 1.0))
        
        # Statistical calculations
        score, context = self._update_and_score(profile, metric_name, current_val)
        
        # Create ScoredEvent
        scored_event = ScoredEvent(
            event_id=payload.get("event_id", "evt_unknown"),
            entity_id=entity_id,
            raw_event_type=payload.get("event_type", "unknown_event"),
            anomaly_score_0_to_100=score,
            deviation_context=context
        )
        
        # Emit to Orchestrator for C1 Sentinel
        await self.emit_event(
            event_type="scored_event_ready",
            payload=scored_event.model_dump(mode='json'),
            priority=20 # High priority for base pipeline
        )

    def _determine_entity_type(self, payload: Dict[str, Any]) -> str:
        """Categorize into the 4 distinct buckets."""
        e_type = payload.get("entity_type", "").lower()
        if "user" in e_type: return "users"
        if "device" in e_type or "host" in e_type: return "devices"
        if "service" in e_type or "account" in e_type: return "service_accounts"
        if "network" in e_type or "ip" in e_type: return "network_segments"
        
        # Default fallback heuristic based on entity string
        entity_str = payload.get("entity", "").lower()
        if "@" in entity_str: return "users"
        if "." in entity_str and any(c.isdigit() for c in entity_str): return "network_segments"
        if "svc_" in entity_str: return "service_accounts"
        return "devices" # default

    def _get_or_create_profile(self, entity_id: str, entity_type: str) -> BaselineProfile:
        bucket = self.baselines.get(entity_type, self.baselines["devices"])
        
        now = datetime.utcnow()
        if entity_id not in bucket:
            bucket[entity_id] = BaselineProfile(
                entity_id=entity_id,
                entity_type=entity_type,
                first_seen=now,
                baseline_confidence=0.0,
                behavioral_metrics={}
            )
            
        profile = bucket[entity_id]
        
        # Update confidence (30-Day Lock)
        days_active = (now - profile.first_seen.replace(tzinfo=None)).days
        confidence = min(100.0, (days_active / 30.0) * 100.0)
        profile.baseline_confidence = round(confidence, 2)
        
        return profile

    def _update_and_score(self, profile: BaselineProfile, metric_name: str, current_val: float):
        """
        Uses numpy to implement EWMA.
        Sudden spikes trigger a deviation score but do NOT immediately shift the baseline.
        """
        metrics = profile.behavioral_metrics
        
        if metric_name not in metrics:
            metrics[metric_name] = {
                "mean": current_val,
                "variance": 0.0,
                "last_updated": datetime.utcnow().isoformat()
            }
            return 0.0, "Initial baseline observation. No deviation."
            
        stats = metrics[metric_name]
        old_mean = np.float64(stats["mean"])
        old_var = np.float64(stats["variance"])
        val = np.float64(current_val)
        
        # Avoid division by zero
        std_dev = np.sqrt(old_var) if old_var > 0 else np.float64(1.0)
        z_score = np.abs(val - old_mean) / std_dev
        
        # Map Z-score to 0-100 anomaly score
        anomaly_score = float(np.clip((z_score / 4.0) * 100.0, 0.0, 100.0))
        
        context = f"Observed value {val:.2f} compared to baseline mean {old_mean:.2f}."
        
        # Anti-Failure Rule 4: Sudden spikes should NOT immediately shift the baseline
        if z_score < self.spike_threshold_z:
            # Gradual shift: Standard EWMA update
            new_mean = self.alpha * val + (1 - self.alpha) * old_mean
            new_var = self.alpha * ((val - old_mean) ** 2) + (1 - self.alpha) * old_var
            
            stats["mean"] = float(new_mean)
            stats["variance"] = float(new_var)
            stats["last_updated"] = datetime.utcnow().isoformat()
        else:
            context += f" Identified as a sudden spike (Z={z_score:.2f}). Baseline frozen."

        return anomaly_score, context
