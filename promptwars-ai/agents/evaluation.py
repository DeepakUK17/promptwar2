from typing import List, Dict, Any, Optional
from models import EvaluationResult, ActivityItem, ResourceItem

class EvaluationAgent:
    """
    Agent 5: Evaluation Agent
    Responsibilities:
    - Analyze assessment attempts and code execution results.
    - Identify weak concepts and isolate misunderstanding patterns.
    - Calibrate empirical proficiency levels.
    - Synthesize targeted remedial interventions to patch the active learning roadmap.
    """

    @staticmethod
    def evaluate_performance(
        score_percentage: float,
        weak_topics: List[str],
        skill_name: Optional[str] = None
    ) -> EvaluationResult:
        is_proficient = score_percentage >= 60.0
        remedial_activities: List[ActivityItem] = []

        if not is_proficient:
            # Low performance scenario - generate remedial interventions
            topics_desc = ", ".join(weak_topics) if weak_topics else f"{skill_name or 'core'} syntax and execution model"
            
            remedial_activities.append(ActivityItem(
                title=f"Remedial Concept Review: {topics_desc}",
                description=(
                    f"Assessment indicated conceptual difficulty in: {topics_desc}. "
                    "Review focused documentation and code walkthroughs before advancing."
                ),
                activity_type="remedial",
                priority="critical",
                estimated_hours=3.5,
                resources=[
                    ResourceItem(
                        title="Interactive Diagnostic Exercises",
                        url="https://javascript.info",
                        source="Tutorial Reference"
                    )
                ]
            ))

            remedial_activities.append(ActivityItem(
                title=f"Targeted Implementation Drills: {topics_desc}",
                description="Write isolated functions demonstrating correct usage without syntax errors.",
                activity_type="exercise",
                priority="high",
                estimated_hours=4.0,
                resources=[]
            ))

            recommendation = (
                f"Score ({score_percentage}%) was beneath the 60% requirement. "
                f"The Evaluation Agent has dynamically inserted 2 remedial modules on {topics_desc} "
                "into your current phase to secure prerequisite foundations."
            )
        else:
            recommendation = (
                f"Demonstrated solid proficiency ({score_percentage}%). "
                "The Evaluation Agent validated your competence and approved advancement to subsequent architectural phases."
            )

        return EvaluationResult(
            updated_proficiency=score_percentage,
            verified=is_proficient,
            weak_topics=weak_topics,
            adaptive_recommendation=recommendation,
            remedial_activities=remedial_activities
        )
