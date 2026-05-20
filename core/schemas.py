"""
ThresholdIQ Core Schema Registry.
Defines unified data models and structural type validation contracts for 
Agents C0 through C11 using rigid Pydantic configurations.
"""

from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
from datetime import datetime

# --- C0: Baseline Agent Schemas ---

class BaselineProfile(BaseModel):
    entity_id: str = Field(..., description="Unique ID of the observed asset or identity")
    entity_type: str = Field(..., description="Entity category: users | devices | network_segments | service_accounts")
    first_seen: datetime = Field(..., description="UTC timestamp tracking first presence log")
    baseline_confidence: float = Field(0.0, description="Maturity curve calibration percentage (0.0 - 100.0)")
    behavioral_metrics: Dict[str, Any] = Field(default_factory=dict, description="Internal EWMA mean and variance vectors")

class ScoredEvent(BaseModel):
    event_id: str = Field(..., description="Unique tracking identifier for the processed event")
    entity_id: str = Field(..., description="The subject entity reference code")
    raw_event_type: str = Field(..., description="Underlying telemetry event name")
    anomaly_score_0_to_100: float = Field(..., description="Computed statistical distance from normal baseline")
    deviation_context: str = Field(..., description="Plain-text translation of standard deviation parameters")


# --- C1: Sentinel Agent Schemas ---

class RawTelemetryEvent(BaseModel):
    entity: str = Field(..., description="Identifier for target asset or account")
    event_type: str = Field(..., description="Shorthand event fingerprint classification")
    timestamp: datetime = Field(..., description="Telemetry registration time block")
    data_volume_bytes: Optional[float] = Field(None, description="Network or file payload transmission size in bytes")
    raw_data: Dict[str, Any] = Field(default_factory=dict, description="Arbitrary structure block payload parameters")

class NormalizedAnomaly(BaseModel):
    anomaly_id: str = Field(..., description="Cryptographic tracking string identifier")
    entity: str = Field(..., description="Entity flag mapping indicator")
    event_type: str = Field(..., description="Classification category label")
    z_score: float = Field(..., description="Calculated metric coordinate index scale")
    frequency: float = Field(..., description="Current count measurement tracking vector")
    baseline_mean: float = Field(..., description="Established arithmetic model tracking average")
    contributing_factors: Dict[str, str] = Field(..., description="Faceted deviation tracking weights mapping")
    timestamp: datetime = Field(..., description="Generation event time grouping")

class AttackNarrative(BaseModel):
    narrative_id: str = Field(..., description="Active unified timeline log sequence string")
    entity: str = Field(..., description="Primary identity tag node tracking trace")
    anomalies: List[NormalizedAnomaly] = Field(..., description="Fused composite chain list matrix array items")
    start_time: datetime = Field(..., description="Earliest initial anomaly generation trigger capture block")
    last_updated: datetime = Field(..., description="Latest correlation state execution processing log update")
    confidence_score: float = Field(..., description="Unified risk state factor score threshold limit indicator")
    summary: str = Field(..., description="Plain English trace translation data block log summary description")
    predicted_next_moves: List[Dict[str, Any]] = Field(default_factory=list, description="Markov transition model array output data matrix keys")


# --- C2: Investigator Agent Schemas ---

class InvestigationDossier(BaseModel):
    dossier_id: str = Field(..., description="Unique investigative file code identifier string")
    entity: str = Field(..., description="Primary node identifier subject parameter tracking tag")
    confidence_score: float = Field(..., description="Aggregated evidentiary probability trace validation ratio scale")
    mitre_tactics: List[str] = Field(..., description="Extracted matched MITRE ATT&CK tactical classifications catalogued")
    summary: str = Field(..., description="Evidentiary high-level overview string statement matrix log entry")
    what_happened_plain_english: str = Field(..., description="Executive operational timeline narrative synthesis block details")
    evidence_chain: List[str] = Field(..., description="Sequential investigation contextual baseline metrics data logs tracking list")
    recommended_actions: List[Dict[str, str]] = Field(..., description="Targeted prioritized surgical disruption remediation sequence tasks array")
    missing_context_question: Optional[str] = Field(None, description="Elicited high-priority human verification query parameters tracking string")
    kill_chain_position: str = Field(..., description="Calculated position within the active attack framework sequence model node")


