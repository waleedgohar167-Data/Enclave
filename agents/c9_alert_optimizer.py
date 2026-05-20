import asyncio
import uuid
import time
import json
import os
from typing import Dict, Any, List

from pydantic import ValidationError

from agents.base_agent import BaseAgent
from core.schemas import GroupedCase

# Anti-Failure Rule 4: No Hardcoding
CONFIG = {
    "c9_state_path": os.getenv("C9_STATE_PATH", "f:\\Guard\\data\\c9_state.json")
}

class AlertOptimizerAgent(BaseAgent):
    """
    Agent C9 (Alert Optimizer): The Fatigue Killer.
    Implements a 5-Stage reduction pipeline to permanently solve alert fatigue.
    Now fully state-persistent to survive server reboots.
    """
    def __init__(self, orchestrator_queue: asyncio.PriorityQueue):
        super().__init__("C9_Alert_Optimizer", orchestrator_queue)
        
        self.state_file = CONFIG["c9_state_path"]
        
        # Anti-Failure Rule 1: The Grouping Engine (Now with Amnesia Immunity)
        self.active_cases: Dict[str, Dict[str, Any]] = self._load_state()
        
        # Configuration
        self.flush_interval_seconds = 60  # Check for mature cases every 60s
        self.case_maturity_seconds = 300 # Case matures if untouched for 5 minutes
        self._flush_task_started = False

    async def run(self):
        """Override to start heartbeat AND the flush task."""
        await super().run() # Starts the heartbeat from BaseAgent
        if not self._flush_task_started:
            self._flush_task_started = True
            asyncio.create_task(self._flush_mature_cases())

    def _load_state(self) -> Dict[str, Dict[str, Any]]:
        """Pillar 3: Memory Excellence. Loads active cases from disk on startup."""
        if os.path.exists(self.state_file):
            try:
                with open(self.state_file, "r") as f:
                    state = json.load(f)
                    self.logger.info(f"Successfully recovered {len(state)} active cases from disk.")
                    return state
            except Exception as e:
                self.logger.error(f"Failed to load C9 state from {self.state_file}: {e}")
        return {}

    def _save_state(self):
        """Pillar 3: Memory Excellence. Saves current active cases to disk."""
        os.makedirs(os.path.dirname(self.state_file), exist_ok=True)
        try:
            with open(self.state_file, "w") as f:
                json.dump(self.active_cases, f)
        except Exception as e:
            self.logger.error(f"Failed to save C9 state to {self.state_file}: {e}")

    async def process_event(self, event: Dict[str, Any]):
        """
        Catches raw alerts or anomalies, processes them through the 5-Stage pipeline.
        """
        try:
            event_type = event.get("type", "")
            # Only process relevant alert/anomaly events
            if event_type not in ["raw_alert", "normalized_anomaly", "scored_event_ready"]:
                return
                
            payload = event.get("data", {})
            entity = payload.get("entity_id") or payload.get("entity") or payload.get("target_entity", "unknown")
            
            if entity == "unknown":
                return
                
            # Extract initial features from the event
            confidence = float(payload.get("confidence", payload.get("anomaly_score_0_to_100", 50.0)))
            business_impact = float(payload.get("business_impact", 50.0)) # Simulate lookup
            killchain_stage_str = payload.get("killchain_stage", "Initial Access")
            
            # Map string killchain to float multiplier
            stage_map = {
                "Reconnaissance": 0.2, "Initial Access": 0.6, "Execution": 0.7,
                "Persistence": 0.75, "Privilege Escalation": 0.8, "Defense Evasion": 0.8,
                "Credential Access": 0.85, "Discovery": 0.5, "Lateral Movement": 0.9,
                "Collection": 0.9, "Command and Control": 0.95, "Exfiltration": 1.0, "Impact": 1.0
            }
            killchain_stage = stage_map.get(killchain_stage_str, 0.6)

            # Stage 2: Contextual Suppression
            confidence = self._suppress_false_positives(payload, confidence)
            
            # Stage 3 & 4: The Mathematical Priority Formula
            priority_score = self._calculate_priority_score(confidence, business_impact, killchain_stage)
            
            # Stage 1: The Grouping Engine (Deduplication & Correlation)
            if entity not in self.active_cases:
                self.active_cases[entity] = {
                    "case_id": f"CASE-{uuid.uuid4().hex[:8].upper()}",
                    "root_entity": entity,
                    "alert_count": 1,
                    "highest_priority_score": priority_score,
                    "highest_attacker_stage": killchain_stage,
                    "highest_business_impact": business_impact,
                    "first_seen": time.time(),
                    "last_seen": time.time(),
                    "events": [payload]
                }
                self.logger.info(f"Created new grouped case {self.active_cases[entity]['case_id']} for {entity}")
            else:
                case = self.active_cases[entity]
                case["alert_count"] += 1
                case["last_seen"] = time.time()
                case["highest_priority_score"] = max(case["highest_priority_score"], priority_score)
                case["highest_attacker_stage"] = max(case["highest_attacker_stage"], killchain_stage)
                case["highest_business_impact"] = max(case["highest_business_impact"], business_impact)
                case["events"].append(payload)
                
                # Limit stored events to prevent memory bloat
                if len(case["events"]) > 50:
                    case["events"].pop(0)

            # Save state to disk after every update
            self._save_state()

        except Exception as e:
            # Pillar 5: Dead Letter Queue via BaseAgent
            self._log_failed_event(event, e)

    def _suppress_false_positives(self, alert: Dict[str, Any], confidence: float) -> float:
        """Stage 2: Contextual Suppression."""
        is_new_employee = alert.get("context_is_new_employee", False)
        open_change_window = alert.get("context_open_change_window", False)
        
        if is_new_employee:
            confidence *= 0.7  
            self.logger.debug("Suppressed confidence due to new employee status.")
            
        if open_change_window:
            confidence *= 0.5  
            self.logger.debug("Suppressed confidence due to open ITSM change window.")
            
        return max(0.0, min(100.0, confidence))

    def _calculate_priority_score(self, confidence: float, impact: float, attacker_stage: float) -> float:
        """Stage 4: The Mathematical Priority Formula."""
        conf_scaled = max(0.0, min(100.0, confidence))
        impact_scaled = max(0.0, min(100.0, impact))
        stage_scaled = max(0.0, min(100.0, attacker_stage * 100.0))
        
        priority = (conf_scaled * 0.35) + (impact_scaled * 0.40) + (stage_scaled * 0.25)
        return max(0.0, min(100.0, priority))

    async def _flush_mature_cases(self):
        """Stage 5: Background loop to flush mature cases."""
        while True:
            await asyncio.sleep(self.flush_interval_seconds)
            now = time.time()
            matured_entities = []
            
            for entity, case in self.active_cases.items():
                time_since_last_alert = now - case["last_seen"]
                
                if time_since_last_alert >= self.case_maturity_seconds:
                    matured_entities.append(entity)
                    
                    summary = f"Grouped Case on {entity} containing {case['alert_count']} distinct events. Peak killchain stage multiplier: {case['highest_attacker_stage']}."
                    
                    try:
                        grouped_case = GroupedCase(
                            case_id=case["case_id"],
                            root_entity=case["root_entity"],
                            alert_count=case["alert_count"],
                            priority_score=case["highest_priority_score"],
                            attacker_stage=case["highest_attacker_stage"],
                            business_impact=case["highest_business_impact"],
                            plain_english_summary=summary
                        )
                        
                        queue_priority = max(1, int(100 - case["highest_priority_score"]))
                        self.logger.info(f"Emitting GroupedCase {case['case_id']} with priority score {case['highest_priority_score']:.1f}")
                        
                        await self.emit_event(
                            event_type="triage_case_ready",
                            payload=grouped_case.model_dump(mode='json'),
                            priority=queue_priority
                        )
                    except ValidationError as e:
                        self.logger.error(f"Failed to build GroupedCase: {e}")
            
            # Clean up memory and save state if things were flushed
            if matured_entities:
                for entity in matured_entities:
                    del self.active_cases[entity]
                self._save_state()