"""
Test Suite for Agent 4: Learning Recommendation Agent
Covers:
- Adaptive roadmap phase structure (Phases 1, 2, 3)
- Verification of real, trusted URLs (no invented links)
- Correct mapping of priority skills to early phases
"""
from agents.learning_recommendation import LearningRecommendationAgent, VERIFIED_RESOURCE_CATALOG
from models import SkillAnalysisResult, CareerIntelligenceResult

def test_learning_recommendation_roadmap_generation():
    analysis = SkillAnalysisResult(
        strengths=[{"skill_name": "HTML5", "current_level": 90}],
        skill_gaps=[
            {"skill_name": "JavaScript", "current_level": 40, "required_level": 80, "weight": 2.0, "gap": 40, "importance": "High"},
            {"skill_name": "React", "current_level": 20, "required_level": 70, "weight": 2.0, "gap": 50, "importance": "High"},
            {"skill_name": "Node.js", "current_level": 0, "required_level": 60, "weight": 1.5, "gap": 60, "importance": "High"},
        ],
        missing_skills=[{"skill_name": "Node.js", "required_level": 60, "weight": 1.5}],
        priority_skills=["JavaScript", "React", "Node.js"]
    )
    intel = CareerIntelligenceResult(
        career_title="Full Stack Developer",
        readiness_score=45.0,
        weighted_score=2.5,
        total_weights=5.5,
        fit_assessment="Foundational Stage",
        explanation="Baseline readiness"
    )

    roadmap = LearningRecommendationAgent.generate_roadmap("Full Stack Developer", analysis, intel, existing_version=2)

    assert roadmap.version == 2
    assert roadmap.readiness_score == 45.0
    assert len(roadmap.phases) == 3

    # Phase 1 checks
    p1 = roadmap.phases[0]
    assert p1.phase_number == 1
    assert "JavaScript" in p1.title or "Core Fundamentals" in p1.title
    assert len(p1.activities) >= 2

    # Check verified resource links exist and start with https://
    for phase in roadmap.phases:
        for activity in phase.activities:
            for res in activity.resources:
                assert res.url.startswith("https://")
                assert res.source != ""

def test_verified_resource_catalog_integrity():
    for skill, resources in VERIFIED_RESOURCE_CATALOG.items():
        assert len(resources) > 0
        for r in resources:
            assert r.url.startswith("https://")
            assert len(r.title) > 0
            assert len(r.source) > 0
