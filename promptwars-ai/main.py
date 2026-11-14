import os
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from config import FRONTEND_ORIGIN, GEMINI_API_KEY
from models import (
    CareerSelectionRequest,
    EvaluationRequest,
    MentorChatRequest,
    MentorChatResponse
)
from agents.orchestrator import OrchestratorAgent

# ---------------------------------------------------------------------------
# Gemini setup — try new google-genai SDK first, fall back to google-generativeai
# ---------------------------------------------------------------------------
gemini_client = None
gemini_model_name = "gemini-2.0-flash"

try:
    # New SDK: google-genai
    from google import genai as google_genai
    if GEMINI_API_KEY:
        gemini_client = google_genai.Client(api_key=GEMINI_API_KEY)
        print(f"✅ google-genai Client loaded (model: {gemini_model_name})")
    else:
        print("⚠️  GEMINI_API_KEY not set — mentor will use rule-based fallback")
except (ImportError, Exception) as _e1:
    print(f"⚠️  google-genai not available ({_e1}) — trying google-generativeai...")
    try:
        import google.generativeai as _legacy_genai
        if GEMINI_API_KEY:
            _legacy_genai.configure(api_key=GEMINI_API_KEY)
            gemini_client = _legacy_genai.GenerativeModel("gemini-1.5-flash")
            print("✅ Fallback: google-generativeai GenerativeModel loaded")
    except (ImportError, Exception) as _e2:
        print(f"⚠️  No Gemini SDK available ({_e2}) — using rule-based fallback")

app = FastAPI(
    title="PromptWars AI Multi-Agent Service",
    description="Multi-agent orchestration service for personalized learning and career intelligence.",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

orchestrator = OrchestratorAgent()

# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "PromptWars AI Engine",
        "gemini_connected": gemini_model is not None,
        "agents": [
            "OrchestratorAgent",
            "SkillAnalysisAgent",
            "CareerIntelligenceAgent",
            "LearningRecommendationAgent",
            "EvaluationAgent"
        ]
    }

# ---------------------------------------------------------------------------
# Career selection workflow
# ---------------------------------------------------------------------------

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

# ---------------------------------------------------------------------------
# Assessment evaluation workflow
# ---------------------------------------------------------------------------

@app.post("/api/agents/evaluate")
def handle_assessment_evaluation(payload: EvaluationRequest):
    """
    Triggered when a learner completes an assessment.
    Invokes Evaluation Agent to calibrate proficiency and patch roadmap.
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

# ---------------------------------------------------------------------------
# AI Mentor chat endpoint (Gemini-powered)
# ---------------------------------------------------------------------------

def build_mentor_system_prompt(ctx: dict) -> str:
    career = ctx.get("targetCareer", "Software Engineering")
    readiness = ctx.get("readinessScore", 50)
    gaps = ctx.get("skillGaps", [])
    phase = ctx.get("currentPhase", "Phase 1: Foundations")
    weak = ctx.get("weakTopics", [])
    skills = ctx.get("userSkills", [])
    degree = ctx.get("degree", "")
    institution = ctx.get("institution", "")

    gaps_str = ", ".join(gaps[:6]) if gaps else "none identified yet"
    weak_str = ", ".join(weak[:5]) if weak else "none"
    skills_str = ", ".join(skills[:10]) if skills else "none recorded"

    return f"""You are the PromptWars AI Mentor — a highly specialized, context-aware career and learning coach.

LEARNER PROFILE (live data):
- Target Career: {career}
- Current Readiness Score: {readiness}%
- Active Roadmap Phase: {phase}
- Degree: {degree or "Not specified"}
- Institution: {institution or "Not specified"}
- Verified Skills: {skills_str}
- Skill Gaps (top): {gaps_str}
- Recent Weak Assessment Topics: {weak_str}

