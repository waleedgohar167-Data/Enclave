import asyncio
import uuid
import os
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List

import numpy as np

from agents.base_agent import BaseAgent
from core.schemas import RawTelemetryEvent, NormalizedAnomaly, AttackNarrative

CONFIG = {
    "customer_learning_period_days": int(os.getenv("CUSTOMER_LEARNING_PERIOD_DAYS", "30")),
    "composite_z_score_threshold": float(os.getenv("COMPOSITE_Z_SCORE_THRESHOLD", "4.0")),
    "correlation_window_seconds": int(os.getenv("CORRELATION_WINDOW_SECONDS", "14400")),
    "critical_confidence_threshold": float(os.getenv("CRITICAL_CONFIDENCE_THRESHOLD", "85.0")),
    "predictive_sensitivity_multiplier": float(os.getenv("PREDICTIVE_SENSITIVITY_MULTIPLIER", "0.7"))
}

class SentinelAgent(BaseAgent):
    """
    Agent C1 (Sentinel): The Watcher (Layer 4 - Predictive Engine).
    Multi-Dimensional Behavioral Baseline Engine with Attack Chain Correlation
    and Transparent Markov-chain predictive pre-positioning.
    """
    def __init__(self, orchestrator_queue: asyncio.PriorityQueue):
        super().__init__("C1_Sentinel", orchestrator_queue)
        
        self.baselines: Dict[str, Dict[str, Any]] = {}
        self.correlation_buffer: Dict[str, AttackNarrative] = {}
        
        self.composite_threshold = CONFIG["composite_z_score_threshold"]
        self.learning_period_days = CONFIG["customer_learning_period_days"]
        self.correlation_window = timedelta(seconds=CONFIG["correlation_window_seconds"])
        self.critical_confidence = CONFIG["critical_confidence_threshold"]
        self.predictive_sensitivity = CONFIG["predictive_sensitivity_multiplier"]
        
        # Anti-Failure Rule 1 & 2: Local, transparent transition matrix.
        self.mitre_transition_matrix = {
            "Initial Access": [
                {"tactic": "Execution", "probability": 0.85, "signatures": ["process_start", "powershell_execution"]},
                {"tactic": "Persistence", "probability": 0.60, "signatures": ["registry_modification", "scheduled_task"]}
            ],
            "Execution": [
                {"tactic": "Privilege Escalation", "probability": 0.75, "signatures": ["token_manipulation", "service_creation"]},
                {"tactic": "Defense Evasion", "probability": 0.80, "signatures": ["log_clearing", "process_injection"]}
            ],
            "Credential Access": [
                {"tactic": "Lateral Movement", "probability": 0.90, "signatures": ["rdp_session", "smb_share_access"]},
                {"tactic": "Discovery", "probability": 0.65, "signatures": ["network_scan", "ad_query"]}
            ],
            "Lateral Movement": [
                {"tactic": "Collection", "probability": 0.70, "signatures": ["file_access_spike", "archive_creation"]},
                {"tactic": "Command and Control", "probability": 0.85, "signatures": ["beaconing", "unusual_dns"]}
            ],
            "Collection": [
                {"tactic": "Exfiltration", "probability": 0.95, "signatures": ["data_transfer_spike", "ftp_upload"]}
            ]
        }
        
        # Simple heuristic mapping from raw event types to Tactics
        self.event_to_tactic_map = {
            "login_failed": "Initial Access",
            "brute_force": "Credential Access",
            "process_start": "Execution",
            "smb_share_access": "Lateral Movement",
            "file_access_spike": "Collection",
            "beaconing": "Command and Control"
        }
        
        self._buffer_task = None

    async def run(self):
        """Override run to include the async buffer manager."""
        self.logger.info("Starting C1_Sentinel processing loop and Buffer Manager.")
        self._buffer_task = asyncio.create_task(self._buffer_manager())
        await super().run()

    async def _buffer_manager(self):
        """Async Pruning Loop."""
        while True:
            await asyncio.sleep(60)
            now = datetime.now(timezone.utc)
            to_emit = []
            
            for entity, narrative in list(self.correlation_buffer.items()):
                time_since_last = now - narrative.last_updated
                
                if time_since_last > self.correlation_window:
                    self.logger.info(f"Narrative for {entity} closed due to time window expiration.")
                    to_emit.append((entity, narrative))
                elif narrative.confidence_score >= self.critical_confidence:
                    self.logger.warning(f"CRITICAL NARRATIVE! {entity} breached confidence threshold. Escalating immediately.")
                    to_emit.append((entity, narrative))

            for entity, narrative in to_emit:
                priority = max(1, 100 - int(narrative.confidence_score)) 
                await self.emit_event(
                    event_type="attack_narrative",
                    payload=narrative.model_dump(mode='json'),
                    priority=priority
                )
                del self.correlation_buffer[entity]

    def _get_predicted_events_for_entity(self, entity: str) -> List[str]:
        """Checks if there are active predictions for this entity."""
        predicted_events = []
        if entity in self.correlation_buffer:
            narrative = self.correlation_buffer[entity]
            for move in narrative.predicted_next_moves:
                predicted_events.extend(move.get("signatures", []))
        return predicted_events

    async def process_event(self, event: Dict[str, Any]):
        """
        Processes multi-dimensional telemetry, checking learning locks,
        updating standard numpy baselines, scoring anomalies, and fusing them into narratives.
        Applies predictive pre-positioning if the event type is anticipated.
        """
        # Event filtering: Ignore events not meant for C1
        event_type = event.get("type", "")
        if event_type != "raw_telemetry":
            return

        payload = event.get("data", {})
        
        try:
            telemetry = RawTelemetryEvent(**payload)
        except Exception as e:
            self.logger.error(f"Failed to validate raw telemetry: {e}")
            return

        entity = telemetry.entity
        now = datetime.now(timezone.utc)
        
        if entity not in self.baselines:
            self.baselines[entity] = {
                "first_seen": now,
                "frequency": [],
                "temporal": np.zeros(24),
                "volume": []
            }
            self.logger.info(f"New entity '{entity}' discovered. Initiating {self.learning_period_days}-day learning lock.")

        baseline = self.baselines[entity]
        
        current_freq = float(telemetry.raw_data.get("frequency", 1.0))
        event_time = telemetry.timestamp
        if event_time.tzinfo is None:
            event_time = event_time.replace(tzinfo=timezone.utc)
        current_hour = event_time.hour
        current_volume = telemetry.data_volume_bytes if telemetry.data_volume_bytes is not None else 0.0

        days_active = (now - baseline["first_seen"]).days
        
        if days_active < self.learning_period_days:
            self.logger.debug(f"Entity '{entity}' in learning phase. Recording silently.")
            self._update_baselines(baseline, current_freq, current_hour, current_volume)
            return

        freq_z = self._calculate_z_score(current_freq, baseline["frequency"])
        vol_z = self._calculate_z_score(current_volume, baseline["volume"])
        temp_prob = self._calculate_temporal_deviation(current_hour, baseline["temporal"])
        
        composite_score = abs(freq_z) + abs(vol_z) + temp_prob
        
        # Anti-Failure Rule 3: Pre-Positioned Defense
        # Check if this specific event was predicted. If so, lower the threshold.
        active_threshold = self.composite_threshold
        predicted_events = self._get_predicted_events_for_entity(entity)
        
        if telemetry.event_type in predicted_events:
            active_threshold = self.composite_threshold * self.predictive_sensitivity
            self.logger.warning(f"Predictive Defense active for {entity}! Threshold lowered to {active_threshold:.2f} for '{telemetry.event_type}'")

        if composite_score >= active_threshold:
            factors = {}
            if abs(freq_z) > 2.0: factors["frequency"] = f"High Deviation ({freq_z:.2f}z)"
            else: factors["frequency"] = "Normal"
            
            if abs(vol_z) > 2.0: factors["volume"] = f"High Deviation ({vol_z:.2f}z)"
            else: factors["volume"] = "Normal"
            
            if temp_prob > 1.5: factors["time_of_day"] = f"Unusual Hour ({current_hour}:00)"
            else: factors["time_of_day"] = "Normal"

            anomaly = NormalizedAnomaly(
                anomaly_id=str(uuid.uuid4()),
                entity=entity,
                event_type=telemetry.event_type,
                z_score=float(composite_score),
                frequency=float(current_freq),
                baseline_mean=float(np.mean(baseline["frequency"]) if baseline["frequency"] else 0.0),
                contributing_factors=factors,
                timestamp=now
            )
            
            self._correlate_anomaly(entity, anomaly, composite_score)

        self._update_baselines(baseline, current_freq, current_hour, current_volume)

    def _correlate_anomaly(self, entity: str, anomaly: NormalizedAnomaly, composite_score: float):
        """Priority Escalation & Correlation Fusion."""
        now = datetime.now(timezone.utc)
        
        if entity in self.correlation_buffer:
            narrative = self.correlation_buffer[entity]
            narrative.anomalies.append(anomaly)
            narrative.last_updated = now
            
            base_increment = min(15.0, composite_score * 2.0)
            multiplier = 1.0 + (len(narrative.anomalies) * 0.1) 
            
            new_confidence = narrative.confidence_score + (base_increment * multiplier)
            narrative.confidence_score = min(100.0, float(new_confidence))
            narrative.summary = f"Correlated attack chain: {len(narrative.anomalies)} anomalies detected."
            
        else:
            base_confidence = min(60.0, 40.0 + (composite_score * 2.0))
            
            narrative = AttackNarrative(
                narrative_id=f"nar_{uuid.uuid4().hex[:8]}",
                entity=entity,
                anomalies=[anomaly],
                start_time=now,
                last_updated=now,
                confidence_score=float(base_confidence),
                summary="Initial anomaly detected, monitoring for correlation.",
                predicted_next_moves=[]
            )
            self.correlation_buffer[entity] = narrative
            
        # Update predictions based on the newly added anomaly
        self._predict_next_moves(self.correlation_buffer[entity], anomaly)

    def _predict_next_moves(self, narrative: AttackNarrative, latest_anomaly: NormalizedAnomaly):
        """
        Anti-Failure Rule 2: Transparent Probability Lookup
        Updates the narrative with predicted next moves based on the local Markov transition matrix.
        """
        current_tactic = self.event_to_tactic_map.get(latest_anomaly.event_type, "Unknown")
        
        if current_tactic in self.mitre_transition_matrix:
            transitions = self.mitre_transition_matrix[current_tactic]
            narrative.predicted_next_moves = transitions
            self.logger.info(f"Predictive Engine: Extracted next likely moves from '{current_tactic}' for {narrative.entity}.")
            for t in transitions:
                self.logger.debug(f" -> {t['probability']*100:.0f}% chance of {t['tactic']} (Signatures: {t['signatures']})")
        else:
            # Clear previous predictions if current state has no known transitions
            narrative.predicted_next_moves = []

    def _update_baselines(self, baseline: Dict[str, Any], freq: float, hour: int, volume: float):
        baseline["frequency"].append(freq)
        if len(baseline["frequency"]) > 10000:
            baseline["frequency"].pop(0)
            
        baseline["temporal"][hour] += 1
        
        baseline["volume"].append(volume)
        if len(baseline["volume"]) > 10000:
            baseline["volume"].pop(0)

    def _calculate_z_score(self, value: float, history: list) -> float:
        if len(history) < 5:
            return 0.0
        
        mean = np.mean(history)
        std_dev = np.std(history)
        
        if std_dev > 0:
            return (value - mean) / std_dev
        return 0.0

    def _calculate_temporal_deviation(self, current_hour: int, temporal_hist: np.ndarray) -> float:
        total_events = np.sum(temporal_hist)
        if total_events < 50:
            return 0.0
            
        prob = temporal_hist[current_hour] / total_events
        active_hours = temporal_hist[temporal_hist > 0]
        mean_active_prob = np.mean(active_hours) / total_events if len(active_hours) > 0 else 1.0
        
        if prob < (mean_active_prob * 0.5):
            return float((mean_active_prob - prob) * 20.0)
        return 0.0