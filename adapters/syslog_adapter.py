import asyncio
import uuid
import os
import re
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional

import aiofiles
import httpx

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - [%(levelname)s] - %(message)s')
logger = logging.getLogger("SyslogAdapter")

# Configuration (Anti-Failure Rule 1: Local only)
CONFIG = {
    "syslog_file_path": os.getenv("SYSLOG_FILE_PATH", "f:\\Guard\\data\\syslog.log"),
    "api_endpoint": os.getenv("API_ENDPOINT", "http://localhost:8000/api/v1/ingest"),
    "poll_interval": float(os.getenv("POLL_INTERVAL", "0.5"))
}

# Example regex for a syslog line: "May 18 03:00:00 hostname sshd[1234]: Failed password for user from 192.168.1.5"
# We will use a simplified heuristic matcher for demonstration.
SYSLOG_PATTERN = re.compile(r'(?P<timestamp>\w{3}\s+\d{1,2}\s\d{2}:\d{2}:\d{2})\s+(?P<host>\S+)\s+(?P<process>[^:]+):\s+(?P<message>.*)')

async def tail_file(filepath: str):
    """
    Anti-Failure Rule 2: NO Blocking File Reads.
    Asynchronously tails a local log file, yielding new lines as they are written.
    """
    if not os.path.exists(filepath):
        # Create dummy file if missing for local testing
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        open(filepath, 'a').close()
        
    async with aiofiles.open(filepath, mode='r') as f:
        # Seek to the end to only read new logs
        await f.seek(0, os.SEEK_END)
        while True:
            line = await f.readline()
            if not line:
                await asyncio.sleep(CONFIG["poll_interval"])
                continue
            yield line

def parse_syslog_line(line: str) -> Optional[Dict[str, Any]]:
    """
    Extracts relevant fields from a raw syslog line.
    Anti-Failure Rule 3: Fault Tolerance (returns None on failure).
    """
    try:
        match = SYSLOG_PATTERN.match(line)
        if not match:
            return None
            
        data = match.groupdict()
        message = data.get("message", "").lower()
        
        # Heuristic mapping
        event_type = "unknown_syslog"
        source_ip = "unknown"
        
        if "failed password" in message or "authentication failure" in message:
            event_type = "login_failed"
        elif "accepted password" in message:
            event_type = "login_success"
            
        # Extract IP via regex if present
        ip_match = re.search(r'\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b', message)
        if ip_match:
            source_ip = ip_match.group(0)
            
        # Standardize timestamp (assuming current year for standard syslog format)
        current_year = datetime.now(timezone.utc).year
        raw_ts = f"{current_year} {data.get('timestamp')}"
        parsed_time = datetime.strptime(raw_ts, "%Y %b %d %H:%M:%S").replace(tzinfo=timezone.utc)
        
        # Anti-Failure Rule 4: Strict Schema Mapping
        return {
            "event_id": f"syslog_{uuid.uuid4().hex[:8]}",
            "timestamp": parsed_time.isoformat(),
            "source": "local_syslog",
            "entity": data.get("host", "unknown_host"),
            "event_type": event_type,
            "source_ip": source_ip,
            "raw_data": {"original_message": message, "process": data.get("process")}
        }
    except Exception as e:
        logger.debug(f"Failed to parse syslog line, skipping. Error: {e}")
        return None

async def send_to_orchestrator(client: httpx.AsyncClient, payload: Dict[str, Any]):
    """Asynchronously POSTs mapped telemetry to the main API entrypoint."""
    try:
        response = await client.post(CONFIG["api_endpoint"], json=payload, timeout=5.0)
        response.raise_for_status()
    except httpx.RequestError as e:
        logger.error(f"Connection error dropping payload to Orchestrator: {e}")
    except httpx.HTTPStatusError as e:
        logger.error(f"API rejected payload with status {e.response.status_code}: {e}")

async def main():
    logger.info(f"Starting Syslog Adapter. Tailing: {CONFIG['syslog_file_path']}")
    
    # Reusable async HTTP client connection pool
    async with httpx.AsyncClient() as client:
        async for line in tail_file(CONFIG["syslog_file_path"]):
            payload = parse_syslog_line(line.strip())
            
            if payload:
                await send_to_orchestrator(client, payload)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Syslog Adapter stopped.")
