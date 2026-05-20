import asyncio
import hashlib
import json
import time
import os
from typing import Dict, Any, List
from datetime import datetime, timezone

from agents.base_agent import BaseAgent
from core.schemas import AuditLedgerEntry, ComplianceGapFinding, EvidencePackage

# Anti-Failure Rule 4: No Hardcoding
CONFIG = {
    "ledger_file_path": os.getenv("LEDGER_FILE_PATH", "f:\\Guard\\thresholdiq\\immutable_ledger.jsonl")
}

class AuditEngineAgent(BaseAgent):
    """
    Agent C11 (Audit Engine): The Active Auditor.
    Implements cryptographic chaining to guarantee mathematically immutable audit trails,
    while running continuous gap detection and evidence package generation.
    """
    def __init__(self, orchestrator_queue: asyncio.PriorityQueue):
        super().__init__("C11_AuditEngine", orchestrator_queue)
        self.ledger_file = CONFIG["ledger_file_path"]
        self.last_hash = self._get_last_hash()
        
        self._gap_detection_task_started = False
        
    def _get_last_hash(self) -> str:
        """Retrieves the hash of the last block to maintain the chain."""
        if not os.path.exists(self.ledger_file):
            return hashlib.sha256(b"GENESIS_BLOCK").hexdigest()
            
        try:
            with open(self.ledger_file, 'rb') as f:
                try:
                    f.seek(-2, os.SEEK_END)
                    while f.read(1) != b'\n':
                        f.seek(-2, os.SEEK_CUR)
                except OSError:
                    f.seek(0)
                last_line = f.readline().decode()
                
            if last_line:
                last_record = json.loads(last_line)
                return last_record.get("record_hash", hashlib.sha256(b"GENESIS_BLOCK").hexdigest())
        except Exception as e:
            self.logger.error(f"Error reading ledger for last hash: {e}")
            
        return hashlib.sha256(b"GENESIS_BLOCK").hexdigest()

    async def process_event(self, event: Dict[str, Any]):
        """
        Records any significant system action to the ledger, and listens
        for generation requests.
        """
        if not self._gap_detection_task_started:
            self._gap_detection_task_started = True
            asyncio.create_task(self._continuous_gap_detection())
            
        event_type = event.get("type", "")
        payload = event.get("data", {})
        source = event.get("source", "unknown")
        
        if event_type == "generate_audit_package":
            framework = payload.get("framework", "ISO27001")
            await self._generate_evidence_package(framework)
            return

        # Record standard blocks (from C5 or general)
        await self._record_block(source, payload)

    async def _record_block(self, agent_source: str, data: Dict[str, Any]):
        """
        Anti-Failure Rule 1: Immutable Chain Preservation.
        Cryptographic Chaining logic intact.
        """
        timestamp = time.time()
        
        # Construct the block payload mapping to AuditLedgerEntry fields
        block_content = {
            "timestamp": timestamp,
            "agent_source": agent_source,
            "action_taken": data.get("action_type", data.get("action", "system_event")),
            "mapped_controls": data.get("mapped_controls", []),
            "outcome": data.get("outcome", "PENDING"),
            "reasoning_chain": data.get("reasoning", "Automated system execution."),
            "previous_hash": self.last_hash,
            "raw_data": data
        }
        
        block_str = json.dumps(block_content, sort_keys=True)
        current_hash = hashlib.sha256(block_str.encode('utf-8')).hexdigest()
        
        block_content["record_hash"] = current_hash
        
        self.logger.info(f"Mining block for {agent_source}. Previous: {self.last_hash[:8]}... Current: {current_hash[:8]}...")
        
        await self._append_to_ledger(json.dumps(block_content) + "\n")
        
        self.last_hash = current_hash

    async def _append_to_ledger(self, entry: str):
        """Asynchronously writes the block to disk."""
        await asyncio.sleep(0.01) # Avoid blocking
        try:
            with open(self.ledger_file, "a") as f:
                f.write(entry)
        except Exception as e:
            self.logger.critical(f"FATAL: Could not write to immutable ledger: {e}")

    async def _continuous_gap_detection(self):
        """
        Anti-Failure Rule 2: Continuous Gap Detection.
        Simulates checking the ledger for periodic controls.
        """
        while True:
            # Run check periodically (e.g. daily, set to 60s for simulation)
            await asyncio.sleep(60)
            
            # Simulated check: Looking for Quarterly Access Review (ISO 27001 A.9.2.6)
            review_found = False
            last_review_time = 0.0
            
            # Simple reverse read of the ledger to find the last review
            if os.path.exists(self.ledger_file):
                with open(self.ledger_file, 'r') as f:
                    for line in f:
                        if not line.strip(): continue
                        try:
                            record = json.loads(line)
                            controls = record.get("mapped_controls", [])
                            if "A.9.2.6" in controls or "Quarterly Access Review" in record.get("action_taken", ""):
                                review_found = True
                                last_review_time = max(last_review_time, float(record.get("timestamp", 0.0)))
                        except json.JSONDecodeError:
                            pass
            
            # Check if overdue (e.g., 90 days)
            days_since = (time.time() - last_review_time) / 86400.0 if review_found else 999.0
            
            if days_since > 90.0:
                self.logger.warning(f"Compliance Gap: Access Review overdue by {days_since:.1f} days.")
                gap_finding = ComplianceGapFinding(
                    framework="ISO 27001",
                    control_id="A.9.2.6",
                    description="Quarterly Access Review has not been performed.",
                    days_overdue=int(days_since),
                    remediation_task="Trigger an automated identity access review campaign via C5_Guardian."
                )
                
                await self.emit_event(
                    event_type="compliance_gap_detected",
                    payload=gap_finding.model_dump(mode='json'),
                    priority=15
                )

    async def _generate_evidence_package(self, framework: str):
        """
        Anti-Failure Rule 3: The 1-Click Auditor Export.
        Safely reads the .jsonl ledger, extracts blocks, outputs sanitized EvidencePackage.
        """
        self.logger.info(f"Generating evidence package for framework: {framework}")
        
        extracted_records = []
        
        if os.path.exists(self.ledger_file):
            with open(self.ledger_file, 'r') as f:
                for line in f:
                    if not line.strip(): continue
                    try:
                        record = json.loads(line)
                        # Filter by framework in mapped_controls or raw_data
                        controls = record.get("mapped_controls", [])
                        raw_data_str = json.dumps(record.get("raw_data", {}))
                        
                        if any(framework in ctrl for ctrl in controls) or framework in raw_data_str:
                            # Sanitize the record (e.g., stripping sensitive raw data for auditor)
                            sanitized_record = {
                                "timestamp": record.get("timestamp"),
                                "agent_source": record.get("agent_source"),
                                "action_taken": record.get("action_taken"),
                                "mapped_controls": controls,
                                "outcome": record.get("outcome"),
                                "record_hash": record.get("record_hash")
                            }
                            extracted_records.append(sanitized_record)
                    except json.JSONDecodeError:
                        pass
        
        package = EvidencePackage(
            framework=framework,
            generation_timestamp=datetime.utcnow(),
            total_records=len(extracted_records),
            records=extracted_records
        )
        
        await self.emit_event(
            event_type="audit_package_ready",
            payload=package.model_dump(mode='json'),
            priority=10
        )
        self.logger.info(f"Evidence package for {framework} generated with {len(extracted_records)} records.")
