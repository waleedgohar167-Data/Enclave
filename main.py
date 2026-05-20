import logging
import time
from contextlib import asynccontextmanager
from typing import Dict, Any

from fastapi import FastAPI, BackgroundTasks, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from core.orchestrator import CentralOrchestrator

# Setup basic console logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# Global Orchestrator Instance
orchestrator = CentralOrchestrator()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Anti-Failure Rule 1: Lifespan Management.
    Instantiates and starts the orchestrator loops safely on startup,
    and gracefully shuts them down on exit.
    """
    logging.info("FastAPI starting up... Booting Central Orchestrator.")
    await orchestrator.start()
    
    yield
    
    logging.info("FastAPI shutting down... Initiating graceful orchestrator shutdown.")
    await orchestrator.shutdown()

app = FastAPI(
    title="ThresholdIQ API Gateway",
    description="The central API for the 12-agent ThresholdIQ cybersecurity platform.",
    version="1.0.0",
    lifespan=lifespan
)

# Allow CORS for future frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to your Next.js domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TelemetryPayload(BaseModel):
    source: str
    event_type: str
    data: Dict[str, Any]

@app.get("/")
async def health_check():
    """
    Root health check endpoint.
    Pillar 6: Observability dynamically exposed to the UI!
    """
    now = time.time()
    agent_status = {}
    active_count = 0
    
    # Check the heartbeat registry in the orchestrator
    for name, last_seen in orchestrator.agent_health.items():
        # If we heard from the agent in the last 90 seconds, it is online
        is_alive = (now - last_seen) < 90
        agent_status[name] = "Online" if is_alive else "Offline"
        if is_alive:
            active_count += 1

    return {
        "status": "ThresholdIQ Engine Active", 
        "total_active_agents": active_count,
        "agent_health": agent_status
    }

@app.post("/api/v1/telemetry", status_code=status.HTTP_202_ACCEPTED)
async def ingest_telemetry(payload: TelemetryPayload):
    """
    Anti-Failure Rule 2: Non-Blocking Ingestion.
    Pushes to PriorityQueue and immediately returns 202.
    """
    event = {
        "type": payload.event_type,
        "source": payload.source,
        "data": payload.data
    }
    # Priority 50 is a neutral default priority
    await orchestrator.queue.put((50, event))
    return {"detail": "Telemetry accepted for asynchronous processing"}

@app.get("/api/v1/cases")
async def get_triage_cases():
    """
    Anti-Failure Rule 3: Live State Access.
    Peeks into Agent C9's local memory to retrieve active grouped cases.
    (This works perfectly with our new C9 memory persistence!)
    """
    c9_agent = orchestrator.agents.get("C9_Alert_Optimizer")
    if not c9_agent:
        raise HTTPException(status_code=500, detail="C9 Alert Optimizer agent not found.")
        
    return {"active_cases": c9_agent.active_cases}

@app.post("/api/v1/reports/board", status_code=status.HTTP_202_ACCEPTED)
async def trigger_board_report():
    """
    Executive Trigger: Emits generate_board_report event to orchestrator.
    """
    event = {
        "type": "generate_board_report",
        "source": "api_gateway",
        "data": {}
    }
    await orchestrator.queue.put((10, event)) # High priority
    return {"detail": "Board report generation triggered"}

@app.get("/api/v1/posture", status_code=status.HTTP_202_ACCEPTED)
async def trigger_posture_scan():
    """
    Posture State Trigger: Emits trigger_posture_scan event.
    """
    event = {
        "type": "trigger_posture_scan",
        "source": "api_gateway",
        "data": {}
    }
    await orchestrator.queue.put((20, event))
    return {"detail": "Posture scan triggered"}