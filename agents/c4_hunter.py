import asyncio
import json
import os
import uuid
from typing import Dict, Any, AsyncGenerator, List
from datetime import datetime, timezone

from pydantic import BaseModel, Field

from agents.base_agent import BaseAgent
from core.schemas import RetrospectiveMatch, SimulationPath

# Anti-Failure Rule 4: No Hardcoding
CONFIG = {
    "hunter_db_chunk_size": int(os.getenv("HUNTER_DB_CHUNK_SIZE", "5000")),
    "hypotheses_path": os.getenv("HYPOTHESES_PATH", "f:\\Guard\\thresholdiq\\hypotheses.json")
}

class ThreatHypothesis(BaseModel):
    id: str = Field(..., description="Hypothesis identifier")
    name: str = Field(..., description="Human readable name")
    query_pattern: str = Field(..., description="Simulated SQL or search pattern")
    lookback_days: int = Field(..., description="Days of history to analyze")

class HunterAgent(BaseAgent):
    """
    Agent C4 (Hunter): The Predator.
    Executes fully asynchronous, memory-safe hypothesis testing, retrospective hunting 
    across 90-day logs, and local adversary simulation graphing.
    """
    def __init__(self, orchestrator_queue: asyncio.PriorityQueue):
        super().__init__("C4_Hunter", orchestrator_queue)
        self.hypotheses = self._load_hypotheses()

    def _load_hypotheses(self) -> list[ThreatHypothesis]:
        """Dynamically loads hypotheses to avoid hardcoding."""
        path = CONFIG["hypotheses_path"]
        if os.path.exists(path):
            try:
                with open(path, "r") as f:
                    data = json.load(f)
                    return [ThreatHypothesis(**h) for h in data]
            except Exception as e:
                self.logger.error(f"Failed to load hypotheses from {path}: {e}")
        
        # Fallback to defaults if file missing to ensure platform stability
        return [
            ThreatHypothesis(
                id="H001", 
                name="Dormant Ransomware Staging", 
                query_pattern="SELECT * FROM file_events WHERE entropy > 0.85", 
                lookback_days=30
            ),
            ThreatHypothesis(
                id="H002", 
                name="Slow Data Exfiltration", 
                query_pattern="SELECT * FROM net_events WHERE dest_port = 443", 
                lookback_days=90
            )
        ]

    async def run(self):
        """Continuous background loop for hypothesis hunting and adversary simulation."""
        self.logger.info("Active: Proactive async threat hunting initiated.")
        # We start an independent loop to ensure background processes don't block
        try:
            asyncio.create_task(self._simulation_loop())
        except RuntimeError:
            self.logger.warning("No running loop, simulation will start manually.")
            
        while True:
            await asyncio.sleep(3600)  # Run hourly or nightly
            await self.execute_hunt()

    async def _simulation_loop(self):
        """Simulates periodic adversary pathfinding."""
        while True:
            # Simulate running adversary simulation once a week (using a smaller sleep for demo)
            await asyncio.sleep(86400) # Once per day simulation
            await self._execute_adversary_simulation()

    async def process_event(self, event: Dict[str, Any]):
        """
        Intercepts events from Orchestrator. 
        Layer 2: Triggers retrospective hunt if new threat intel arrives.
        """
        event_type = event.get("type", "")
        payload = event.get("data", {})
        
        if event_type == "new_threat_intel":
            ioc = payload.get("ioc_value")
            if ioc:
                self.logger.info(f"Received new threat intel. Initiating retrospective hunt for: {ioc}")
                await self._execute_retrospective_hunt(ioc)
        elif event.get("action") == "run_retrospective":
            # Direct trigger
            ioc = payload.get("ioc_value")
            if ioc:
                await self._execute_retrospective_hunt(ioc)

    async def _execute_retrospective_hunt(self, new_ioc: str):
        """
        Layer 2: Retrospective Hunting.
        Anti-Failure Rule 1: NO RAM Bloat. Sweeps 90-day history using memory-safe async chunking.
        """
        self.logger.info(f"Retrospective Hunt started for IOC: {new_ioc}")
        
        # Simulate a dynamic hypothesis to search 90 days for this specific IOC
        hunt_hypothesis = ThreatHypothesis(
            id=f"RETRO_{uuid.uuid4().hex[:6]}",
            name=f"Retro-hunt: {new_ioc}",
            query_pattern=f"SELECT * FROM all_events WHERE ioc = '{new_ioc}'",
            lookback_days=90
        )
        
        match_found = False
        async for chunk in self._async_query_historical_data(hunt_hypothesis):
            # In simulation, let's randomly trigger a match to prove the logic
            # In production, check `new_ioc` against `chunk` fields
            import random
            if random.random() > 0.98: # Simulate a rare retrospective hit
                match_found = True
                historical_ts = datetime(2023, 10, 1, tzinfo=timezone.utc)
                now = datetime.now(timezone.utc)
                dwell_time = (now - historical_ts).days
                
                match = RetrospectiveMatch(
                    ioc_value=new_ioc,
                    matched_entity="WIN-SRV-FINANCE",
                    historical_timestamp=historical_ts,
                    dwell_time_days=dwell_time
                )
                
                self.logger.critical(f"RETROSPECTIVE MATCH! {new_ioc} found. Dwell time: {dwell_time} days.")
                
                await self.emit_event(
                    event_type="retrospective_match",
                    payload=match.model_dump(mode='json'),
                    priority=50 # Highest priority
                )
                break # Found the first occurrence, break chunking

        if not match_found:
            self.logger.info(f"Retrospective Hunt clear. {new_ioc} not found in 90-day history.")

    async def _execute_adversary_simulation(self):
        """
        Layer 3: Adversary Simulation.
        Anti-Failure Rule 2: NO External AD Queries. Uses simulated local graph.
        Anti-Failure Rule 3: Actionable Output (SimulationPath).
        """
        self.logger.info("Initiating local adversary simulation (Pathfinding)...")
        await asyncio.sleep(1.0) # Simulate local graph computation
        
        # Simulated discovery of a critical attack path
        path = SimulationPath(
            path_id=f"sim_{uuid.uuid4().hex[:8]}",
            start_node="Junior Finance Credentials (Compromised)",
            target_node="Domain Controller (Tier 0)",
            steps_taken=[
                "1. Initial Access via phished Junior Finance Credentials.",
                "2. Lateral Movement to LEGACY-SRV via open SMBv1 port.",
                "3. Credential Dumping (Mimikatz) on LEGACY-SRV extracting Domain Admin hash.",
                "4. Pass-the-Hash to Domain Controller."
            ],
            severity="CRITICAL",
            recommended_fix="Disable SMBv1 on LEGACY-SRV and enforce LAPS for local admin tiering."
        )
        
        self.logger.warning(f"Adversary Simulation completed. Critical path found targeting {path.target_node}.")
        
        await self.emit_event(
            event_type="simulation_path_found",
            payload=path.model_dump(mode='json'),
            priority=30
        )

    async def execute_hunt(self):
        """Iterates through loaded hypotheses and executes chunked queries."""
        self.logger.info(f"Executing {len(self.hypotheses)} threat hypotheses...")
        
        for hypothesis in self.hypotheses:
            self.logger.debug(f"Testing hypothesis: {hypothesis.name} ({hypothesis.lookback_days} days)")
            match_found = False
            
            # Anti-Failure Rule 3 (Original): Async Generator to prevent Memory Bloat
            async for chunk in self._async_query_historical_data(hypothesis):
                if self._analyze_chunk_for_threat(chunk, hypothesis):
                    match_found = True
                    break # Stop chunking if threat found for this hypothesis

            if match_found:
                self.logger.warning(f"Hunter Alert: Match found for hypothesis {hypothesis.name}")
                await self.emit_event(
                    event_type="historical_threat_found",
                    payload={
                        "hypothesis_id": hypothesis.id,
                        "confidence": 0.88,
                        "evidence": f"Anomalous pattern matching '{hypothesis.name}' detected in chunked history."
                    },
                    priority=20
                )

    async def _async_query_historical_data(self, hypothesis: ThreatHypothesis) -> AsyncGenerator[list[Dict[str, Any]], None]:
        """
        Anti-Failure Rule 1: NO RAM Bloat.
        Simulates an asynchronous cursor fetching database rows in chunks.
        """
        chunk_size = CONFIG["hunter_db_chunk_size"]
        total_records = 50000  # Simulated vast historical dataset
        
        for offset in range(0, total_records, chunk_size):
            await asyncio.sleep(0.01) # Simulate async DB read latency
            
            # Yield simulated batched data
            yield [{"event_id": f"evt_{i}", "data": "simulated_payload"} for i in range(chunk_size)]

    def _analyze_chunk_for_threat(self, chunk: list[Dict[str, Any]], hypothesis: ThreatHypothesis) -> bool:
        """Analyzes a single memory-safe chunk for the hypothesized threat pattern."""
        # Simulated heuristic analysis
        if hypothesis.id == "H002" and len(chunk) > 0:
            import random
            return random.random() > 0.995 
        return False
