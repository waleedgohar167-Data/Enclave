import asyncio
import os
import uuid
from typing import Dict, Any, List
from datetime import datetime, timezone

from pydantic import BaseModel, Field

from agents.base_agent import BaseAgent
from core.schemas import VulnerabilityReport, SecurityGap, PostureAssessment

# Anti-Failure Rule 4: No Hardcoding
CONFIG = {
    "scan_interval": int(os.getenv("ARCHITECT_SCAN_INTERVAL", "300"))
}

class ArchitectAgent(BaseAgent):
    """
    Agent C7 (Architect): The Posture Engineer.
    Continuously maps the local attack surface, computing board-ready Blast Radius Math
    with Category Sub-Scoring and Actionable ROI.
    """
    def __init__(self, orchestrator_queue: asyncio.PriorityQueue):
        super().__init__("C7_Architect", orchestrator_queue)
        
    async def run(self):
        """Continuous background loop for non-blocking attack surface mapping."""
        self.logger.info("Active: Fully async attack surface and Active Directory mapping initiated.")
        while True:
            await self._simulate_async_discovery()
            await asyncio.sleep(CONFIG["scan_interval"])

    async def _simulate_async_discovery(self):
        """
        Layer 1: Continuous Attack Surface Mapping.
        Simulates discovering rich assets via async non-blocking I/O.
        """
        self.logger.debug("Running async discovery sweep across Identity, Network, Endpoint, and Cloud assets...")
        await asyncio.sleep(1.0) # Simulate API/DB latency
        
        # Simulate discovering vulnerabilities with rich exposure context
        reports = [
            VulnerabilityReport(
                asset_id="S3-FIN-BUCKET",
                cvss_score=8.5,
                status="OPEN",
                asset_category="Cloud",
                asset_exposure="Public",
                exploit_available=True
            ),
            VulnerabilityReport(
                asset_id="LEGACY-DC-01",
                cvss_score=9.8,
                status="OPEN",
                asset_category="Identity",
                asset_exposure="Internal",
                exploit_available=True
            ),
            VulnerabilityReport(
                asset_id="USER-LAPTOP-55",
                cvss_score=7.0,
                status="OPEN",
                asset_category="Endpoint",
                asset_exposure="DMZ",
                exploit_available=False
            ),
            VulnerabilityReport(
                asset_id="CORE-ROUTER",
                cvss_score=10.0,
                status="OPEN",
                asset_category="Network",
                asset_exposure="Public",
                exploit_available=True
            )
        ]
        
        await self._calculate_posture(reports)

    async def _calculate_posture(self, reports: List[VulnerabilityReport]):
        """
        Layer 2: Blast Radius Math & Category Sub-Scoring.
        """
        # Initialize category scores out of 100.0
        category_scores = {
            "Identity": 100.0,
            "Network": 100.0,
            "Endpoint": 100.0,
            "Cloud": 100.0
        }
        
        # We will track penalties to generate SecurityGaps later
        penalties = []
        
        for report in reports:
            if report.status == "PATCHED":
                continue
                
            # Anti-Failure Rule 1: The Blast Radius Math
            base_penalty = report.cvss_score
            
            # Exposure Multiplier
            if report.asset_exposure.upper() == "PUBLIC":
                exposure_mult = 2.0
            elif report.asset_exposure.upper() == "DMZ":
                exposure_mult = 1.0
            else:
                exposure_mult = 0.5 # Internal
                
            # Exploit Multiplier
            exploit_mult = 1.5 if report.exploit_available else 1.0
            
            actual_penalty = base_penalty * exposure_mult * exploit_mult
            
            # Apply penalty to the specific category sub-score
            cat = report.asset_category
            if cat in category_scores:
                category_scores[cat] -= actual_penalty
                # Floor at 0.0
                category_scores[cat] = max(0.0, category_scores[cat])
                
            penalties.append({
                "report": report,
                "penalty_value": actual_penalty
            })
            
        # Total score out of 1000: Each of the 4 categories contributes 25% (i.e. up to 250 points each)
        # We do 2.5 * category_score
        total_score = sum(max(0.0, score * 2.5) for score in category_scores.values())
        
        # Identity Top Gaps
        top_gaps = self._identify_top_gaps(penalties)
        
        assessment = PostureAssessment(
            assessment_id=f"posture_{uuid.uuid4().hex[:8]}",
            total_score_0_to_1000=float(total_score),
            category_scores={k: float(v) for k, v in category_scores.items()},
            top_gaps=top_gaps,
            peer_percentile="Top 25%" if total_score > 750 else "Bottom 50%"
        )
        
        self.logger.warning(f"Posture Assessment Complete. Total Score: {total_score:.1f}/1000. Found {len(top_gaps)} actionable gaps.")
        
        await self.emit_event(
            event_type="posture_assessment_completed",
            payload=assessment.model_dump(mode='json'),
            priority=20
        )

    def _identify_top_gaps(self, penalties: List[Dict[str, Any]]) -> List[SecurityGap]:
        """
        Layer 3: Board-Ready Output & Actionable ROI.
        """
        # Sort by highest penalty (highest ROI to fix)
        penalties.sort(key=lambda x: x["penalty_value"], reverse=True)
        
        gaps = []
        for item in penalties[:3]: # Take top 3 highest impact
            report = item["report"]
            penalty = item["penalty_value"]
            
            # Translate category penalty (out of 100) to global points (out of 1000)
            # Since each category point is worth 2.5 global points
            global_points_gained = penalty * 2.5
            
            gap = SecurityGap(
                gap_id=f"gap_{uuid.uuid4().hex[:6]}",
                title=f"Critical Exposure on {report.asset_exposure} {report.asset_category} Asset ({report.asset_id})",
                point_value=float(global_points_gained),
                recommended_action=f"Patch CVSS {report.cvss_score:.1f} vulnerability or isolate {report.asset_id} from public access."
            )
            gaps.append(gap)
            
        return gaps

    async def process_event(self, event: Dict[str, Any]):
        """Processes signals to re-scan or patch application."""
        if event.get("action") == "trigger_posture_scan":
            self.logger.info("Manual posture scan triggered.")
            await self._simulate_async_discovery()
