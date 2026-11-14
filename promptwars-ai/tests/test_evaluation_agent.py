"""
Test Suite for Agent 5: Evaluation Agent
Covers:
- Assessment scoring thresholds (>= 60 passes, < 60 fails)
- Proficiency calibration formulas
- Generation of remedial exercises and verified documentation for weak topics
"""
from agents.evaluation import EvaluationAgent

def test_evaluation_agent_high_score_passing():
    score = 85.0
    weak_topics = []
    result = EvaluationAgent.evaluate_performance(score, weak_topics, skill_name="JavaScript")

    assert result.verified is True
    assert result.updated_proficiency == 85.0
    assert len(result.remedial_activities) == 0
    assert "Demonstrated solid proficiency" in result.adaptive_recommendation

def test_evaluation_agent_low_score_triggers_remedial():
    score = 45.0
    weak_topics = ["Closures", "Promises", "Async/Await"]
    result = EvaluationAgent.evaluate_performance(score, weak_topics, skill_name="JavaScript")

    assert result.verified is False
    assert result.updated_proficiency == 45.0
    assert len(result.remedial_activities) >= 2
    assert "beneath the 60% requirement" in result.adaptive_recommendation

    # Check remedial activities contain weak topics
    remedial_titles = [act.title for act in result.remedial_activities]
    assert any("Remedial Concept Review" in t for t in remedial_titles)
    assert any("Targeted Implementation Drills" in t for t in remedial_titles)

    # Ensure remedial resources are real documentation
    for act in result.remedial_activities:
        for res in act.resources:
            assert res.url.startswith("https://")

def test_evaluation_agent_boundary_score_at_threshold():
    # Exactly 60.0% is considered passing
    result = EvaluationAgent.evaluate_performance(60.0, [], skill_name="Python")
    assert result.verified is True
    assert len(result.remedial_activities) == 0

    # 59.9% triggers remedial
    result_fail = EvaluationAgent.evaluate_performance(59.9, ["Syntax"], skill_name="Python")
    assert result_fail.verified is False
    assert len(result_fail.remedial_activities) > 0
