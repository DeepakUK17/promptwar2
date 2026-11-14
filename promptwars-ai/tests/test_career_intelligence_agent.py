"""
Test Suite for Agent 3: Career Intelligence Agent
Covers:
- Weighted career readiness score calculations
- Score edge cases (0%, 100%, empty requirements)
- Fit assessment tiers (Interview Ready >= 80, Solid >= 50, Foundational < 50)
- Validation of explanation content
"""
from agents.career_intelligence import CareerIntelligenceAgent
from models import SkillAnalysisResult

def test_career_intelligence_full_readiness():
    career_reqs = [
        {"name": "Python", "min_proficiency": 80, "weight": 2.0},
        {"name": "SQL", "min_proficiency": 70, "weight": 1.0},
    ]
    analysis = SkillAnalysisResult(
        strengths=[
            {"skill_name": "Python", "current_level": 85},
            {"skill_name": "SQL", "current_level": 90},
        ],
        skill_gaps=[],
        missing_skills=[],
        priority_skills=[]
    )

    result = CareerIntelligenceAgent.evaluate_career_fit("Data Scientist", career_reqs, analysis)

    assert result.readiness_score == 100.0
    assert result.fit_assessment == "Interview Ready"
    assert "Exceptional alignment" in result.explanation

def test_career_intelligence_zero_readiness():
    career_reqs = [
        {"name": "Rust", "min_proficiency": 80, "weight": 3.0}
    ]
    analysis = SkillAnalysisResult(
        strengths=[],
        skill_gaps=[{"skill_name": "Rust", "current_level": 0, "gap": 80}],
        missing_skills=[{"skill_name": "Rust", "required_level": 80, "weight": 3.0}],
        priority_skills=["Rust"]
    )

    result = CareerIntelligenceAgent.evaluate_career_fit("Systems Engineer", career_reqs, analysis)

    assert result.readiness_score == 0.0
    assert result.fit_assessment == "Foundational Stage"
    assert "Early-stage profile" in result.explanation

def test_career_intelligence_intermediate_readiness():
    # Python fulfilled (100% of weight 2.0 = 2.0)
    # React half fulfilled (40/80 = 50% of weight 2.0 = 1.0)
    # Total score = 3.0 / 4.0 = 75%
    career_reqs = [
        {"name": "Python", "min_proficiency": 80, "weight": 2.0},
        {"name": "React", "min_proficiency": 80, "weight": 2.0},
    ]
    analysis = SkillAnalysisResult(
        strengths=[{"skill_name": "Python", "current_level": 80}],
        skill_gaps=[{"skill_name": "React", "current_level": 40, "gap": 40}],
        missing_skills=[],
        priority_skills=["React"]
    )

    result = CareerIntelligenceAgent.evaluate_career_fit("Full Stack Developer", career_reqs, analysis)

    assert result.readiness_score == 75.0
    assert result.fit_assessment == "Solid Foundation / Intermediate"

def test_career_intelligence_empty_requirements():
    analysis = SkillAnalysisResult(strengths=[], skill_gaps=[], missing_skills=[], priority_skills=[])
    result = CareerIntelligenceAgent.evaluate_career_fit("DevOps", [], analysis)
    assert result.readiness_score == 0.0
    assert "Requirements not configured" in result.fit_assessment