# --- C3: Responder Agent Schemas ---

class ContainmentNarrative(BaseModel):
    case_id: str = Field(..., description="Reference target investigation case tracking key match string")
    timeline: List[str] = Field(..., description="Surgical automation chronological operation step metadata logs list tracking items")
    surgical_actions_taken: List[str] = Field(..., description="Specific isolation tracking commands applied parameters logs array list")
    total_dwell_time_seconds: float = Field(..., description="Calculated duration between earliest breach presence trace and action completion")

class ActionReceipt(BaseModel):
    action_id: str = Field(..., description="Unique cryptographic execution system reference code signature tracking id")
    target_entity: str = Field(..., description="Subject identity endpoint targeted by deployment automation")
    action_type: str = Field(..., description="Specific isolation script routine invoked string label identification name")
    status: str = Field(..., description="Execution response confirmation validation tracking trace state marker")
    state_hash: str = Field(..., description="Pre-containment snapshot integrity verification string fingerprint code block")
    containment_narrative: ContainmentNarrative = Field(..., description="Detailed response synthesis documentation block log structure tracking data")
    timestamp: datetime = Field(..., description="Execution completion target timezone baseline registration log block marker")


# --- C4: Hunter Agent Schemas ---

class ThreatHypothesis(BaseModel):
    id: str = Field(..., description="Proactive exploration logic identification code indexing record locator")
    name: str = Field(..., description="Human readable structural trace hunt project scenario description context tracking name")
    query_pattern: str = Field(..., description="Structured baseline exploration routine string statement query parameter path template")
    lookback_days: int = Field(..., description="Historical timeline window depth indicator parameter size quantity block limit")

class RetrospectiveMatch(BaseModel):
    ioc_value: str = Field(..., description="Target historical indicator parameter match trace item tracking indicator value")
    matched_entity: str = Field(..., description="Asset node mapping reference code match location track instance tag locator")
    historical_timestamp: datetime = Field(..., description="Original entry registration event date structure tracking record block marker")
    dwell_time_days: int = Field(..., description="Calculated lifespan presence value quantity of identified threat indicator inside system context logs")

class SimulationPath(BaseModel):
    path_id: str = Field(..., description="Unique graph trajectory mapping identifier tracing threat scenario path layout")
    start_node: str = Field(..., description="Identified lateral movement entry node system component tag indicator placeholder")
    target_node: str = Field(..., description="High-value target mission asset terminal destination zone category marker map code")
    steps_taken: List[str] = Field(..., description="Exploitation path step sequencing vector graph links traces tracking logs item text")
    severity: str = Field(..., description="Risk tier valuation metric matrix classification outcome state designation code")
    recommended_fix: str = Field(..., description="Target architectural configuration change directive remediation action instruction code block")


# --- C5: Guardian Agent Schemas ---

class FrameworkControl(BaseModel):
    framework_name: str = Field(..., description="Regulatory framework identification label tracking index name code mapping system")
    control_id: str = Field(..., description="Specific directive indexing code compliance check location reference section point")
    description: str = Field(..., description="Abstract statement core directive compliance objective validation rule baseline text requirement")

class ComplianceEvidence(BaseModel):
    evidence_id: str = Field(..., description="Unique non-repudiation audit entry trace key block sequence index identity indicator")
    source_action_id: str = Field(..., description="Target response asset transaction reference log connection identifier verification map receipt")
    target_entity: str = Field(..., description="Target system node identity asset parameter string reference tracker verification tag description")
    mapped_controls: List[FrameworkControl] = Field(default_factory=list, description="Associated regulatory standard requirements fulfilled by transaction event logs tracking matrix list")
    evidence_narrative: str = Field(..., description="Auditor-ready declaration plain text verification data narrative record block summary info statement")
    timestamp: str = Field(..., description="ISO generation tracking date timestamp log registration trace string index")


# --- C6: Oracle Agent Schemas ---

