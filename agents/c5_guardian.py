import asyncio
import json
import os
from typing import Dict, Any

from pydantic import BaseModel, Field

from agents.base_agent import BaseAgent

# Anti-Failure Rule 2: NO Cloud Frameworks
CONFIG = {
    "frameworks_path": os.getenv("FRAMEWORKS_PATH", "f:\\Guard\\thresholdiq\\frameworks.json"),
    "evidence_db_path": os.getenv("EVIDENCE_DB_PATH", "f:\\Guard\\thresholdiq\\compliance_evidence.jsonl")
}

class ComplianceEvidence(BaseModel):
    evidence_id: str = Field(..., description="Unique ID for the evidence record")
    framework: str = Field(..., description="Target framework (e.g., ISO 27001)")
    control_id: str = Field(..., description="Specific control (e.g., A.12.1.2)")
    action_reference: str = Field(..., description="Reference to the C3/C11 action")
    justification: str = Field(..., description="How the action satisfies the control")
    timestamp: float = Field(..., description="Unix timestamp of evidence generation")

class GuardianAgent(BaseAgent):
    """
    Agent C5 (Guardian): The Compliance Machine.
    Strictly on-premise compliance mapping. Ingests actions and maps them 
    to locally-stored regulatory frameworks to generate continuous audit evidence.
    """
    def __init__(self, orchestrator_queue: asyncio.PriorityQueue):
        super().__init__("C5_Guardian", orchestrator_queue)
        self.frameworks = self._load_frameworks()

    def _load_frameworks(self) -> Dict[str, Any]:
        """Dynamically loads compliance frameworks from a local file to prevent cloud fetching."""
        path = CONFIG["frameworks_path"]
        if os.path.exists(path):
            try:
                with open(path, "r") as f:
                    return json.load(f)
            except Exception as e:
                self.logger.error(f"Failed to load frameworks from {path}: {e}")
        
        # Fallback local dictionary if file is missing
        return {
            "ISO27001": {
                "containment_actions": "A.12.2.1",
                "audit_logs": "A.12.4.1"
            },
            "SOC2": {
                "containment_actions": "CC6.1",
                "audit_logs": "CC7.2"
            }
        }

    async def process_event(self, event: Dict[str, Any]):
        """Ingests actions from C3 (Responder) and C11 (Audit Engine) to build evidence."""
        event_type = event.get("type", "")
        payload = event.get("data", {})
        
        if event_type == "containment_complete":
            await self._map_evidence(
                action_ref=payload.get("action_id", "unknown_action"),
                action_type="containment_actions",
                details=payload.get("reasoning", "Containment executed.")
            )
        elif event_type == "audit_record_created":
            await self._map_evidence(
                action_ref=payload.get("record_hash", "unknown_hash"),
                action_type="audit_logs",
                details="Immutable cryptographic audit record generated."
            )

    async def _map_evidence(self, action_ref: str, action_type: str, details: str):
        """Maps an internal action to all applicable local frameworks."""
        import time
        import uuid
        
        evidence_records = []
        
        for framework_name, controls in self.frameworks.items():
            if action_type in controls:
                control_id = controls[action_type]
                
                evidence = ComplianceEvidence(
                    evidence_id=f"evd_{uuid.uuid4().hex[:8]}",
                    framework=framework_name,
                    control_id=control_id,
                    action_reference=action_ref,
                    justification=f"System mapped {action_type} directly to {control_id}. Details: {details}",
                    timestamp=time.time()
                )
                evidence_records.append(evidence)
                self.logger.info(f"Compliance mapped: {action_ref} -> {framework_name} ({control_id})")
                
        # Persist evidence asynchronously
        for record in evidence_records:
            await self._save_evidence(record)

    async def _save_evidence(self, evidence: ComplianceEvidence):
        """Asynchronously appends mapped evidence to a local evidence database."""
        await asyncio.sleep(0.01) # Non-blocking I/O simulation
        try:
            with open(CONFIG["evidence_db_path"], "a") as f:
                f.write(evidence.model_dump_json() + "\n")
        except Exception as e:
            self.logger.error(f"Failed to write compliance evidence: {e}")
