import asyncio
import json
import os
import uuid
import aiofiles
from typing import Dict, Any, List
from datetime import datetime, timezone

from pydantic import BaseModel, Field

from agents.base_agent import BaseAgent
from core.schemas import ThreatExposureAssessment

# Anti-Failure Rule 1: ZERO Outbound Network Traffic
# Anti-Failure Rule 4: No Hardcoding
CONFIG = {
    "threat_feeds_dir": os.getenv("THREAT_FEEDS_DIR", "f:\\Guard\\data\\threat_feeds"),
    "org_profile_path": os.getenv("ORG_PROFILE_PATH", "f:\\Guard\\data\\organization_profile.json"),
    "poll_interval": int(os.getenv("ORACLE_POLL_INTERVAL", "60"))
}

class OracleAgent(BaseAgent):
    """
    Agent C6 (Oracle): The Intelligence Brain.
    Ingests local threat intelligence feeds (STIX/TAXII JSON files), calculates
    relevance against the local organization profile, and actively triggers C4 Hunter.
    Zero outbound API calls permitted.
    """
    def __init__(self, orchestrator_queue: asyncio.PriorityQueue):
        super().__init__("C6_Oracle", orchestrator_queue)
        self.feeds_dir = CONFIG["threat_feeds_dir"]
        self.processed_files = set()
        
        # Ensure local directory exists
        os.makedirs(self.feeds_dir, exist_ok=True)
        
        # Anti-Failure Rule 2: The Relevance Engine
        self.org_profile = self._load_org_profile()

    def _load_org_profile(self) -> Dict[str, Any]:
        """Loads local organization profile for relevance calculation."""
        path = CONFIG["org_profile_path"]
        if os.path.exists(path):
            try:
                with open(path, "r") as f:
                    return json.load(f)
            except Exception as e:
                self.logger.error(f"Failed to load org profile from {path}: {e}")
                
        # Simulated fallback profile
        return {
            "industry": "financial",
            "region": "north_america",
            "tech_stack": ["Windows", "Active Directory", "OneNote", "AWS", "Microsoft 365"]
        }

    async def run(self):
        """Continuous background loop monitoring the local feeds directory."""
        self.logger.info("Active: Oracle Intelligence Brain polling for local STIX feeds.")
        while True:
            await self._poll_feeds_directory()
            await asyncio.sleep(CONFIG["poll_interval"])

    async def _poll_feeds_directory(self):
        """Scans the local directory for new JSON intelligence files."""
        if not os.path.exists(self.feeds_dir):
            return
            
        for filename in os.listdir(self.feeds_dir):
            if filename.endswith(".json") and filename not in self.processed_files:
                filepath = os.path.join(self.feeds_dir, filename)
                await self._ingest_file(filepath)
                self.processed_files.add(filename)

    async def _ingest_file(self, filepath: str):
        """
        Anti-Failure Rule 1: TTP Extraction over IOCs.
        Parses JSON to extract Actor profiles, TTPs, and IOCs.
        """
        self.logger.info(f"Ingesting intelligence feed: {filepath}")
        try:
            async with aiofiles.open(filepath, mode='r') as f:
                content = await f.read()
                data = json.loads(content)
                
                # We assume data is a list of actor profiles or single dict
                profiles = data if isinstance(data, list) else [data]
                
                for actor_profile in profiles:
                    await self._evaluate_actor_profile(actor_profile)
                    
        except json.JSONDecodeError as e:
            self.logger.error(f"Malformed JSON in {filepath}: {e}")
        except Exception as e:
            self.logger.error(f"Failed to ingest {filepath}: {e}")

    async def _evaluate_actor_profile(self, actor_profile: Dict[str, Any]):
        """Evaluates an actor profile and triggers necessary downstream agents."""
        actor_name = actor_profile.get("actor_name", "Unknown APT")
        iocs = actor_profile.get("iocs", [])
        
        # Calculate Relevance
        relevance_score, matched_attrs = self._calculate_threat_relevance(actor_profile)
        
        # Synthesize Exposure
        exposure_assessment = self._synthesize_exposure(actor_profile, relevance_score, matched_attrs)
        
        if relevance_score > 0.40:
            self.logger.warning(f"Intelligence synthesized for {actor_name}. Relevance: {relevance_score:.2f}")
            await self.emit_event(
                event_type="threat_exposure_assessment",
                payload=exposure_assessment.model_dump(mode='json'),
                priority=30
            )
        
        # Anti-Failure Rule 3: Precise Orchestrator Routing
        if relevance_score > 0.80 and iocs:
            self.logger.critical(f"High-relevance threat ({actor_name}) contains hard IOCs. Triggering C4 Hunter.")
            for ioc in iocs:
                # Format exactly to trigger the _execute_retrospective_hunt method via orchestrator mapping
                await self.emit_event(
                    event_type="new_threat_intel",
                    payload={
                        "ioc_value": ioc,
                        "actor_name": actor_name,
                        "source": "C6_Oracle"
                    },
                    priority=40
                )

    def _calculate_threat_relevance(self, actor_profile: Dict[str, Any]) -> tuple[float, List[str]]:
        """
        Anti-Failure Rule 2: The Relevance Engine.
        Mathematically scores actor targets against self.org_profile.
        """
        target_industries = [i.lower() for i in actor_profile.get("target_industries", [])]
        target_regions = [r.lower() for r in actor_profile.get("target_regions", [])]
        
        org_industry = self.org_profile.get("industry", "").lower()
        org_region = self.org_profile.get("region", "").lower()
        
        score = 0.0
        matched = []
        
        if org_industry and org_industry in target_industries:
            score += 0.60
            matched.append(f"Industry: {org_industry}")
            
        if org_region and org_region in target_regions:
            score += 0.40
            matched.append(f"Region: {org_region}")
            
        # Add slight fuzzy matching bump
        if score == 0.0 and ("global" in target_regions or "multiple" in target_industries):
            score += 0.20
            matched.append("Broad Targeting")
            
        return min(1.0, score), matched

    def _synthesize_exposure(self, actor_profile: Dict[str, Any], relevance_score: float, matched_attrs: List[str]) -> ThreatExposureAssessment:
        """Cross-references actor TTPs with org tech stack."""
        actor_name = actor_profile.get("actor_name", "Unknown APT")
        actor_ttps = actor_profile.get("ttps", [])
        org_stack = [t.lower() for t in self.org_profile.get("tech_stack", [])]
        
        vulnerable_stack = []
        actions = []
        
        for ttp in actor_ttps:
            ttp_lower = ttp.lower()
            for tech in org_stack:
                if tech in ttp_lower or ttp_lower in tech:
                    vulnerable_stack.append(tech)
                    actions.append(f"Review and harden {tech.title()} configurations against specific TTP: {ttp}")
        
        # Deduplicate
        vulnerable_stack = list(set(vulnerable_stack))
        actions = list(set(actions))
        
        if not actions and relevance_score > 0.5:
            actions.append("Increase general security monitoring and alert sensitivity.")
            
        return ThreatExposureAssessment(
            assessment_id=f"exp_{uuid.uuid4().hex[:8]}",
            actor_name=actor_name,
            relevance_score=float(relevance_score),
            matched_organizational_attributes=matched_attrs,
            vulnerable_tech_stack=vulnerable_stack,
            recommended_preemptive_actions=actions
        )

    async def process_event(self, event: Dict[str, Any]):
        """Oracle primarily emits, but can process manual intelligence sync triggers."""
        if event.get("action") == "force_intel_sync":
            self.logger.info("Forced intelligence sync triggered.")
            await self._poll_feeds_directory()
