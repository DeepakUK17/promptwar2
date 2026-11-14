from typing import List, Dict, Any
from models import CareerIntelligenceResult, SkillAnalysisResult

class CareerIntelligenceAgent:
    """
    Agent 3: Career Intelligence Agent
    Responsibilities:
    - Analyze target career requirements and industry market expectations.
    - Compare learner capabilities with career benchmarks.
    - Generate transparent weighted career readiness scores.
    - Provide plain-English market-context diagnosis.
    """

    @staticmethod
    def evaluate_career_fit(
        career_title: str,
        career_requirements: List[Dict[str, Any]],
        skill_analysis: SkillAnalysisResult
    ) -> CareerIntelligenceResult:
        if not career_requirements:
            return CareerIntelligenceResult(
                career_title=career_title,
                readiness_score=0.0,
                weighted_score=0.0,
                total_weights=0.0,
                fit_assessment="Requirements not configured.",
                explanation=f"No weighted competency criteria registered for {career_title}."
            )

        total_weights = 0.0
        total_weighted_score = 0.0

        # Build map of current levels
        current_levels = {}
        for s in skill_analysis.strengths:
            current_levels[s["skill_name"].lower()] = s["current_level"]
        for g in skill_analysis.skill_gaps:
            current_levels[g["skill_name"].lower()] = g["current_level"]

        for req in career_requirements:
            name = (req.get("skill", {}).get("name") or req.get("name") or "").lower()
            min_prof = float(req.get("min_proficiency", 60))
            weight = float(req.get("weight", 1.0))

            total_weights += weight
            learner_level = float(current_levels.get(name, 0.0))

            fulfillment = min(learner_level, min_prof) / min_prof
            total_weighted_score += fulfillment * weight

        readiness_score = round((total_weighted_score / total_weights) * 100, 1) if total_weights > 0 else 0.0

        strengths_names = [s["skill_name"] for s in skill_analysis.strengths]
        priority_names = skill_analysis.priority_skills

        if readiness_score >= 80:
            fit_assessment = "Interview Ready"
            explanation = (
                f"Exceptional alignment! You satisfy {readiness_score}% of the required industry benchmarks "
                f"for {career_title}. Polishing {', '.join(priority_names) if priority_names else 'final projects'} "
                f"will complete your market readiness."
            )
        elif readiness_score >= 50:
            fit_assessment = "Solid Foundation / Intermediate"
            explanation = (
                f"Strong foundation! You meet {readiness_score}% of expectations for {career_title}. "
                f"Your existing proficiencies in {', '.join(strengths_names) if strengths_names else 'core areas'} "
                f"provide traction, but bridging priority gaps in {', '.join(priority_names)} is required for hiring consideration."
            )
        else:
            fit_assessment = "Foundational Stage"
            explanation = (
                f"Early-stage profile for {career_title} with a baseline readiness index of {readiness_score}%. "
                f"Highest leverage learning must focus immediately on {', '.join(priority_names)}."
            )

        return CareerIntelligenceResult(
            career_title=career_title,
            readiness_score=readiness_score,
            weighted_score=round(total_weighted_score, 1),
            total_weights=round(total_weights, 1),
            fit_assessment=fit_assessment,
            explanation=explanation
        )
