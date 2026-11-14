from typing import List, Dict, Any
from models import SkillAnalysisResult

class SkillAnalysisAgent:
    """
    Agent 2: Skill Analysis Agent
    Responsibilities:
    - Compare self-reported vs assessment-validated proficiency.
    - Identify strengths and skill gaps against target career criteria.
    - Prioritize improvement areas.
    """

    @staticmethod
    def analyze_skills(
        learner_skills: List[Dict[str, Any]], 
        career_requirements: List[Dict[str, Any]]
    ) -> SkillAnalysisResult:
        learner_map = {}
        for s in learner_skills:
            name = (s.get("skill", {}).get("name") or s.get("name") or "").lower()
            assessed = s.get("assessed_level")
            self_rep = s.get("self_reported_level", 0)
            effective = assessed if assessed is not None else self_rep
            learner_map[name] = {
                "skill_id": s.get("skill_id") or s.get("id"),
                "skill_name": s.get("skill", {}).get("name") or s.get("name") or "",
                "effective_level": effective,
                "verified": s.get("verified", False),
            }

        strengths = []
        skill_gaps = []
        missing_skills = []

        for req in career_requirements:
            r_name = (req.get("skill", {}).get("name") or req.get("name") or "").lower()
            min_prof = req.get("min_proficiency", 60)
            weight = req.get("weight", 1.0)
            actual_name = req.get("skill", {}).get("name") or req.get("name") or "Skill"

            learner_entry = learner_map.get(r_name)
            current_level = learner_entry["effective_level"] if learner_entry else 0

            if current_level >= min_prof:
                strengths.append({
                    "skill_name": actual_name,
                    "current_level": current_level,
                    "required_level": min_prof,
                    "verified": learner_entry["verified"] if learner_entry else False,
                })
            else:
                gap = min_prof - current_level
                importance = "High" if weight >= 1.4 else "Medium" if weight >= 1.1 else "Low"
                gap_item = {
                    "skill_id": req.get("skill_id") or req.get("id"),
                    "skill_name": actual_name,
                    "current_level": current_level,
                    "required_level": min_prof,
                    "gap": gap,
                    "weight": weight,
                    "importance": importance,
                }
                skill_gaps.append(gap_item)
                if current_level == 0:
                    missing_skills.append(gap_item)

        # Sort gaps by weight * gap descending
        skill_gaps.sort(key=lambda x: x["weight"] * x["gap"], reverse=True)
        priority_skills = [g["skill_name"] for g in skill_gaps[:4]]

        return SkillAnalysisResult(
            strengths=strengths,
            skill_gaps=skill_gaps,
            missing_skills=missing_skills,
            priority_skills=priority_skills,
        )
