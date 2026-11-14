from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# --- Request & Response Models ---

class CareerSelectionRequest(BaseModel):
    user_id: str
    career_role_id: str
    reason: Optional[str] = "career_selection"

class EvaluationRequest(BaseModel):
    user_id: str
    attempt_id: str
    skill_id: Optional[str] = None
    score_percentage: float
    weak_topics: Optional[List[str]] = Field(default_factory=list)
    source: Optional[str] = "native_mcq"

class MentorChatRequest(BaseModel):
    user_id: str
    message: str
    context: Optional[Dict[str, Any]] = Field(default_factory=dict)

class MentorChatResponse(BaseModel):
    reply: str
    referenced_context: Dict[str, Any]

# --- Inter-Agent State Models ---

class SkillAnalysisResult(BaseModel):
    strengths: List[Dict[str, Any]] = Field(default_factory=list)
    skill_gaps: List[Dict[str, Any]] = Field(default_factory=list)
    missing_skills: List[Dict[str, Any]] = Field(default_factory=list)
    priority_skills: List[str] = Field(default_factory=list)

class CareerIntelligenceResult(BaseModel):
    career_title: str
    readiness_score: float
    weighted_score: float
    total_weights: float
    fit_assessment: str
    explanation: str

class ResourceItem(BaseModel):
    title: str
    url: str
    source: str
    resource_type: str = "url"

class ActivityItem(BaseModel):
    title: str
    description: str
    activity_type: str
    priority: str
    estimated_hours: float
    resources: List[ResourceItem] = Field(default_factory=list)

class PhaseItem(BaseModel):
    phase_number: int
    title: str
    description: str
    estimated_hours: int
    activities: List[ActivityItem] = Field(default_factory=list)

class RoadmapRecommendationResult(BaseModel):
    version: int
    readiness_score: float
    phases: List[PhaseItem] = Field(default_factory=list)

class EvaluationResult(BaseModel):
    updated_proficiency: float
    verified: bool
    weak_topics: List[str]
    adaptive_recommendation: str
    remedial_activities: List[ActivityItem] = Field(default_factory=list)

# --- Shared Orchestrator Workflow State ---

class OrchestratorWorkflowState(BaseModel):
    user_id: str
    career_role_id: str
    trigger_event: str
    learner_profile: Dict[str, Any] = Field(default_factory=dict)
    learner_skills: List[Dict[str, Any]] = Field(default_factory=list)
    career_requirements: List[Dict[str, Any]] = Field(default_factory=list)
    skill_analysis: Optional[SkillAnalysisResult] = None
    career_intelligence: Optional[CareerIntelligenceResult] = None
    recommendations: Optional[RoadmapRecommendationResult] = None
    execution_logs: List[str] = Field(default_factory=list)