YOUR RULES:
1. Always personalize answers using the learner's actual data above.
2. Be concise, motivational, and actionable. Use markdown for structure.
3. For learning advice: reference their specific gaps and current phase.
4. For concept explanations: explain clearly with examples.
5. For project suggestions: tailor to {career} domain.
6. Never recommend skills they already have as beginners.
7. When asked what to learn today, give a specific 3-item action plan.
8. Keep responses under 350 words unless a detailed explanation is requested.
9. Use emojis sparingly for key points only.
10. Never invent URLs. If asked about resources, say to check the roadmap for curated links.
"""

def rule_based_fallback(message: str, ctx: dict) -> str:
    """Fallback when Gemini is unavailable."""
    career = ctx.get("targetCareer", "Software Engineering")
    readiness = ctx.get("readinessScore", 50)
    gaps = ctx.get("skillGaps", ["JavaScript", "React"])
    phase = ctx.get("currentPhase", "Phase 1: Foundations")
    weak = ctx.get("weakTopics", [])
    q = message.lower()

    if "today" in q or "start" in q or "focus" in q or "what should i learn" in q:
        gaps_str = ", ".join(gaps[:3]) if gaps else "core competencies"
        return (
            f"### 🎯 Today's Learning Plan — **{career}**\n\n"
            f"Based on your profile (Readiness: **{readiness}%** | Phase: **{phase}**):\n\n"
            f"1. **Deep dive into**: {gaps_str}\n"
            f"2. **Complete** 2 hands-on exercises from your active roadmap phase\n"
            f"3. **Review** any flagged weak topics\n\n"
            f"Check your **Learning Roadmap** for today's specific activities and curated resource links."
        )
    elif "explain" in q or "what is" in q or "how does" in q:
        return (
            f"### 📖 Concept Help\n\n"
            f"I can explain any topic related to your **{career}** journey! "
            f"Please share the specific concept, code snippet, or error you'd like me to break down, "
            f"and I'll give you a clear, example-driven explanation."
        )
    elif "project" in q or "assignment" in q or "build" in q:
        return (
            f"### 🛠️ Project Ideas for **{career}**\n\n"
            f"Here are project ideas tailored to close your skill gaps:\n\n"
            f"1. **Portfolio project** that integrates {gaps[0] if gaps else 'your top gap skill'}\n"
            f"2. **API project** with authentication and database — directly relevant to {career}\n"
            f"3. **Clone a real product** in your domain to build production-level intuition\n\n"
            f"Check your roadmap for phase-specific mini-project assignments!"
        )
    else:
        return (
            f"### 🤖 PromptWars AI Mentor\n\n"
            f"I'm here to guide your **{career}** journey!\n\n"
            f"- 📊 **Readiness**: {readiness}%\n"
            f"- 🗺️ **Active Phase**: {phase}\n\n"
            f"Ask me: *What should I learn today?*, *Explain a concept*, or *Give me a project idea*."
        )


@app.post("/api/mentor/chat", response_model=MentorChatResponse)
def handle_mentor_chat(payload: MentorChatRequest):
    """
    Context-aware AI mentor — powered by Gemini 1.5 Flash with rule-based fallback.
    """
    ctx = payload.context or {}

    # --- Try Gemini first ---
    if gemini_client is not None:
        try:
            system_prompt = build_mentor_system_prompt(ctx)
            full_prompt = f"{system_prompt}\n\n---\nLEARNER MESSAGE: {payload.message}"
            # Support both new google-genai and legacy google-generativeai
            try:
                from google import genai as _google_genai
                response = gemini_client.models.generate_content(
                    model=gemini_model_name,
                    contents=full_prompt
                )
                reply = response.text.strip()
            except (ImportError, AttributeError):
                # Legacy API path
                response = gemini_client.generate_content(full_prompt)
                reply = response.text.strip()
            return MentorChatResponse(reply=reply, referenced_context=ctx)
        except Exception as gemini_err:
            print(f"Gemini API error: {gemini_err} — falling back to rule-based response")

    # --- Rule-based fallback ---
    reply = rule_based_fallback(payload.message, ctx)
    return MentorChatResponse(reply=reply, referenced_context=ctx)


if __name__ == "__main__":
    port = int(os.getenv("PORT", 9002))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
