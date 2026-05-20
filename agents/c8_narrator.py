import asyncio
import json
import os
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List

import httpx
from pydantic import BaseModel, Field

from agents.base_agent import BaseAgent
from core.schemas import CommunicationTask, CrisisCommunicationPackage, BoardReport

# Anti-Failure Rule 1: THE LLM MOAT
CONFIG = {
    "local_llm_url": os.getenv("LOCAL_LLM_URL", "http://localhost:11434/api/generate"),
    "llm_model_name": os.getenv("LLM_MODEL_NAME", "llama3")
}

# Strict Output Schema
class AudienceNarratives(BaseModel):
    Analyst: str = Field(..., description="Technical details, MITRE mappings, blast radius.")
    CISO: str = Field(..., description="Operational metrics, containment status, team requirements.")
    CEO: str = Field(..., description="Strategic risk, potential financial impact, business disruption.")
    Board: str = Field(..., description="Governance, compliance posture, overall ROI of security controls.")

class NarratorAgent(BaseAgent):
    """
    Agent C8 (Narrator): The Communicator.
    Translates raw JSON into 4 strict audience tiers using a 100% local LLM endpoint.
    Maintains zero outbound data connectivity.
    """
    def __init__(self, orchestrator_queue: asyncio.PriorityQueue):
        super().__init__("C8_Narrator", orchestrator_queue)
        self.llm_url = CONFIG["local_llm_url"]
        self.model = CONFIG["llm_model_name"]
        
        self.system_prompt = """
        You are the translation engine for an on-premise AI cybersecurity platform.
        Your task is to take the provided raw JSON telemetry and output a strict JSON object
        containing exactly 4 keys: "Analyst", "CISO", "CEO", and "Board".
        Do not output markdown code blocks, ONLY valid JSON.
        - Analyst: Provide deep technical details and MITRE mappings.
        - CISO: Provide operational metrics and containment status.
        - CEO: Provide strategic risk and financial/business impact.
        - Board: Provide high-level governance and compliance posture.
        """

    async def process_event(self, event: Dict[str, Any]):
        """Intercepts raw outputs to generate human-readable translations."""
        event_type = event.get("type", "")
        payload = event.get("data", {})

        # Target scheduled events
        if event_type == "generate_board_report":
            self.logger.info(f"Intercepted {event_type}. Generating math-driven Board Report...")
            posture_assessment = payload.get("posture_assessment", {})
            historical_stats = payload.get("historical_stats", {})
            report = await self._generate_board_report(posture_assessment, historical_stats)
            if report:
                await self.emit_event(
                    event_type="board_report_ready",
                    payload=report.model_dump(mode='json'),
                    priority=50
                )
            return

        # Target critical containment events
        if event_type == "containment_complete" and payload.get("severity", "").upper() == "CRITICAL":
            self.logger.info(f"Intercepted critical {event_type}. Generating 72-Hour Crisis Package...")
            dossier = payload.get("dossier", {})
            receipt = payload.get("receipt", {})
            pkg = await self._generate_crisis_package(dossier, receipt)
            if pkg:
                await self.emit_event(
                    event_type="crisis_package_ready",
                    payload=pkg.model_dump(mode='json'),
                    priority=10
                )
            return
        
        # We target key events from C1, C2, C6 for routine translation
        if event_type in ["investigation_complete", "normalized_anomaly", "ioc_overlap_detected"]:
            self.logger.info(f"Intercepted {event_type}. Initiating local LLM translation...")
            
            narratives = await self._translate_locally(payload)
            
            if narratives:
                # Emit the translated narratives for dashboarding/reporting
                await self.emit_event(
                    event_type="audience_narrative_ready",
                    payload=narratives.model_dump(mode='json'),
                    priority=40
                )

    async def _translate_locally(self, raw_data: Dict[str, Any]) -> Optional[AudienceNarratives]:
        """
        Executes an asynchronous POST request to the local Ollama instance.
        Implements graceful degradation if the local model is offline.
        """
        payload_str = json.dumps(raw_data)
        prompt = f"Raw Telemetry:\n{payload_str}\n\nOutput strict JSON matching the 4 required tiers."
        
        request_body = {
            "model": self.model,
            "prompt": f"{self.system_prompt}\n\n{prompt}",
            "stream": False,
            "format": "json"
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(self.llm_url, json=request_body)
                response.raise_for_status()
                
                response_data = response.json()
                llm_output = response_data.get("response", "{}")
                
                parsed_json = json.loads(llm_output)
                return AudienceNarratives(**parsed_json)
                
        except (httpx.RequestError, json.JSONDecodeError) as e:
            self.logger.error(f"Local LLM translation failed ({e}). Falling back to static templates.")
            return self._fallback_translation(raw_data)
            
    def _fallback_translation(self, raw_data: Dict[str, Any]) -> AudienceNarratives:
        """Graceful degradation logic ensuring the pipeline never fails."""
        entity = raw_data.get("entity", raw_data.get("ioc_value", "Unknown Asset"))
        
        return AudienceNarratives(
            Analyst=f"Fallback: Anomaly detected on {entity}. Raw data: {json.dumps(raw_data)[:100]}...",
            CISO=f"Fallback: Operational event recorded for {entity}. Containment checks required.",
            CEO=f"Fallback: Security event detected. Currently investigating potential business impact related to {entity}.",
            Board=f"Fallback: Routine security monitoring flagged an event. Controls are operating as intended."
        )

    async def _generate_crisis_package(self, dossier: Dict[str, Any], receipt: Dict[str, Any]) -> Optional[CrisisCommunicationPackage]:
        """
        Triggered only when a containment_complete event has a severity of CRITICAL.
        Uses the local LLM to draft specific communications, calculates the 72-hour deadline.
        """
        # The 72-Hour Clock
        now = datetime.utcnow()
        deadline = now + timedelta(hours=72)
        
        payload_str = json.dumps({"dossier": dossier, "receipt": receipt})
        prompt = (
            f"Critical Incident Containment Data:\n{payload_str}\n\n"
            f"Draft specific communications for Legal, the CEO, and the Regulator. "
            f"The regulatory deadline is 72 hours from now: {deadline.isoformat()}. "
            "Return a strict JSON object with keys 'legal_draft', 'ceo_draft', 'regulator_draft'. "
            "Provide a brief incident summary as 'incident_summary'. "
            "Decide if a legal hold is recommended as a boolean 'legal_hold_recommended'."
        )
        
        request_body = {
            "model": self.model,
            "prompt": f"{self.system_prompt}\n\n{prompt}",
            "stream": False,
            "format": "json"
        }

        try:
            async with httpx.AsyncClient(timeout=45.0) as client:
                response = await client.post(self.llm_url, json=request_body)
                response.raise_for_status()
                
                response_data = response.json()
                llm_output = response_data.get("response", "{}")
                
                parsed_json = json.loads(llm_output)
                
                tasks = [
                    CommunicationTask(audience="Legal", draft_content=parsed_json.get("legal_draft", "Fallback draft"), deadline_timestamp=deadline, status="DRAFT"),
                    CommunicationTask(audience="CEO", draft_content=parsed_json.get("ceo_draft", "Fallback draft"), deadline_timestamp=deadline, status="DRAFT"),
                    CommunicationTask(audience="Regulator", draft_content=parsed_json.get("regulator_draft", "Fallback draft"), deadline_timestamp=deadline, status="DRAFT")
                ]
                
                return CrisisCommunicationPackage(
                    incident_summary=parsed_json.get("incident_summary", "Critical Incident Contained."),
                    tasks=tasks,
                    legal_hold_recommended=parsed_json.get("legal_hold_recommended", True)
                )
                
        except (httpx.RequestError, json.JSONDecodeError) as e:
            self.logger.error(f"Crisis package generation failed ({e}).")
            return None

    async def _generate_board_report(self, posture_assessment: Dict[str, Any], historical_stats: Dict[str, Any]) -> Optional[BoardReport]:
        """
        Triggered by a generate_board_report event.
        Uses the 0-1000 score from Architect (C7) and the incident counts, using the LLM to write
        the Executive Summary while mathematically calculating ROI and financial risk avoided.
        """
        # Math-Driven ROI Calculation
        critical_incidents = historical_stats.get("critical_incidents_contained", 0)
        avg_incident_cost = historical_stats.get("average_incident_cost_usd", 0.0)
        total_security_spend = historical_stats.get("total_security_spend_usd", 1.0) # avoid division by zero
        
        financial_risk_avoided = float(critical_incidents * avg_incident_cost)
        estimated_roi = (financial_risk_avoided / total_security_spend) * 100.0 if total_security_spend > 0 else 0.0
        
        security_score = posture_assessment.get("total_score_0_to_1000", 0.0)
        trend_delta = posture_assessment.get("trend_delta", 0.0)
        quarter = historical_stats.get("quarter", "Current Quarter")
        
        prompt = (
            f"Posture Assessment:\n{json.dumps(posture_assessment)}\n"
            f"Historical Stats:\n{json.dumps(historical_stats)}\n\n"
            f"Write an 'executive_summary' for the Board of Directors highlighting the security score, "
            f"ROI ({estimated_roi:.2f}%), and risk avoided (${financial_risk_avoided:,.2f}). "
            "Return a strict JSON object with the key 'executive_summary'."
        )
        
        request_body = {
            "model": self.model,
            "prompt": f"{self.system_prompt}\n\n{prompt}",
            "stream": False,
            "format": "json"
        }

        try:
            async with httpx.AsyncClient(timeout=45.0) as client:
                response = await client.post(self.llm_url, json=request_body)
                response.raise_for_status()
                
                response_data = response.json()
                llm_output = response_data.get("response", "{}")
                
                parsed_json = json.loads(llm_output)
                
                return BoardReport(
                    quarter=quarter,
                    security_score=security_score,
                    trend_delta=trend_delta,
                    critical_incidents_contained=critical_incidents,
                    estimated_roi_percentage=estimated_roi,
                    financial_risk_avoided_usd=financial_risk_avoided,
                    executive_summary=parsed_json.get("executive_summary", "Security posture is stable.")
                )
                
        except (httpx.RequestError, json.JSONDecodeError) as e:
            self.logger.error(f"Board report generation failed ({e}).")
            return None
