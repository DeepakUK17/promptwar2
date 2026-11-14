from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# --- Request & Response Models ---

class CareerSelectionRequest(BaseModel):
    user_id: str = Field(..., min_length=1, description="Valid user identifier")
    career_role_id: str = Field(..., min_length=1, description="Target career role identifier")
    reason: Optional[str] = "career_selection"

class EvaluationRequest(BaseModel):
    user_id: str = Field(..., min_length=1, description="Valid user identifier")
    attempt_id: str = Field(..., min_length=1, description="Assessment attempt identifier")
    skill_id: Optional[str] = None
    score_percentage: float = Field(..., ge=0.0, le=100.0, description="Score percentage between 0 and 100")
    weak_topics: Optional[List[str]] = Field(default_factory=list)
    source: Optional[str] = "native_mcq"

class MentorChatRequest(BaseModel):
    user_id: str = Field(..., min_length=1, description="Valid user identifier")
    message: str = Field(..., min_length=1, description="Message text from learner")
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
    readiness_score: float = Field(..., ge=0.0, le=100.0)
    weighted_score: float = Field(..., ge=0.0)
    total_weights: float = Field(..., ge=0.0)
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
    estimated_hours: float = Field(..., ge=0.0)
    resources: List[ResourceItem] = Field(default_factory=list)

class PhaseItem(BaseModel):
    phase_number: int = Field(..., ge=1)
    title: str
    description: str
    estimated_hours: int = Field(..., ge=0)
    activities: List[ActivityItem] = Field(default_factory=list)

class RoadmapRecommendationResult(BaseModel):
    version: int = Field(..., ge=1)
    readiness_score: float = Field(..., ge=0.0, le=100.0)
    phases: List[PhaseItem] = Field(default_factory=list)

class EvaluationResult(BaseModel):
    updated_proficiency: float = Field(..., ge=0.0, le=100.0)
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