class ThreatExposureAssessment(BaseModel):
    assessment_id: str = Field(..., description="Unique structural exposure tracking index code record marker identity signature")
    actor_name: str = Field(..., description="Identified threat actor intelligence source tracking designation profiling indexing label name")
    relevance_score: float = Field(..., description="Calculated environmental targeting profile intersection proximity ratio math scale measurement")
    matched_organizational_attributes: List[str] = Field(default_factory=list, description="Target vertical infrastructure overlap features matching system parameters tracking list metrics keys")
    vulnerable_tech_stack: List[str] = Field(default_factory=list, description="Identified technology component intersections vulnerable to threat profile TTP execution metrics tracking arrays")
    recommended_preemptive_actions: List[str] = Field(default_factory=list, description="Prioritized threat intelligence hardening vector directives sequence action tasks checklist text")
    iocs: List[str] = Field(default_factory=list, description="Associated structural threat intelligence telemetry payload values matching indicators parameters array")


# --- C7: Architect Agent Schemas ---

class VulnerabilityReport(BaseModel):
    asset_id: str = Field(..., description="Unique asset system hardware tracking registry code network entity reference tag locator")
    cvss_score: float = Field(..., description="Standard base vulnerability technical severity measurement scoring evaluation scale indexing ratio")
    status: str = Field(..., description="Active asset remediation lifecycle state tracking tracker control assignment category marker")
    asset_category: str = Field(..., description="Infrastructure system domain location type structural tier tracking block designation name")
    asset_exposure: str = Field(..., description="Network network topology visibility boundary placement tracking access status description scale level")
    exploit_available: bool = Field(..., description="Public validation track verifying existence of exploit code inside target ecosystem space environment")

class SecurityGap(BaseModel):
    gap_id: str = Field(..., description="Unique vulnerability risk optimization portfolio indexing checklist record tracking code key")
    title: str = Field(..., description="Board-level plain language risk summary statement classification description category header")
    point_value: float = Field(..., description="Calculated posture score optimization contribution capacity scaling points metric value unit")
    recommended_action: str = Field(..., description="Target platform engineering remediation structural hardening action directive guidelines text specification")

class PostureAssessment(BaseModel):
    assessment_id: str = Field(..., description="Unique score tracking block transaction identifier verification tag signature metric")
    total_score_0_to_1000: float = Field(..., description="Unified risk infrastructure condition score scalar measurement target metric valuation index")
    category_scores: Dict[str, float] = Field(..., description="Sub-domain posture status compliance evaluation vector components mapped parameters metrics data tracking")
    top_gaps: List[SecurityGap] = Field(default_factory=list, description="Prioritized ROI score contribution risk engineering checklist items array list database records tracker")
    peer_percentile: str = Field(..., description="Industry segment benchmark alignment analysis performance evaluation category bracket index marker string")
    trend_delta: Optional[str] = Field(None, description="Historical configuration tracking deviation trajectory shift value rate notation indicator sign text")


# --- C8: Narrator Agent Schemas ---

class AudienceNarratives(BaseModel):
    Analyst: str = Field(..., description="Technical deep trace MITRE mapping telemetry summary text documentation block log raw logs profile")
    CISO: str = Field(..., description="Operational response efficiency metrics resource prioritization statement summary narrative log text details")
    CEO: str = Field(..., description="Strategic business disruption threat financial risk calculation exposure plain language statement context report")
    Board: str = Field(..., description="Governance posture compliance framework alignment performance verification return valuation plain language report block summary")

class CommunicationTask(BaseModel):
    audience: str = Field(..., description="Target briefing stakeholder category assignment tier level mapping description parameter tag")
    draft_content: str = Field(..., description="Local generative model output briefing text statement layout data drafting report content text")
    deadline_timestamp: datetime = Field(..., description="Calculated regulatory compliance expiration clock deadline tracking registration date tracking block")
    status: str = Field(..., description="Briefing lifecycle review stage workflow assignment track management validation check state marker code")

class CrisisCommunicationPackage(BaseModel):
    incident_summary: str = Field(..., description="High level crisis transaction lifecycle documentation profile overview summary history log context details")
    tasks: List[CommunicationTask] = Field(default_factory=list, description="Targeted dynamic corporate notifications tracking workflows task arrays execution lists items data elements")
    legal_hold_recommended: bool = Field(..., description="Privilege execution tracking indicator confirming deployment mandate authorization constraint state marker tag")

