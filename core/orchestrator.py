import asyncio
import logging
import time
from typing import Dict, Any

from agents.c0_baseline import BaselineAgent
from agents.c1_sentinel import SentinelAgent
from agents.c2_investigator import InvestigatorAgent
from agents.c3_responder import ResponderAgent
from agents.c4_hunter import HunterAgent
from agents.c5_guardian import GuardianAgent
from agents.c6_oracle import OracleAgent
from agents.c7_architect import ArchitectAgent
from agents.c8_narrator import NarratorAgent
from agents.c9_alert_optimizer import AlertOptimizerAgent
from agents.c10_drift_monitor import DriftMonitorAgent
from agents.c11_audit_engine import AuditEngineAgent

class CentralOrchestrator:
    """
    The Central Nervous System of ThresholdIQ.
    Now with Active Health Monitoring, Dead-Letter awareness, and Tie-Breaker Queue logic.
    """
    def __init__(self):
        self.logger = logging.getLogger("CentralOrchestrator")
        self.logger.setLevel(logging.INFO)
        
        self.queue = asyncio.PriorityQueue()
        
        # Instantiate all 12 agents
        self.agents = {
            "C0_Baseline": BaselineAgent(self.queue),
            "C1_Sentinel": SentinelAgent(self.queue),
            "C2_Investigator": InvestigatorAgent(self.queue),
            "C3_Responder": ResponderAgent(self.queue),
            "C4_Hunter": HunterAgent(self.queue),
            "C5_Guardian": GuardianAgent(self.queue),
            "C6_Oracle": OracleAgent(self.queue),
            "C7_Architect": ArchitectAgent(self.queue),
            "C8_Narrator": NarratorAgent(self.queue),
            "C9_Alert_Optimizer": AlertOptimizerAgent(self.queue),
            "C10_Drift_Monitor": DriftMonitorAgent(self.queue),
            "C11_AuditEngine": AuditEngineAgent(self.queue)
        }
        
        # Health Registry: Tracks the last heartbeat timestamp
        self.agent_health: Dict[str, float] = {name: time.time() for name in self.agents}
        
        self._router_task = None
        self._monitor_task = None
        self._agent_tasks = []
        
    async def start(self):
        self.logger.info("Initializing ThresholdIQ Ecosystem...")
        
        for name, agent in self.agents.items():
            if hasattr(agent, 'run') and callable(getattr(agent, 'run')):
                self._agent_tasks.append(asyncio.create_task(agent.run()))
                
        self._router_task = asyncio.create_task(self._event_router())
        self._monitor_task = asyncio.create_task(self._health_monitor_loop())
        
        self.logger.info("Ecosystem online. Router and Health Monitor active.")

    async def _health_monitor_loop(self):
        """
        Pillar 6: Active Observability.
        Checks if any agent has missed a heartbeat for > 90 seconds.
        """
        while True:
            await asyncio.sleep(30)
            now = time.time()
            for name, last_seen in self.agent_health.items():
                if now - last_seen > 90:
                    self.logger.critical(f"HEALTH ALERT: Agent {name} has gone silent! Last heartbeat: {now - last_seen:.0f}s ago.")

    async def _event_router(self):
        while True:
            # Unpack all 3 items from the PriorityQueue tuple: priority, timestamp, event
            priority, _, event = await self.queue.get()
            
            event_type = event.get("type", "unknown")
            source = event.get("source", "unknown")

            # Update Health Registry if heartbeat received
            if event_type == "agent_heartbeat":
                self.agent_health[source] = time.time()
                self.queue.task_done()
                continue
                
            # Broadcast to agents
            broadcast_tasks = [self._safe_process(agent, event) for agent in self.agents.values()]
            await asyncio.gather(*broadcast_tasks)
            self.queue.task_done()

    async def _safe_process(self, agent, event: Dict[str, Any]):
        try:
            await agent.process_event(event)
        except Exception as e:
            # Pillar 5: Dead Letter Queue logging via BaseAgent
            self.logger.error(f"Agent {agent.name} crashed. Invoking DLQ logging.")
            if hasattr(agent, '_log_failed_event'):
                agent._log_failed_event(event, e)

    async def shutdown(self):
        self.logger.info("Graceful shutdown initiated.")
        if self._router_task: self._router_task.cancel()
        if self._monitor_task: self._monitor_task.cancel()
        for task in self._agent_tasks: task.cancel()