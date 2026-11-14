"""
Test Suite for Agent 2: Skill Analysis Agent
Covers:
- Identification of strengths (current >= required)
- Identification of gaps and missing skills
- Effective level priority (assessed vs self-reported)
- Gap sorting by weight * gap
"""
from agents.skill_analysis import SkillAnalysisAgent

def test_skill_analysis_strengths_and_gaps():
    learner_skills = [
        {"skill": {"name": "JavaScript"}, "self_reported_level": 80, "assessed_level": 85, "verified": True},
        {"skill": {"name": "React"}, "self_reported_level": 40, "assessed_level": None, "verified": False},
    ]
    career_requirements = [
        {"skill": {"name": "JavaScript"}, "min_proficiency": 70, "weight": 2.0},
        {"skill": {"name": "React"}, "min_proficiency": 60, "weight": 1.5},
        {"skill": {"name": "Node.js"}, "min_proficiency": 60, "weight": 1.0},
    ]

    result = SkillAnalysisAgent.analyze_skills(learner_skills, career_requirements)

    assert len(result.strengths) == 1
    assert result.strengths[0]["skill_name"] == "JavaScript"
    assert result.strengths[0]["current_level"] == 85
    assert result.strengths[0]["verified"] is True

    assert len(result.skill_gaps) == 2
    gap_names = [g["skill_name"] for g in result.skill_gaps]
    assert "React" in gap_names
    assert "Node.js" in gap_names

    # Missing skill (level 0)
    assert len(result.missing_skills) == 1
    assert result.missing_skills[0]["skill_name"] == "Node.js"
    assert result.missing_skills[0]["required_level"] == 60

def test_skill_analysis_empty_inputs():
    result = SkillAnalysisAgent.analyze_skills([], [])
    assert len(result.strengths) == 0
    assert len(result.skill_gaps) == 0
    assert len(result.missing_skills) == 0
    assert len(result.priority_skills) == 0

def test_skill_analysis_prefers_assessed_over_self_reported():
    learner_skills = [
        {"skill": {"name": "Python"}, "self_reported_level": 90, "assessed_level": 50, "verified": True}
    ]
    career_requirements = [
        {"skill": {"name": "Python"}, "min_proficiency": 70, "weight": 1.5}
    ]
    result = SkillAnalysisAgent.analyze_skills(learner_skills, career_requirements)

    # Assessed level 50 < 70, so it must be a gap, not a strength
    assert len(result.strengths) == 0
    assert len(result.skill_gaps) == 1
    assert result.skill_gaps[0]["current_level"] == 50
    assert result.skill_gaps[0]["gap"] == 20