class BoardReport(BaseModel):
    quarter: str = Field(..., description="Active reporting cycle timeline identifier window tracking scale code header string")
    security_score: float = Field(..., description="Current corporate profile status valuation benchmark alignment score parameter metric value indexing calculation")
    trend_delta: str = Field(..., description="Performance trajectory shift metrics rate notation label statement tracking direction trend icon text")
    critical_incidents_contained: int = Field(..., description="Total quantitative threat isolation execution events successfully recorded tracking performance value index quantity")
    estimated_roi_percentage: float = Field(..., description="Calculated financial return infrastructure efficiency deployment optimization percentage tracking index equation ratio scale")
    financial_risk_avoided_usd: float = Field(..., description="Calculated capital resource protection valuation savings translation matrix measurement dollars value size index parameter")
    executive_summary: str = Field(..., description="Non-technical boardroom strategic execution synthesis declaration statement report summary overview text outline details")


# --- C9: Alert Optimizer Agent Schemas ---

class GroupedCase(BaseModel):
    case_id: str = Field(..., description="Unique structural correlation tracking reference code identifier tracking index folder name tag")
    root_entity: str = Field(..., description="Primary node asset context reference trace target mapping parameter token key locator string")
    alert_count: int = Field(..., description="Total input telemetry firehose events compressed into single unified workspace domain tracking quantity measurement")
    priority_score: float = Field(..., description="Calculated composite triage ranking valuation index level tracking scale mathematical factor coordinate value")
    attacker_stage: float = Field(..., description="Mapped cyber killchain lifecycle severity progression weight score multiplier vector index location measurement scale")
    business_impact: float = Field(..., description="Asset inventory data sensitivity evaluation damage calculation risk exposure scalar value scale measurement index")
    plain_english_summary: str = Field(..., description="One paragraph analyst overview stating situation root cause clear triage instruction text description block outlines")

class OptimizationResult(BaseModel):
    rule_id: str = Field(..., description="Target alert rule code identification locator segment verification tracking index name string")
    old_threshold: float = Field(..., description="Previous triggering trigger baseline limit index parameter value metric sizing coordinate context")
    new_threshold: float = Field(..., description="Optimized algorithmic detection balance cutoff value point parameters data calibration index level scale marker")
    before_metrics: Dict[str, float] = Field(..., description="Historical baseline noise statistics ratio parameters profiles mapping tracking data points logs vector arrays")
    after_metrics: Dict[str, float] = Field(..., description="Projected post tuning performance optimization balance ratios metrics verification parameter keys data array values")
    confidence_score: float = Field(..., description="Statistical validity evaluation confirmation model accuracy percentage level metrics scoring validation track ratio index")
    optimization_reasoning: str = Field(..., description="Plain language return value translation analysis explanation description statement outlining operational savings metrics tracking information data block")


# --- C10: Drift Monitor Agent Schemas ---

class ModelDriftPrediction(BaseModel):
    rule_id: str = Field(..., description="Target detection profile signature validation index location registration name identity tracking key string")
    baseline_fpr: float = Field(..., description="Historical target false warning benchmark metric value reference average accuracy profile tracing index")
    current_ewma_fpr: float = Field(..., description="Calculated rolling tracking balance accurate calculation moving average metric value scale factor level coordinate indicator")
    drift_velocity: float = Field(..., description="Calculated decay progression rate tracking delta shifting accuracy variance value size measurement indexing timeline daily metric")
    days_until_critical: int = Field(..., description="Calculated time estimation scale countdown quantity index metrics tracking countdown days duration limit bound marker integer value")
    status: str = Field(..., description="Regime classification evaluation track validation state indicator assignment categorization code marker token")

