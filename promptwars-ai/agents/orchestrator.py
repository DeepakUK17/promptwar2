import time
from typing import Dict, Any, List
from supabase import create_client, Client
from config import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
from models import OrchestratorWorkflowState
from agents.skill_analysis import SkillAnalysisAgent
from agents.career_intelligence import CareerIntelligenceAgent
from agents.learning_recommendation import LearningRecommendationAgent
from agents.evaluation import EvaluationAgent

class OrchestratorAgent:
    """
    Agent 1: Orchestrator Agent
    Responsibilities:
    - Coordinates specialized AI agents.
    - Manages shared learner state and Supabase persistence.
    - Controls multi-agent workflow execution pipelines.
    - Records audit logs of agent actions.
    - Accurately reports persistence status to prevent false success.
    """

    def __init__(self, supabase_client: Any = "DEFAULT"):
        if supabase_client != "DEFAULT":
            self.supabase: Client = supabase_client
        else:
            self.supabase: Client = None
            if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY:
                try:
                    self.supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
                except Exception as e:
                    print(f"[Orchestrator] Warning: could not initialize supabase client: {e}")

    def run_career_selection_workflow(self, user_id: str, career_role_id: str, reason: str = "career_selection") -> Dict[str, Any]:
        start_time = time.time()
        logs = []
        db_persisted = False
        db_error = None

        logs.append(f"Orchestrator received {reason} event for user {user_id} and role {career_role_id}")

        # 1. Fetch learner skills and career requirements from database if client available
        learner_skills = []
        career_requirements = []
        career_title = "Target Career"

        if self.supabase:
            try:
                # Career Role
                c_res = self.supabase.table("career_roles").select("*").eq("id", career_role_id).single().execute()
                if c_res.data and isinstance(c_res.data, dict):
                    career_title = str(c_res.data.get("title") or career_title)

                # Career Requirements
                req_res = self.supabase.table("career_required_skills").select("*, skill:skills(*)").eq("career_role_id", career_role_id).execute()
                if req_res.data and isinstance(req_res.data, list):
                    career_requirements = req_res.data

                # Learner Skills
                ls_res = self.supabase.table("learner_skills").select("*, skill:skills(*)").eq("user_id", user_id).execute()
                if ls_res.data and isinstance(ls_res.data, list):
                    learner_skills = ls_res.data
            except Exception as e:
                logs.append(f"DB fetch warning: {e}")

        # 2. Invoke Agent 2: Skill Analysis Agent
        logs.append("Invoking Agent 2: Skill Analysis Agent")
        skill_analysis = SkillAnalysisAgent.analyze_skills(learner_skills, career_requirements)
        logs.append(f"Skill Analysis complete. Strengths: {len(skill_analysis.strengths)}, Gaps: {len(skill_analysis.skill_gaps)}")

        # 3. Invoke Agent 3: Career Intelligence Agent
        logs.append("Invoking Agent 3: Career Intelligence Agent")
        career_intelligence = CareerIntelligenceAgent.evaluate_career_fit(
            str(career_title), 
            career_requirements, 
            skill_analysis
        )
        logs.append(f"Career Readiness calculated: {career_intelligence.readiness_score}%")

        # 4. Check existing roadmap version count to increment
        new_version = 1
        if self.supabase:
            try:
                hist = self.supabase.table("learning_roadmaps").select("version").eq("user_id", user_id).execute()
                if hist.data and isinstance(hist.data, list):
                    new_version = len(hist.data) + 1
            except Exception:
                pass

        # 5. Invoke Agent 4: Learning Recommendation Agent
        logs.append("Invoking Agent 4: Learning Recommendation Agent")
        recommendations = LearningRecommendationAgent.generate_roadmap(
            str(career_title),
            skill_analysis,
            career_intelligence,
            existing_version=new_version
        )
        logs.append(f"Roadmap synthesized with {len(recommendations.phases)} phases")

        # 6. Commit new roadmap to Supabase
        created_roadmap_id = None
        if self.supabase:
            try:
                # Archive existing active roadmaps
                self.supabase.table("learning_roadmaps").update({
                    "status": "archived",
                    "archived_at": "now()",
                    "change_reason": reason
                }).eq("user_id", user_id).eq("status", "active").execute()

                # Insert new roadmap
                rm_res = self.supabase.table("learning_roadmaps").insert({
                    "user_id": user_id,
                    "career_role_id": career_role_id,
                    "version": new_version,
                    "status": "active",
                    "readiness_score": career_intelligence.readiness_score,
                    "change_reason": reason
                }).execute()

                if rm_res.data and isinstance(rm_res.data, list) and len(rm_res.data) > 0:
                    created_roadmap_id = rm_res.data[0].get("id")
                    logs.append(f"Created new active roadmap {created_roadmap_id} (v{new_version})")

                    # Insert phases and activities
                    for phase in recommendations.phases:
                        p_res = self.supabase.table("roadmap_phases").insert({
                            "roadmap_id": created_roadmap_id,
                            "phase_number": phase.phase_number,
                            "title": phase.title,
                            "description": phase.description,
                            "status": "in_progress" if phase.phase_number == 1 else "pending",
                            "estimated_hours": phase.estimated_hours,
                            "order_index": phase.phase_number
                        }).execute()

                        if p_res.data and isinstance(p_res.data, list) and len(p_res.data) > 0:
                            phase_id = p_res.data[0].get("id")
                            for a_idx, act in enumerate(phase.activities):
                                act_res = self.supabase.table("learning_activities").insert({
                                    "phase_id": phase_id,
                                    "activity_type": act.activity_type,
                                    "title": act.title,
                                    "description": act.description,
                                    "priority": act.priority,
                                    "estimated_hours": act.estimated_hours,
                                    "status": "pending",
                                    "order_index": a_idx + 1
                                }).execute()

                                if act_res.data and act.resources and isinstance(act_res.data, list) and len(act_res.data) > 0:
                                    act_id = act_res.data[0].get("id")
                                    for res in act.resources:
                                        self.supabase.table("learning_resources").insert({
                                            "activity_id": act_id,
                                            "resource_type": res.resource_type,
                                            "title": res.title,
                                            "url": res.url,
                                            "source": res.source
                                        }).execute()

                    db_persisted = True
                else:
                    db_error = "Insert into learning_roadmaps returned no data"
                    logs.append(f"DB insert warning: {db_error}")

                # Log orchestrator execution
                duration_ms = int((time.time() - start_time) * 1000)
                self.supabase.table("agent_execution_logs").insert({
                    "user_id": user_id,
                    "trigger_event": reason,
                    "agents_used": ["Orchestrator", "SkillAnalysisAgent", "CareerIntelligenceAgent", "LearningRecommendationAgent"],
                    "input_payload": {"career_role_id": career_role_id, "reason": reason},
                    "output_payload": {
                        "readiness_score": career_intelligence.readiness_score,
                        "phases_count": len(recommendations.phases),
                        "roadmap_id": created_roadmap_id
                    },
                    "duration_ms": duration_ms
                }).execute()

            except Exception as e:
                db_error = str(e)
                logs.append(f"DB commit error: {e}")

        duration_ms = int((time.time() - start_time) * 1000)
        logs.append(f"Multi-agent workflow concluded in {duration_ms}ms")

        status = "success"
        if self.supabase and not db_persisted:
            status = "partial_success_db_unpersisted"

        return {
            "status": status,
            "career_title": str(career_title),
            "readiness_score": career_intelligence.readiness_score,
            "skill_analysis": skill_analysis.model_dump(),
            "career_intelligence": career_intelligence.model_dump(),
            "recommendations": recommendations.model_dump(),
            "roadmap_id": created_roadmap_id,
            "persisted": db_persisted,
            "db_error": db_error,
            "execution_logs": logs
        }

    def run_evaluation_workflow(
        self,
        user_id: str,
        attempt_id: str,
        score_percentage: float,
        weak_topics: List[str],
        skill_id: str = None
    ) -> Dict[str, Any]:
        start_time = time.time()
        logs = [f"Orchestrator evaluating attempt {attempt_id} with score {score_percentage}%"]
        db_persisted = False
        db_error = None

        # 1. Invoke Agent 5: Evaluation Agent
        eval_result = EvaluationAgent.evaluate_performance(score_percentage, weak_topics)
        logs.append(f"Evaluation Agent produced recommendation: {eval_result.adaptive_recommendation}")

        # 2. If poor performance, dynamically patch active roadmap with remedial activities
        if self.supabase:
            try:
                if score_percentage < 60.0 and eval_result.remedial_activities:
                    # Find active roadmap's first phase
                    rm = self.supabase.table("learning_roadmaps").select("id").eq("user_id", user_id).eq("status", "active").maybe_single().execute()
                    if rm.data and isinstance(rm.data, dict):
                        roadmap_id = rm.data.get("id")
                        p = self.supabase.table("roadmap_phases").select("id").eq("roadmap_id", roadmap_id).order("order_index").limit(1).execute()
                        if p.data and isinstance(p.data, list) and len(p.data) > 0:
                            first_phase_id = p.data[0].get("id")
                            for r_act in eval_result.remedial_activities:
                                act_insert = self.supabase.table("learning_activities").insert({
                                    "phase_id": first_phase_id,
                                    "skill_id": skill_id,
                                    "activity_type": "remedial",
                                    "title": r_act.title,
                                    "description": r_act.description,
                                    "priority": "critical",
                                    "estimated_hours": r_act.estimated_hours,
                                    "status": "in_progress",
                                    "order_index": 0 # Prepend
                                }).execute()

                                if act_insert.data and r_act.resources and isinstance(act_insert.data, list) and len(act_insert.data) > 0:
                                    act_id = act_insert.data[0].get("id")
                                    for res in r_act.resources:
                                        self.supabase.table("learning_resources").insert({
                                            "activity_id": act_id,
                                            "resource_type": res.resource_type,
                                            "title": res.title,
                                            "url": res.url,
                                            "source": res.source
                                        }).execute()

                            logs.append("Successfully patched active roadmap with remedial interventions")

                # Log evaluation agent execution
                duration_ms = int((time.time() - start_time) * 1000)
                self.supabase.table("agent_execution_logs").insert({
                    "user_id": user_id,
                    "trigger_event": "assessment_complete",
                    "agents_used": ["Orchestrator", "EvaluationAgent"],
                    "input_payload": {"attempt_id": attempt_id, "score_percentage": score_percentage},
                    "output_payload": eval_result.model_dump(),
                    "duration_ms": duration_ms
                }).execute()
                db_persisted = True

            except Exception as e:
                db_error = str(e)
                logs.append(f"DB patch error: {e}")

        status = "success"
        if self.supabase and db_error:
            status = "db_error"

        return {
            "status": status,
            "evaluation": eval_result.model_dump(),
            "persisted": db_persisted,
            "db_error": db_error,
            "logs": logs
        }
