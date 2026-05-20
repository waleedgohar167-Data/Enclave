import asyncio
import uuid
import os
import json
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

import aiofiles
import httpx

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - [%(levelname)s] - %(message)s')
logger = logging.getLogger("EDRAdapter")

# Configuration
CONFIG = {
    "edr_drop_dir": os.getenv("EDR_DROP_DIR", "f:\\Guard\\data\\edr_alerts"),
    "api_endpoint": os.getenv("API_ENDPOINT", "http://localhost:8000/api/v1/ingest"),
    "poll_interval": float(os.getenv("POLL_INTERVAL", "2.0")),
    "batch_size": int(os.getenv("BATCH_SIZE", "50"))
}

async def poll_directory() -> List[str]:
    """
    Anti-Failure Rule 2: Non-blocking directory polling.
    Finds new JSON files in the EDR drop directory.
    """
    drop_dir = CONFIG["edr_drop_dir"]
    if not os.path.exists(drop_dir):
        os.makedirs(drop_dir, exist_ok=True)
        return []

    # Simple simulation of getting unprocessed files
    # In production, use aiofiles.os.listdir or Watchdog.
    # We will process files ending with .json and rename them to .json.processed
    files_to_process = []
    for filename in os.listdir(drop_dir):
        if filename.endswith(".json"):
            files_to_process.append(os.path.join(drop_dir, filename))
            
    return files_to_process

async def process_edr_file(filepath: str) -> List[Dict[str, Any]]:
    """
    Anti-Failure Rule 3: Fault Tolerance.
    Reads an EDR alert file asynchronously, maps it to the strict schema.
    """
    mapped_events = []
    try:
        async with aiofiles.open(filepath, mode='r') as f:
            content = await f.read()
            data = json.loads(content)
            
            # Simulate processing an array of EDR alerts in one file
            alerts = data if isinstance(data, list) else [data]
            
            for alert in alerts:
                # Anti-Failure Rule 4: Strict Schema Mapping
                event = {
                    "event_id": f"edr_{uuid.uuid4().hex[:8]}",
                    "timestamp": datetime.now(timezone.utc).isoformat(), # Fallback to now if missing
                    "source": "local_edr_forwarder",
                    "entity": alert.get("hostname", alert.get("user", "unknown_entity")),
                    "event_type": alert.get("behavior", alert.get("event_type", "edr_alert")),
                    "raw_data": {
                        "severity": alert.get("severity", "medium"),
                        "process_name": alert.get("process_name", "unknown.exe"),
                        "file_path": alert.get("file_path", "")
                    }
                }
                
                # Try to parse timestamp from EDR format if available
                raw_ts = alert.get("timestamp")
                if raw_ts:
                    try:
                        # Assuming ISO format from EDR
                        dt = datetime.fromisoformat(raw_ts.replace('Z', '+00:00'))
                        event["timestamp"] = dt.isoformat()
                    except ValueError:
                        pass # Keep fallback
                        
                mapped_events.append(event)
                
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse JSON from {filepath}: {e}")
    except Exception as e:
        logger.error(f"Unexpected error processing {filepath}: {e}")
        
    return mapped_events

async def send_batch(client: httpx.AsyncClient, batch: List[Dict[str, Any]]):
    """
    Sends mapped payloads to the Orchestrator. 
    Because the /ingest endpoint currently accepts single items in the design,
    we loop through the batch concurrently to emulate batched ingestion, 
    or we just post them sequentially very quickly.
    """
    # For Phase 14, main.py /ingest accepts a single RawTelemetryEvent.
    # To 'batch' deliver, we use asyncio.gather for concurrent non-blocking POSTs.
    tasks = []
    for payload in batch:
        tasks.append(client.post(CONFIG["api_endpoint"], json=payload, timeout=5.0))
        
    try:
        responses = await asyncio.gather(*tasks, return_exceptions=True)
        success_count = sum(1 for r in responses if isinstance(r, httpx.Response) and r.status_code == 202)
        logger.info(f"Successfully ingested {success_count}/{len(batch)} events from batch.")
    except Exception as e:
        logger.error(f"Batch delivery error: {e}")

async def main():
    logger.info(f"Starting EDR Adapter. Polling directory: {CONFIG['edr_drop_dir']}")
    
    async with httpx.AsyncClient(limits=httpx.Limits(max_connections=100)) as client:
        while True:
            files = await poll_directory()
            
            for filepath in files:
                mapped_events = await process_edr_file(filepath)
                
                if mapped_events:
                    # Batch delivery simulation
                    batch_size = CONFIG["batch_size"]
                    for i in range(0, len(mapped_events), batch_size):
                        batch = mapped_events[i:i + batch_size]
                        await send_batch(client, batch)
                        
                # Rename file to mark as processed
                try:
                    os.rename(filepath, filepath + ".processed")
                except OSError as e:
                    logger.error(f"Failed to mark file as processed: {e}")
                    
            await asyncio.sleep(CONFIG["poll_interval"])

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("EDR Adapter stopped.")
