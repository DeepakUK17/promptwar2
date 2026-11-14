"""
Test Suite for FastAPI Endpoints & AI Mentor Integration
Covers:
- GET /health
- POST /api/agents/career-selection
- POST /api/agents/evaluate with score validation (0 to 100)
- POST /api/mentor/chat with Gemini mocking and rule-based fallback
"""
import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
from main import app, rule_based_fallback

client = TestClient(app)

def test_health_check_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "PromptWars AI Engine" in data["service"]
    assert "agents" in data
    assert len(data["agents"]) == 5

def test_career_selection_endpoint():
    payload = {
        "user_id": "test-uuid-1",
        "career_role_id": "role-uuid-1",
        "reason": "career_selection"
    }
    response = client.post("/api/agents/career-selection", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["success", "partial_success_db_unpersisted"]
    assert "readiness_score" in data
    assert "recommendations" in data

def test_evaluate_endpoint_valid_score():
    payload = {
        "user_id": "user-uuid-1",
        "attempt_id": "attempt-uuid-1",
        "score_percentage": 78.5,
        "weak_topics": ["Promises"],
        "source": "native_mcq"
    }
    response = client.post("/api/agents/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()
    # status can be success or db_error depending on live DB test credentials
    assert data["status"] in ["success", "db_error"]
    assert data["evaluation"]["updated_proficiency"] == 78.5
    assert data["evaluation"]["verified"] is True

def test_evaluate_endpoint_score_validation_out_of_bounds():
    # Negative score
    res_neg = client.post("/api/agents/evaluate", json={
        "user_id": "user-1",
        "attempt_id": "att-1",
        "score_percentage": -5.0
    })
    assert res_neg.status_code == 422

    # Score > 100
    res_high = client.post("/api/agents/evaluate", json={
        "user_id": "user-1",
        "attempt_id": "att-1",
        "score_percentage": 105.0
    })
    assert res_high.status_code == 422

def test_mentor_chat_rule_based_fallback():
    ctx = {
        "targetCareer": "Full Stack Developer",
        "readinessScore": 65,
        "skillGaps": ["React", "PostgreSQL"],
        "currentPhase": "Phase 2: Core Stack",
        "weakTopics": ["Hooks"]
    }
    reply = rule_based_fallback("What should I learn today?", ctx)
    assert "Full Stack Developer" in reply
    assert "React" in reply
    assert "Learning Roadmap" in reply

def test_mentor_chat_endpoint_with_mocked_gemini():
    mock_response = MagicMock()
    mock_response.text = "Here is your personalized roadmap advice from Gemini 2.0 Flash."

    with patch("main.gemini_client") as mock_client:
        mock_client.models.generate_content.return_value = mock_response

        response = client.post("/api/mentor/chat", json={
            "user_id": "user-1",
            "message": "Explain React state vs props",
            "context": {"targetCareer": "Frontend Developer"}
        })

        assert response.status_code == 200
        data = response.json()
        assert "reply" in data
        assert len(data["reply"]) > 0
