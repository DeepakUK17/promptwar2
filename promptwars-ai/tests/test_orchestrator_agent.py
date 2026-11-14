"""
Test Suite for Agent 1: Orchestrator Agent
Covers:
- End-to-end multi-agent coordination pipeline
- Mocking Supabase database client
- Persistence failure detection (ensures API never reports false success)
- Audit log recording
"""
from unittest.mock import MagicMock
from agents.orchestrator import OrchestratorAgent

def test_orchestrator_career_selection_workflow_offline():
    # Explicitly pass None so no Supabase client is initialized
    agent = OrchestratorAgent(supabase_client=None)
    result = agent.run_career_selection_workflow(
        user_id="test-user-123",
        career_role_id="role-456",
        reason="test_career_selection"
    )

    assert result["status"] == "success"
    assert "readiness_score" in result
    assert "skill_analysis" in result
    assert "career_intelligence" in result
    assert "recommendations" in result
    assert result["persisted"] is False

def test_orchestrator_career_selection_with_mocked_supabase():
    mock_sb = MagicMock()
    mock_table = MagicMock()
    mock_sb.table.return_value = mock_table
    mock_table.select.return_value = mock_table
    mock_table.insert.return_value = mock_table
    mock_table.update.return_value = mock_table
    mock_table.eq.return_value = mock_table
    mock_table.single.return_value = mock_table

    # Set return data
    mock_table.execute.return_value = MagicMock(data=[{"id": "roadmap-123"}])

    agent = OrchestratorAgent(supabase_client=mock_sb)
    result = agent.run_career_selection_workflow(
        user_id="user-1",
        career_role_id="role-1",
        reason="career_selection"
    )

    assert result["status"] == "success"
    assert result["persisted"] is True
    assert result["roadmap_id"] == "roadmap-123"

def test_orchestrator_detects_db_persistence_failure():
    mock_sb = MagicMock()
    mock_table = MagicMock()
    mock_sb.table.return_value = mock_table
    mock_table.select.return_value = mock_table
    mock_table.update.return_value = mock_table
    mock_table.eq.return_value = mock_table

    # Return valid list on fetch queries
    mock_table.execute.return_value = MagicMock(data=[])

    # Simulate database exception during insert
    mock_table.insert.side_effect = Exception("Database connection lost")

    agent = OrchestratorAgent(supabase_client=mock_sb)
    result = agent.run_career_selection_workflow(
        user_id="user-1",
        career_role_id="role-1"
    )

    # Must NOT report simple 'success' when persistence failed
    assert result["status"] == "partial_success_db_unpersisted"
    assert result["persisted"] is False
    assert "Database connection lost" in result["db_error"]

def test_orchestrator_evaluation_workflow_patches_roadmap():
    mock_sb = MagicMock()
    mock_table = MagicMock()
    mock_sb.table.return_value = mock_table
    mock_table.select.return_value = mock_table
    mock_table.insert.return_value = mock_table
    mock_table.eq.return_value = mock_table
    mock_table.order.return_value = mock_table
    mock_table.limit.return_value = mock_table
    mock_table.maybe_single.return_value = mock_table

    # Mock roadmaps & phases
    mock_table.execute.return_value = MagicMock(data=[{"id": "phase-1"}])

    agent = OrchestratorAgent(supabase_client=mock_sb)
    result = agent.run_evaluation_workflow(
        user_id="user-1",
        attempt_id="att-1",
        score_percentage=40.0,
        weak_topics=["Scope", "Hoisting"]
    )

    assert result["status"] == "success"
    assert result["evaluation"]["verified"] is False
    assert len(result["evaluation"]["remedial_activities"]) > 0
    assert result["persisted"] is True
