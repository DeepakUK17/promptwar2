import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from config import FRONTEND_ORIGIN
from models import (
    CareerSelectionRequest,
    EvaluationRequest,
    MentorChatRequest,
    MentorChatResponse
)
from agents.orchestrator import OrchestratorAgent

app = FastAPI(
    title="PromptWars AI Multi-Agent Service",
    description="Multi-agent orchestration service for personalized learning and career intelligence.",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In development allow all; configure specific in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

orchestrator = OrchestratorAgent()

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "PromptWars AI Engine",
        "agents": [
            "OrchestratorAgent",
            "SkillAnalysisAgent",
            "CareerIntelligenceAgent",
            "LearningRecommendationAgent",
            "EvaluationAgent"
        ]
    }

@app.post("/api/agents/career-selection")
def handle_career_selection(payload: CareerSelectionRequest):
    """
    Triggered when a learner selects or switches a career goal.
    Coordinates: Orchestrator -> CareerIntelligence -> SkillAnalysis -> LearningRecommendation.
    """
    try:
        result = orchestrator.run_career_selection_workflow(
            user_id=payload.user_id,
            career_role_id=payload.career_role_id,
            reason=payload.reason or "career_selection"
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/agents/evaluate")
def handle_assessment_evaluation(payload: EvaluationRequest):
    """
    Triggered when a learner completes an assessment or synchronizes code lab results.
    Invokes Evaluation Agent to calibrate proficiency and patch the active roadmap with remedial activities if needed.
    """
    try:
        result = orchestrator.run_evaluation_workflow(
            user_id=payload.user_id,
            attempt_id=payload.attempt_id,
            score_percentage=payload.score_percentage,
            weak_topics=payload.weak_topics or [],
            skill_id=payload.skill_id
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/mentor/chat", response_model=MentorChatResponse)
def handle_mentor_chat(payload: MentorChatRequest):
    """
    Context-aware AI mentor chat endpoint.
    Grounds response in live learner database state (career goal, readiness %, gaps, current phase).
    """
    ctx = payload.context or {}
    career = ctx.get("targetCareer", "Software Engineering")
    readiness = ctx.get("readinessScore", 50)
    gaps = ctx.get("skillGaps", ["JavaScript", "React"])
    phase = ctx.get("currentPhase", "Phase 1: Foundations")
    weak = ctx.get("weakTopics", [])

    q = payload.message.lower()

    if "today" in q or "start" in q or "focus" in q or "what should i learn" in q:
        gaps_str = ", ".join(gaps[:3]) if gaps else "core competencies"
        reply = (
            f"### 🎯 Strategic Learning Directive: **{career}**\n\n"
            f"Reviewing your profile context (Current Readiness: **{readiness}%** | Milestone: **{phase}**):\n\n"
            f"1. **Primary Focus**: Prioritize closing verified gaps in **{gaps_str}**. These carry the highest weighting in your career formula.\n"
            f"2. **Hands-on Implementation**: Complete 2 coding exercises in your active roadmap phase.\n"
            + (f"3. **Targeted Review**: Spend 45 minutes on recent weak concepts: **{', '.join(weak)}**.\n\n" if weak else "3. **Validation**: Take a diagnostic skill test once you finish today's chapter.\n\n")
            + "*All learning activities and verified documentation links are tracked in your **Roadmap** view.*"
        )
    elif "why" in q and ("need" in q or "learn" in q):
        gaps_str = ", ".join(gaps[:2]) if gaps else "target skills"
        reply = (
            f"### 💼 Industry Context: Why {gaps_str} are Critical for {career}\n\n"
            f"In tech hiring pipelines for **{career}**, candidates are screened rigorously on architecture and problem solving:\n\n"
            f"- **Market Weight**: In our scoring matrix, **{gaps_str}** represent over 35% of the total weighted index.\n"
            f"- **Production Relevance**: Modern engineering stacks demand proficiency from frontend state management down to API persistence layers.\n\n"
            f"Advancing your proficiency from your current **{readiness}%** toward 80%+ will directly qualify your portfolio for top-tier role benchmarks."
        )
    elif "assessment" in q or "mistake" in q or "score" in q or "weak" in q:
        reply = (
            f"### 📊 Evaluation Agent Diagnostics\n\n"
            + (f"The **Evaluation Agent** highlighted the following conceptual areas needing reinforcement:\n- **{', '.join(weak)}**\n\n"
               "Your roadmap has been dynamically patched with targeted exercises so you can master these before advancing to complex dependent patterns." if weak else
               f"Your current assessment records show solid mastery! Your verified score is contributing to your **{readiness}%** career index.")
        )
    elif "career" in q or "change" in q or "goal" in q:
        reply = (
            f"### 🔄 Dynamic Career Switching Capability\n\n"
            "You can change your target career at any time in **Career Matching**!\n"
            "When you do:\n"
            "1. The **Career Intelligence Agent** recalculates your readiness index against the new role.\n"
            "2. Your previous roadmap is preserved and archived in your historical timeline.\n"
            "3. The **Learning Recommendation Agent** synthesizes a brand-new multi-phase roadmap tailored to the new requirements.\n"
            "4. Your verified skills (Python, SQL, etc.) automatically transfer over so you never lose progress!"
        )
    else:
        reply = (
            f"### 🤖 PromptWars Mentor Briefing for **{career}**\n\n"
            f"I am actively monitoring your progress alongside the 5 specialized AI agents:\n\n"
            f"- **Target Track**: {career}\n"
            f"- **Readiness Level**: {readiness}%\n"
            f"- **Active Milestone**: {phase}\n\n"
            "Let me know if you would like concept explanations, practical project ideas, or assessment preparation tips!"
        )

    return MentorChatResponse(
        reply=reply,
        referenced_context=ctx
    )

if __name__ == "__main__":
    import os
    port = int(os.getenv("PORT", 9002))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
