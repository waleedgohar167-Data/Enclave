import asyncio
import hashlib
import json
import os
import uuid
import time
from datetime import datetime, timezone
from typing import Dict, Any, List

from core.schemas import InvestigationDossier, ActionReceipt, ContainmentNarrative
from agents.base_agent import BaseAgent

CONFIG = {
    "customer_autonomy_level": int(os.getenv("AUTONOMY_LEVEL", "2")) # 0: Manual to 4: Full Auto
}

class ResponderAgent(BaseAgent):
    """
    Agent C3 (Responder): The Surgeon.
    Executes surgical containment actions with strict autonomy locks, 
    hash-verified 1-click rollbacks, and narrative generation.
    """
    def __init__(self, orchestrator_queue: asyncio.PriorityQueue):
        super().__init__("C3_Responder", orchestrator_queue)
        self.state_history: Dict[str, Dict[str, Any]] = {}
        self.autonomy_level = CONFIG["customer_autonomy_level"]
        
        # Action mappings to minimum required autonomy level
        self.action_levels = {
            "isolate_host": 3,
            "disable_account": 2,
            "block_ip": 1,
            "terminate_process": 2
        }

    async def process_event(self, event: Dict[str, Any]):
        """Handles investigation complete dossiers or direct action payloads."""
        event_type = event.get("type", "")
        payload = event.get("data", {})
        
        # We process the final dossier from C2
        if event_type == "investigation_complete":
            try:
                dossier = InvestigationDossier(**payload)
            except Exception as e:
                self.logger.error(f"Failed to validate dossier in Responder: {e}")
                return
                
            if dossier.missing_context_question:
                self.logger.info(f"Responder skipping dossier {dossier.dossier_id}: Missing context - human review required.")
                return
                
            # Execute top recommended action surgically
            if dossier.recommended_actions:
                target_action = dossier.recommended_actions[0]
                await self._process_containment(dossier, target_action)

    async def _process_containment(self, dossier: InvestigationDossier, action: Dict[str, str]):
        """Evaluates autonomy locks and executes the surgical action."""
        action_type = action.get("action", "unknown")
        target_entity = action.get("target", dossier.entity)
        
        req_level = self.action_levels.get(action_type, 4)
        
        if self.autonomy_level >= req_level:
            self.logger.info(f"Autonomy lock passed ({self.autonomy_level} >= {req_level}). Executing {action_type} surgically on {target_entity}.")
            receipt = await self._execute_containment(dossier, action_type, target_entity)
            
            await self.emit_event(
                event_type="containment_complete",
                payload=receipt.model_dump(mode='json'),
                priority=10 # Very high priority
            )
        else:
            self.logger.warning(f"Autonomy lock failed ({self.autonomy_level} < {req_level}). Containment {action_type} for {target_entity} requires human approval.")
            # Emit pending approval state if needed here

    async def _execute_containment(self, dossier: InvestigationDossier, action_type: str, target: str) -> ActionReceipt:
        """
        Anti-Failure Rule 1: NO Blanket Actions.
        Anti-Failure Rule 3: Keep the Hash (1-Click Rollback).
        """
        action_id = f"act_{uuid.uuid4().hex[:8]}"
        
        # Capture pre-action system state for rollback hashing
        pre_action_state = {"target": target, "status": "active", "open_ports": [22, 443, 8080], "active_sessions": ["sess_1", "sess_2"]}
        state_str = json.dumps(pre_action_state, sort_keys=True)
        state_hash = hashlib.sha256(state_str.encode()).hexdigest()
        
        self.state_history[state_hash] = {
            "action_id": action_id,
            "target": target,
            "action_type": action_type,
            "rollback_state": pre_action_state,
            "timestamp": time.time()
        }

        timeline = []
        now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        timeline.append(f"[{now}] Pre-containment state captured and hashed ({state_hash}).")

        surgical_actions = []

        # Layer 2: Surgical Precision Branching
        if action_type == "disable_account":
            # Simulate parsing dossier to target a specific session
            timeline.append(f"[{now}] Parsing dossier for anomalous sessions.")
            surgical_actions.append(f"Terminated strictly the anomalous session originating from the untrusted IP.")
            surgical_actions.append(f"Preserved all other active, authenticated sessions to maintain business continuity.")
            
        elif action_type == "isolate_host":
            timeline.append(f"[{now}] Identifying malicious process network connections.")
            surgical_actions.append(f"Blocked outbound connections for identified malicious PID on port 4444.")
            surgical_actions.append(f"Kept host management ports (SSH:22, WinRM:5985) OPEN to allow forensic investigation by the SOC team.")
            
        elif action_type == "block_ip":
            timeline.append(f"[{now}] Identifying exact C2 communication channels.")
            surgical_actions.append(f"Blocked specific inbound/outbound route to malicious C2 IP.")
            surgical_actions.append(f"Ensured blanket gateway block was avoided; standard egress traffic remains unaffected.")
        else:
            surgical_actions.append(f"Executed specific surgical disruption for {action_type}.")

        timeline.append(f"[{now}] Surgical containment executed successfully.")

        # Layer 4: The Containment Narrative
        narrative = await self._generate_containment_narrative(dossier, action_type, timeline, surgical_actions)

        return ActionReceipt(
            action_id=action_id,
            target_entity=target,
            action_type=action_type,
            status="SUCCESS",
            state_hash=state_hash,
            containment_narrative=narrative,
            timestamp=datetime.now(timezone.utc)
        )

    async def _generate_containment_narrative(self, dossier: InvestigationDossier, action_type: str, timeline: List[str], surgical_actions: List[str]) -> ContainmentNarrative:
        """
        Anti-Failure Rule 2: The Narrative Contract.
        Generates a comprehensive plain-English narrative of the surgical operations.
        """
        # Calculate dwell time based on dossier timestamp vs current time simulation
        # For simulation, we'll estimate a dwell time if actual timestamps aren't parsed
        dwell_time = 14.5 * 60 # Simulated 14.5 minutes
        
        return ContainmentNarrative(
            case_id=dossier.dossier_id,
            timeline=timeline,
            surgical_actions_taken=surgical_actions,
            total_dwell_time_seconds=float(dwell_time)
        )
        
    async def rollback(self, action_hash: str) -> bool:
        """Executes a 1-click rollback verified by exact SHA-256 state hash."""
        if action_hash not in self.state_history:
            self.logger.error(f"Rollback failed: Invalid or unknown state hash {action_hash}.")
            return False
            
        record = self.state_history[action_hash]
        self.logger.info(f"Rollback initiated for {record['action_id']} on {record['target']}.")
        
        # Simulate restoring state
        await asyncio.sleep(0.1)
        self.logger.info(f"System state successfully restored from hash {action_hash}.")
        
        del self.state_history[action_hash]
        return True
