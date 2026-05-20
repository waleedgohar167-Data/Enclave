import asyncio
import logging
import json
import os
from abc import ABC, abstractmethod
from typing import Dict, Any
from datetime import datetime, timezone

class BaseAgent(ABC):
    """
    Abstract Base Class for all ThresholdIQ agents.
    Enforces standardized asynchronous event processing, observability (heartbeats),
    and fault tolerance (Dead Letter Queues) optimized for local execution.
    """
    def __init__(self, name: str, orchestrator_queue: asyncio.PriorityQueue):
        self.name = name
        self.orchestrator_queue = orchestrator_queue
        self.logger = logging.getLogger(f"Agent-{self.name}")
        
        # Configure Dead Letter Queue path
        self.dlq_path = os.getenv("DLQ_PATH", "f:\\Guard\\data\\failed_events.jsonl")

    async def run(self):
        """
        Base run method. Starts the universal heartbeat.
        Subclasses overriding `run()` MUST call `await super().run()` to ensure observability.
        """
        self.logger.debug(f"Starting heartbeat for {self.name}")
        asyncio.create_task(self._heartbeat_loop())

    async def _heartbeat_loop(self):
        """
        Pillar 6: Observability. 
        Emits an ALIVE status every 30 seconds so the Orchestrator/UI knows the agent hasn't crashed.
        """
        while True:
            await self.emit_event(
                event_type="agent_heartbeat",
                payload={
                    "status": "ALIVE", 
                    "timestamp": datetime.now(timezone.utc).isoformat()
                },
                priority=100  # Lowest priority so it never blocks real security events
            )
            await asyncio.sleep(30)

    def _log_failed_event(self, event: Dict[str, Any], error: Exception):
        """
        Pillar 5 & 6: Dead Letter Queue (DLQ).
        If an agent crashes while processing an event, save the payload locally to prevent data loss.
        """
        os.makedirs(os.path.dirname(self.dlq_path), exist_ok=True)
        try:
            with open(self.dlq_path, "a") as f:
                failed_record = {
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "agent": self.name,
                    "error_message": str(error),
                    "original_event": event
                }
                f.write(json.dumps(failed_record) + "\n")
            self.logger.error(f"Event processing failed. Payload saved to DLQ: {self.dlq_path}")
        except Exception as dlq_error:
            self.logger.critical(f"FATAL: Could not write to DLQ: {dlq_error}")

    @abstractmethod
    async def process_event(self, event: Dict[str, Any]):
        """
        Abstract method to process an incoming event. Must be overridden by subclasses.
        
        Args:
            event (Dict[str, Any]): The event payload containing 'type', 'data', and 'priority'.
        """
        pass

    async def emit_event(self, event_type: str, payload: Dict[str, Any], priority: int = 50):
        """
        Pushes data back to the Orchestrator's central priority queue.
        Lower priority integer means higher execution priority (e.g., 1 is critical).
        
        Args:
            event_type (str): The classification of the event (e.g., 'threat_confirmed').
            payload (Dict[str, Any]): The actual data payload to be processed.
            priority (int): Priority level for the queue.
        """
        event = {
            "type": event_type,
            "data": payload,
            "priority": priority,
            "source": self.name
        }
        
        # We don't need to log routine heartbeats to the console to avoid spam
        if event_type != "agent_heartbeat":
            self.logger.debug(f"Emitting event: {event_type} (Priority: {priority})")
            
        # PriorityQueue elements must be tuples of (priority, item)
        await self.orchestrator_queue.put((priority, event))