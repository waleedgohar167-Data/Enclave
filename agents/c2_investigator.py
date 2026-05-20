import asyncio
import uuid
import os
from typing import Dict, Any, List
from datetime import datetime, timezone

from agents.base_agent import BaseAgent
from core.schemas import AttackNarrative, InvestigationDossier

CONFIG = {
    "auto_escalate_threshold": float(os.getenv("AUTO_ESCALATE_THRESHOLD", "0.75")),
    "local_threat_intel_path": os.getenv("LOCAL_THREAT_INTEL_PATH", "f:\\Guard\\data\\threat_intel.json")
}

class InvestigatorAgent(BaseAgent):
    """
    Agent C2 (Investigator): The Detective.
    Orchestrates high-speed local context gathering, assembles a comprehensive 
    evidence chain, and strictly enforces the Certainty Engine Rule before escalating.
    """
    def __init__(self, orchestrator_queue: asyncio.PriorityQueue):
        super().__init__("C2_Investigator", orchestrator_queue)
        self.threshold = CONFIG["auto_escalate_threshold"]

    async def process_event(self, event: Dict[str, Any]):
        """
        Ingests AttackNarrative payloads.
        Orchestrates parallel context gathering and builds the final Dossier.
        """
        event_type = event.get("type", "")
        if event_type != "attack_narrative":
            return
            
        payload = event.get("data", {})
        try:
            narrative = AttackNarrative(**payload)
        except Exception as e:
            self.logger.error(f"Failed to validate attack narrative: {e}")
            return

        self.logger.info(f"Investigating narrative {narrative.narrative_id} for entity {narrative.entity}...")

        # Orchestrate parallel context gathering
        hr_context, itsm_context, intel_context = await asyncio.gather(
            self._check_hr_context(narrative.entity),
            self._check_itsm_change_windows(narrative.entity),
            self._query_local_threat_intel(narrative.entity, narrative.anomalies)
        )

        evidence_chain = [f"Initial narrative formed with {len(narrative.anomalies)} anomalies."]
        
        # Scale narrative confidence (0-100) to our internal 0.0-1.0 probability score
        confidence_score = narrative.confidence_score / 100.0

        # Process HR Context
        if hr_context.get("is_traveling"):
            evidence_chain.append(f"HR Context: Entity is currently traveling in {hr_context.get('location', 'Unknown')}.")
            confidence_score += 0.15 # Suspicious travel
        elif hr_context.get("on_leave"):
            evidence_chain.append("HR Context: Entity is officially on leave. Activity highly anomalous.")
            confidence_score += 0.25

        # Process ITSM Context
        if itsm_context.get("active_change_window"):
            evidence_chain.append("ITSM Context: Entity is under an active approved change window.")
            confidence_score -= 0.40 # Likely a benign IT change
        else:
            evidence_chain.append("ITSM Context: No active change windows approved for this entity.")
            confidence_score += 0.10

        # Process Threat Intel Context
        if intel_context.get("matched_iocs"):
            evidence_chain.append(f"Threat Intel: Local IOC matches found: {intel_context['matched_iocs']}")
            confidence_score += 0.35

        # Bound confidence between 0 and 1
        confidence_score = max(0.0, min(1.0, confidence_score))

        # The Certainty Engine (Layer 3)
        missing_context = None
        if confidence_score < self.threshold:
            missing_context = self._determine_missing_context(hr_context, itsm_context, intel_context, narrative)
            summary = "Investigation paused. Insufficient certainty to automatically execute containment."
        else:
            summary = "High certainty attack confirmed. Executing autonomous response actions."

        # Actionable Output
        recommended_actions = [
            {"action": "isolate_host", "target": narrative.entity, "reason": "Stop lateral movement."},
            {"action": "disable_account", "target": narrative.entity, "reason": "Revoke compromised credentials."},
            {"action": "block_ip", "target": narrative.entity, "reason": "Sever C2 communications."}
        ]

        tactics = []
        for anomaly in narrative.anomalies:
            tactics.extend([k for k in anomaly.contributing_factors.keys()])
        tactics = list(set(tactics))

        kill_chain_position = "Unknown"
        if narrative.predicted_next_moves:
            kill_chain_position = narrative.predicted_next_moves[0].get("tactic", "Unknown")

        dossier = InvestigationDossier(
            dossier_id=f"dos_{uuid.uuid4().hex[:8]}",
            entity=narrative.entity,
            confidence_score=float(confidence_score),
            mitre_tactics=tactics,
            summary=summary,
            what_happened_plain_english=f"The entity {narrative.entity} exhibited a chain of anomalous behaviors that breached normal operational baselines.",
            evidence_chain=evidence_chain,
            recommended_actions=recommended_actions,
            missing_context_question=missing_context,
            kill_chain_position=kill_chain_position
        )

        self.logger.info(f"Dossier {dossier.dossier_id} finalized. Confidence: {confidence_score:.2f}")

        # Emit the dossier
        await self.emit_event(
            event_type="investigation_complete",
            payload=dossier.model_dump(mode='json'),
            priority=20
        )

    def _determine_missing_context(self, hr: Dict, itsm: Dict, intel: Dict, narrative: AttackNarrative) -> str:
        """Determines the exact missing piece of information needed to close the case."""
        if not hr.get("status_known"):
            return f"Is {narrative.entity} currently traveling or operating outside normal business hours?"
        if not itsm.get("status_known"):
            return f"Is there an undocumented emergency IT change occurring on {narrative.entity}?"
        return f"Can you verify if the recent high-volume data transfers from {narrative.entity} are business-justified?"

    async def _check_hr_context(self, entity: str) -> Dict[str, Any]:
        """Anti-Failure Rule 1: Local simulated HR query."""
        await asyncio.sleep(0.05) # Simulate local DB latency
        # In a real deployment, query a local SQLite mirror of Workday/BambooHR
        return {
            "status_known": True,
            "on_leave": False,
            "is_traveling": False,
            "location": "Local"
        }

    async def _check_itsm_change_windows(self, entity: str) -> Dict[str, Any]:
        """Anti-Failure Rule 1: Local simulated ITSM query."""
        await asyncio.sleep(0.08)
        return {
            "status_known": True,
            "active_change_window": False
        }

    async def _query_local_threat_intel(self, entity: str, anomalies: list) -> Dict[str, Any]:
        """Anti-Failure Rule 1: Local MISP/STIX query. Zero cloud traffic."""
        await asyncio.sleep(0.12)
        # Check against local json files updated by C6 Oracle
        return {
            "matched_iocs": []
        }
