from typing import List, Dict, Any
from models import (
    RoadmapRecommendationResult,
    PhaseItem,
    ActivityItem,
    ResourceItem,
    SkillAnalysisResult,
    CareerIntelligenceResult
)

# Verified, verified resource catalog mapping
VERIFIED_RESOURCE_CATALOG = {
    "javascript": [
        ResourceItem(title="MDN Web Docs: JavaScript Guide", url="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide", source="MDN"),
        ResourceItem(title="JavaScript.info: Modern JavaScript Tutorial", url="https://javascript.info", source="JavaScript.info"),
        ResourceItem(title="freeCodeCamp: JavaScript Algorithms & Data Structures", url="https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/", source="freeCodeCamp")
    ],
    "react": [
        ResourceItem(title="React Official Documentation: Quick Start & Hooks", url="https://react.dev/learn", source="React.dev"),
        ResourceItem(title="freeCodeCamp: React Full Tutorial for Beginners", url="https://www.freecodecamp.org/news/react-beginner-handbook/", source="freeCodeCamp")
    ],
    "node.js": [
        ResourceItem(title="Node.js Official Documentation & Guides", url="https://nodejs.org/en/docs", source="Node.js"),
        ResourceItem(title="MDN: Express Web Framework (Node.js)", url="https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Server-side/Express_Nodejs", source="MDN")
    ],
    "python": [
        ResourceItem(title="Python 3 Official Tutorial", url="https://docs.python.org/3/tutorial/", source="Python.org"),
        ResourceItem(title="Real Python: Intermediate & Advanced Python Tutorials", url="https://realpython.com", source="Real Python")
    ],
    "sql": [
        ResourceItem(title="PostgreSQL Official Documentation", url="https://www.postgresql.org/docs/", source="PostgreSQL"),
        ResourceItem(title="SQLZoo: Interactive SQL Tutorials", url="https://sqlzoo.net", source="SQLZoo")
    ],
    "machine learning": [
        ResourceItem(title="Scikit-Learn Official User Guide", url="https://scikit-learn.org/stable/user_guide.html", source="Scikit-Learn"),
        ResourceItem(title="Fast.ai: Practical Deep Learning for Coders", url="https://course.fast.ai", source="fast.ai")
    ],
    "html5": [
        ResourceItem(title="MDN Web Docs: HTML Elements & Structure", url="https://developer.mozilla.org/en-US/docs/Web/HTML", source="MDN")
    ],
    "css3": [
        ResourceItem(title="CSS-Tricks: Complete Guide to Flexbox & Grid", url="https://css-tricks.com", source="CSS-Tricks")
    ],
    "rest apis": [
        ResourceItem(title="RESTful API Design Best Practices", url="https://learn.microsoft.com/en-us/azure/architecture/best-practices/api-design", source="Microsoft Learn")
    ],
    "git": [
        ResourceItem(title="Pro Git Book (Free Community Edition)", url="https://git-scm.com/book/en/v2", source="Git-SCM")
    ]
}

class LearningRecommendationAgent:
    """
    Agent 4: Learning Recommendation Agent
    Responsibilities:
    - Generate structured, personalized multi-phase roadmaps.
    - Adapt curriculum complexity based on learner's existing skills vs gaps.
    - Attach real, verifiable learning resources from trusted catalogs (never invent URLs).
    """

    @staticmethod
    def generate_roadmap(
        career_title: str,
        skill_analysis: SkillAnalysisResult,
        career_intelligence: CareerIntelligenceResult,
        existing_version: int = 1
    ) -> RoadmapRecommendationResult:
        gaps = skill_analysis.skill_gaps
        priority_names = skill_analysis.priority_skills
        readiness = career_intelligence.readiness_score

        phases: List[PhaseItem] = []

        # Phase 1: High Priority Gaps & Foundations
        p1_activities: List[ActivityItem] = []
        for gap in gaps[:2]:
            s_name = gap["skill_name"]
            resources = VERIFIED_RESOURCE_CATALOG.get(s_name.lower(), [
                ResourceItem(title=f"{s_name} Official Documentation", url="https://devdocs.io", source="DevDocs")
            ])
            p1_activities.append(ActivityItem(
                title=f"Core Foundations & Principles: {s_name}",
                description=f"Close initial proficiency gap in {s_name}. Target minimum mastery level: {gap['required_level']}%.",
                activity_type="reading",
                priority="critical",
                estimated_hours=4.0,
                resources=resources
            ))
            p1_activities.append(ActivityItem(
                title=f"Interactive Coding Drills: {s_name}",
                description=f"Complete functional coding exercises and implementation tasks on {s_name}.",
                activity_type="exercise",
                priority="high",
                estimated_hours=5.0,
                resources=resources[:1]
            ))

        phases.append(PhaseItem(
            phase_number=1,
            title="Phase 1: Core Fundamentals & Primary Gap Closure",
            description=f"Targeting critical competencies for {career_title}: {', '.join(priority_names[:2])}.",
            estimated_hours=18,
            activities=p1_activities
        ))

        # Phase 2: Architectural Synthesis & Integration
        p2_activities: List[ActivityItem] = []
        for gap in gaps[2:4]:
            s_name = gap["skill_name"]
            resources = VERIFIED_RESOURCE_CATALOG.get(s_name.lower(), [
                ResourceItem(title=f"{s_name} Guide", url="https://devdocs.io", source="DevDocs")
            ])
            p2_activities.append(ActivityItem(
                title=f"System Integration & Patterns: {s_name}",
                description=f"Design production patterns using {s_name} within multi-tier architectures.",
                activity_type="reading",
                priority="high",
                estimated_hours=5.0,
                resources=resources
            ))

        p2_activities.append(ActivityItem(
            title=f"Architectural Mini-Project for {career_title}",
            description="Build an integrated service showcasing your combined verified skills.",
            activity_type="project",
            priority="high",
            estimated_hours=10.0,
            resources=[]
        ))

        phases.append(PhaseItem(
            phase_number=2,
            title="Phase 2: Architectural Patterns & Integration",
            description="Connecting foundational languages with persistence, APIs, and state systems.",
            estimated_hours=20,
            activities=p2_activities
        ))

        # Phase 3: Production Polish & Capstone Engineering
        phases.append(PhaseItem(
            phase_number=3,
            title=f"Phase 3: Production Engineering Capstone ({career_title})",
            description="End-to-end deployment, automated testing suite, and CI/CD workflow.",
            estimated_hours=25,
            activities=[
                ActivityItem(
                    title="Automated Test Harness & Linting",
                    description="Unit testing, integration coverage, and code quality workflows.",
                    activity_type="exercise",
                    priority="medium",
                    estimated_hours=6.0,
                    resources=[ResourceItem(title="Martin Fowler: Testing Strategies", url="https://martinfowler.com/articles/practical-test-pyramid.html", source="Martin Fowler")]
                ),
                ActivityItem(
                    title="Production Portfolio Deployment",
                    description=f"Deploy comprehensive showcase application demonstrating all required {career_title} criteria.",
                    activity_type="project",
                    priority="critical",
                    estimated_hours=14.0,
                    resources=[]
                )
            ]
        ))

        return RoadmapRecommendationResult(
            version=existing_version,
            readiness_score=readiness,
            phases=phases
        )