class PostureDriftAlert(BaseModel):
    metric_name: str = Field(..., description="Target infrastructure status metric tracking key classification registry parameter identity header name index tracking string")
    old_value: float = Field(..., description="Previous posture benchmark score status value configuration baseline checkpoint data level coordinate measurement index tracking value")
    new_value: float = Field(..., description="Current degraded system measurement index tracking variance delta score checkpoint parameter data point value scale factor")
    time_window_hours: int = Field(..., description="Timeline scope evaluation calculation depth constraint window duration parameter limits tracking hours quantity size value block")
    impacted_assets: List[str] = Field(..., description="Targeted systems catalogued listing infrastructure inventory references tags code locator arrays list trackers items data")
    plain_english_summary: str = Field(..., description="Operational analysis text report statement declaring degradation cause path asset identification parameters tracking layout info outline clear text details")

class BehavioralDriftAlert(BaseModel):
    entity_id: str = Field(..., description="Target baseline subject record identity reference tracking tag key node tracking identifier trace string locator")
    drift_score: float = Field(..., description="Calculated cumulative tracking trajectory distance separation scale metric valuation coordinate measurement level balance score index")
    velocity: float = Field(..., description="Rate of behavioral change velocity tracking calculation parameter distance variance metrics scaling values tracking data timeline block indicator")
    is_accelerating: bool = Field(..., description="Mathematical acceleration tracker confirmation tracking status indicating threat progression speed verification index indicator toggle check mark marker state")
    recommendation: str = Field(..., description="Target response investigator optimization operational advice tracking instructions data guide action step text directive outlines block info data specification")


# --- C11: Audit Engine Agent Schemas ---

class AuditLedgerEntry(BaseModel):
    entry_id: str = Field(..., description="Unique immutable ledger sequence chain block transaction record indexing indicator identifier key string locator tag")
    timestamp: str = Field(..., description="ISO entry registration date time log verification track fingerprint trace index validation string block marker token")
    source_agent: str = Field(..., description="Target system agent component classification identification code indicator reference source engine name labeling indicator signature tag")
    event_type: str = Field(..., description="Unified event pipeline classification category system indexing tracking name path transaction event identity marker label name string")
    payload_hash: str = Field(..., description="SHA 256 transaction content text data hash validation string code blocks signatures fingerprint checks data tracking token locator verification code")
    previous_block_hash: str = Field(..., description="Cryptographic blockchain chain tracing connectivity parameter code block link matching validation signature index locator trace fingerprint identification lock string key")
    cryptographic_signature: str = Field(..., description="Final validation block verification algorithm calculations output tracing sequence lock signature string key fingerprint tracking index locator token identification code blocks code parameter signature")

class ComplianceGapFinding(BaseModel):
    framework: str = Field(..., description="Target industry regulatory framework tracking context configuration labeling name directory path index identity system code string locator marker")
    control_id: str = Field(..., description="Specific checklist compliance indexing code checkpoint requirement location reference item identification index line code parameter text mapping locator system pointer")
    description: str = Field(..., description="Regulatory baseline objective requirement directive statement target compliance check control validation policy description trace criteria text message outline info details data")
    days_overdue: int = Field(..., description="Calculated timeframe threshold expiration duration limits tracking delay value unit count indexing calendar overdue lifecycle tracker index quantity block tracking integer value unit metric measurement parameters context logs data")
    remediation_task: str = Field(..., description="Target compliance engineering correction optimization guidance steps plan workflow remediation configuration action checklist step target instructions text layout directive guidelines block outlines info data specification tool system documentation")

class EvidencePackage(BaseModel):
    framework: str = Field(..., description="Target standard reference section label index database query path tracking classification identity system directory key token tracking marker text layout outline name parameter validation checklist trace data")
    generation_timestamp: datetime = Field(..., description="Auditor report execution generation processing timeline registration date block trace confirmation validation baseline index record marker timestamp timezone standard tracking data entry log target info calendar context logs system data")
    total_records: int = Field(..., description="Total sanitized audited historical items extracted matching criterion requirements data selection constraints filter parameter query outcome tracking sizing quantity capacity tracking integer value record size unit amount metrics measurements parameters context logs data")
    records: List[Dict[str, Any]] = Field(..., description="Sanitized database transaction objects metadata array lists tracking ledger records histories extractions evidence documentation portfolios list maps data values layout details structure format collection components profiles entities info lists")