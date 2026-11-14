# PromptWars — AI-Powered Personalized Learning & Career Intelligence Platform

## 🚀 Live Deployment

| Service | URL |
|---|---|
| **Frontend Application** | [https://promptwar2-2qoo.vercel.app/](https://promptwar2-2qoo.vercel.app/) |
| **AI Backend API** | [https://promptwars-ai-backend.onrender.com](https://promptwars-ai-backend.onrender.com) |
| **Backend Health Check** | [https://promptwars-ai-backend.onrender.com/health](https://promptwars-ai-backend.onrender.com/health) |

---

> **PromptWars Hackathon Submission** — A unified, AI-orchestrated platform that analyzes your skills, matches you to careers, generates adaptive learning roadmaps, and guides you with a real-time AI Mentor powered by Google Gemini 2.0 Flash.

---

## 📋 Table of Contents

1. [Project Overview](#-project-overview)
2. [Live Demo & Repositories](#-live-demo--repositories)
3. [Architecture](#-architecture)
4. [Feature Modules](#-feature-modules)
5. [Tech Stack](#-tech-stack)
6. [Repository Structure](#-repository-structure)
7. [Local Development Setup](#-local-development-setup)
8. [Database Setup (Supabase)](#-database-setup-supabase)
9. [Environment Variables](#-environment-variables)
10. [Deployment — Frontend on Vercel](#-deployment--frontend-on-vercel)
11. [Deployment — AI Backend on Render](#-deployment--ai-backend-on-render)
12. [AI Multi-Agent Architecture](#-ai-multi-agent-architecture)
13. [Dual-Track Assessment Strategy](#-dual-track-assessment-strategy)
14. [API Reference](#-api-reference)
15. [Troubleshooting Guide](#-troubleshooting-guide)

---

## 🎯 Project Overview

PromptWars is a complete, full-stack AI-driven career guidance and personalized learning ecosystem designed for the PromptWars Hackathon. It integrates working assets from two predecessor repositories (Skill-Bridge and Test-Portal) into a unified architecture, powered by a Python multi-agent orchestration backend and Supabase.

### Core Capabilities

| Capability | What PromptWars Delivers |
|---|---|
| **Skill Profiling & Validation** | Self-report proficiencies (0–100%) and validate them via skill-linked MCQ tests. |
| **Weighted Career Matching** | Mathematical, weighted career readiness matching against 9 pre-configured industry profiles. |
| **Dynamic Roadmap Generation** | Multi-phase milestone roadmap generation that adapts to prior competencies and excludes mastered topics. |
| **AI Mentor Cockpit** | Context-aware Google Gemini 2.0 Flash mentor grounded in live learner database state. |
| **Dual Assessment Track** | In-app theory verification via Supabase MCQs + dedicated redirection link to the coding sandbox. |
| **Telemetry & Analytics** | Real-time tracking of readiness velocity, skill progress timeline, and phase completion. |

---

## 🌐 Live Demo & Repositories

| Component | Target URL / Reference |
|---|---|
| **GitHub Repository** | [https://github.com/DeepakUK17/promptwar2](https://github.com/DeepakUK17/promptwar2) |
| **Frontend Application** | [https://promptwar2-2qoo.vercel.app/](https://promptwar2-2qoo.vercel.app/) |
| **AI Orchestration Service** | [https://promptwars-ai-backend.onrender.com](https://promptwars-ai-backend.onrender.com) |
| **Dedicated Coding Lab** | [https://test-portal-sage.vercel.app](https://test-portal-sage.vercel.app) |
| **Supabase Project** | `https://loryeipllwjmcazsjyee.supabase.co` |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT BROWSER                           │
│                                                             │
│  React 18 + TypeScript + Vite + Tailwind + Radix UI         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│  │ Dashboard│ │  Skills  │ │  Career  │ │  AI Mentor   │  │
│  │ Profile  │ │ Manager  │ │ Matching │ │  Chat UI     │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └──────┬───────┘  │
└───────┼────────────┼────────────┼───────────────┼──────────┘
        │ (JWT / Anon Key)        │               │ (HTTP / JSON)
        ▼                         ▼               ▼
┌───────────────────────────┐  ┌──────────────────────────────┐
│   SUPABASE PLATFORM       │  │  PYTHON AI BACKEND           │
│   PostgreSQL + Auth (RLS) │  │  FastAPI + Google Gemini     │
│                           │  │                              │
│  Tables:                  │  │  Specialized Agents:         │
│  - profiles               │  │  1. OrchestratorAgent        │
│  - skills                 │  │  2. SkillAnalysisAgent       │
│  - learner_skills         │  │  3. CareerIntelligenceAgent  │
│  - career_roles           │  │  4. LearningRecAgent         │
│  - career_required_skills │  │  5. EvaluationAgent          │
│  - assessments            │  │                              │
│  - questions              │  │  Endpoints:                  │
│  - assessment_attempts    │  │  POST /api/agents/career-    │
│  - roadmaps               │  │       selection              │
│  - roadmap_phases         │  │  POST /api/agents/evaluate   │
│  - roadmap_activities     │  │  POST /api/mentor/chat       │
│  - learning_progress      │  │  GET  /health                │
│  - skill_progress_history │  └──────────────────────────────┘
│  - agent_audit_log        │
└───────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────┐
│  DEDICATED CODING LAB (External Environment) │
│  https://test-portal-sage.vercel.app         │
└──────────────────────────────────────────────┘
```

---

## 🧩 Feature Modules

### Module 1: Comprehensive Profile Management
- Tracks user academic degree, institution, current skills, certifications, and target career.
- Row-Level Security (RLS) ensures learners access only their own profile records.
- Auto-sync triggers initialize profile rows upon Supabase authentication signup.

### Module 2: Skill Analysis & Validation
- Standardized skill catalog across 50+ programming, cloud, database, and architectural competencies.
- Self-reported skill calibration paired with objective assessment verification.
- Dynamic skill gap analysis: isolates missing competencies and flags weak assessment areas.

### Module 3: Transparent Career Matching
- Evaluates learner profile against 9 predefined career tracks:
  - *Full Stack Developer, Frontend Developer, Backend Developer, Data Scientist, Machine Learning Engineer, AI Engineer, Data Analyst, Cloud Engineer, Cybersecurity Analyst*.
- **Deterministic Mathematical Formula**:
  $$\text{Career Readiness Score} = \frac{\sum (\text{Learner Proficiency}_i \times \text{Skill Weight}_i)}{\sum (100 \times \text{Skill Weight}_i)} \times 100$$
- Visualizes key strengths, critical deficits, and weighted impact factors.

### Module 4: Adaptive Personalized Roadmap
- AI-synthesized multi-phase milestones (Foundations, Core Stack, Advanced Patterns, Capstone Integration).
- Skips introductory modules for skills already verified at intermediate or advanced levels.
- Curated resource links to authoritative documentation and hands-on platforms (MDN, freeCodeCamp, official docs).

### Module 5: Progress Telemetry & Auditing
- Tracks roadmap phase velocity, completed activities, and examination scores.
- Historical skill proficiency auditing via `skill_progress_history`.
- Agent action traceability via `agent_audit_log`.

### Module 6: Grounded AI Mentor
- Driven by **Google Gemini 2.0 Flash**.
- Injects dynamic learner state (readiness %, gaps, weak test questions, career path) into system prompts.
- Delivers actionable study directives, concept explanations, and practical assignment guidance.

---

## 🛠️ Tech Stack

### Frontend Application
- **Runtime & Build**: Node.js, Vite 5, React 18, TypeScript 5
- **Routing**: React Router DOM v6
- **Data Fetching & State**: TanStack Query (React Query) v5
- **UI Components & Styling**: Tailwind CSS, Radix UI primitives, Lucide React
- **Data Visualization**: Recharts

### AI Microservice Backend
- **Framework**: FastAPI (Python 3.11+)
- **Server**: Uvicorn (ASGI)
- **Validation**: Pydantic v2
- **LLM Engine**: `google-genai` SDK (Google Gemini 2.0 Flash)
- **Database Client**: `supabase-py`

### Persistence & Security
- **Database Engine**: PostgreSQL 15 (Supabase Managed)
- **Authentication**: Supabase Auth (JWT)
- **Access Control**: PostgreSQL Row-Level Security (RLS) policies

---

## 📁 Repository Structure

```
promptwar2/                          ← Root repository directory
├── promptwars/                      ← Primary frontend application
│   ├── src/
│   │   ├── components/              ← Navigation, Markdown, and UI primitives
│   │   ├── hooks/                   ← React Query hooks for Skills, Careers, Roadmap, Mentor
│   │   ├── integrations/supabase/   ← Supabase JS client and auto-generated database types
│   │   ├── lib/                     ← Auth utilities and weighted career calculation engine
│   │   ├── pages/                   ← 13 application views (Dashboard, Skills, Career, Exam, Mentor)
│   │   ├── App.tsx                  ← Application router and providers
│   │   └── main.tsx                 ← React DOM bootstrapping
│   ├── supabase/
│   │   └── FULL_SETUP.sql           ← Consolidated PostgreSQL migration and seed dataset
│   ├── package.json                 ← Frontend dependencies and scripts
│   └── .env.example                 ← Frontend environment variable template
│
├── promptwars-ai/                   ← Python AI multi-agent backend
│   ├── agents/
│   │   ├── orchestrator.py          ← Agent 1: Workflow orchestration & state persistence
│   │   ├── skill_analysis.py        ← Agent 2: Gap analysis & deficit tagging
│   │   ├── career_intelligence.py   ← Agent 3: Mathematical weighted readiness index
│   │   ├── learning_recommendation.py ← Agent 4: Adaptive multi-phase curriculum synthesis
│   │   └── evaluation.py            ← Agent 5: Assessment grading & remedial curriculum patching
│   ├── main.py                      ← FastAPI routes and Gemini mentor chat endpoint
│   ├── config.py                    ← Configuration and environment loaders
│   ├── models.py                    ← Pydantic schemas for multi-agent payloads
│   ├── requirements.txt             ← Python dependencies
│   └── .env.example                 ← AI backend environment variable template
│
├── Skill-Bridge/                    ← Preserved original repository
├── Test-Portal/                     ← Preserved original repository
└── README.md                        ← Comprehensive system documentation
```

---

## 💻 Local Development Setup

### Prerequisites
- Node.js (v18+) and npm (v9+)
- Python (v3.11+)
- Supabase account & project
- Google Gemini API key

---

### Step 1: Clone Repository
```bash
git clone https://github.com/DeepakUK17/promptwar2.git
cd promptwar2
```

---

### Step 2: Database Initialization (Supabase)
1. Navigate to your Supabase project: [https://supabase.com/dashboard](https://supabase.com/dashboard).
2. Go to **SQL Editor** -> **New Query**.
3. Open `promptwars/supabase/FULL_SETUP.sql`, copy all contents, paste into the query window, and click **Run**.
4. Configure Authentication:
   - Navigate to **Authentication** -> **Providers** -> **Email**.
   - Toggle **"Confirm email"** to **OFF** (enables immediate session initialization upon signup).
   - Save changes.

---

### Step 3: Frontend Setup
```bash
cd promptwars
```
Create a `.env` file based on `.env.example`:
```env
VITE_SUPABASE_PROJECT_ID="your_project_id"
VITE_SUPABASE_URL="https://your_project_id.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your_supabase_anon_key"
VITE_AI_BACKEND_URL="http://localhost:9002"
```

Install dependencies and start development server:
```bash
npm install
npm run dev
```
*Frontend runs at `http://localhost:5173`.*

---

### Step 4: AI Backend Setup
In a new terminal window:
```bash
cd promptwars-ai
```
Create a `.env` file based on `.env.example`:
```env
SUPABASE_URL="https://your_project_id.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your_supabase_service_role_secret"
GOOGLE_API_KEY="your_google_gemini_api_key"
FRONTEND_ORIGIN="http://localhost:5173"
PORT=9002
```

Install Python packages and launch server:
```bash
pip install -r requirements.txt
python main.py
```
*AI backend runs at `http://localhost:9002`.*

---

## 🗄️ Database Setup (Supabase)

`FULL_SETUP.sql` provisions 14 production-ready relational tables:

| Table Name | Purpose |
|---|---|
| `profiles` | Extended learner profiles (degree, institution, target career, bio). |
| `skills` | Master skill library containing technical and architectural skills. |
| `learner_skills` | Junction table tracking learner proficiency per skill (0–100%). |
| `career_roles` | Career role specifications and industry domain classifications. |
| `career_required_skills`| Required competencies with relative weights (1–5) and target levels. |
| `assessments` | MCQ assessment metadata linked directly to target skills. |
| `questions` | Question bank with multiple-choice options, correct index, and explanations. |
| `assessment_attempts` | Historical record of submitted tests, scores, and calculated percentages. |
| `roadmaps` | Active and archived learner roadmaps. |
| `roadmap_phases` | Sequential milestones comprising each roadmap. |
| `roadmap_activities` | Granular tasks (videos, documentation, coding exercises, mini-projects). |
| `learning_progress` | Activity completion records. |
| `skill_progress_history`| Audit timeline of proficiency changes over time. |
| `agent_audit_log` | Diagnostic log of automated AI multi-agent actions. |

---

## 🔐 Environment Variables

### Frontend Variables (`promptwars/.env`)
| Variable | Mandatory | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | Yes | Target Supabase project base HTTPS endpoint. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Yes | Public Supabase anon JWT key (`eyJ...`). |
| `VITE_AI_BACKEND_URL` | Yes | AI microservice endpoint (`http://localhost:9002` or Render URL). |

### AI Backend Variables (`promptwars-ai/.env`)
| Variable | Mandatory | Description |
|---|---|---|
| `SUPABASE_URL` | Yes | Supabase project URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role key for administrative DB updates (`sb_secret_...`). |
| `GOOGLE_API_KEY` | Yes | Google Gemini API key used by `google-genai`. |
| `FRONTEND_ORIGIN` | Yes | Allowed frontend origin for CORS resolution. |
| `PORT` | No | Listening port (defaults to 9002). |

---

## 🚀 Deployment — Frontend on Vercel

### Option A: Using the Vercel Dashboard

1. Push your latest code to your GitHub repository:
   ```bash
   git push origin main
   ```
2. Open [https://vercel.com](https://vercel.com) and log in.
3. Click **"Add New..."** -> **"Project"**.
4. Import your repository: `DeepakUK17/promptwar2`.
5. Configure project parameters:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `promptwars` *(Click "Edit" and choose the `promptwars` subfolder)*
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
6. Expand **Environment Variables** and insert:
   - `VITE_SUPABASE_URL` = `https://loryeipllwjmcazsjyee.supabase.co`
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = `your_supabase_anon_key`
   - `VITE_AI_BACKEND_URL` = `https://your-render-backend-url.onrender.com`
7. Click **Deploy**.
8. After deployment, navigate to Supabase Dashboard -> **Authentication** -> **URL Configuration**, and append your new Vercel production domain to **Redirect URLs**.

### Option B: Using the Vercel CLI
```bash
npm install -g vercel
vercel login
cd d:\PromptWar2\promptwars
vercel --prod
```

---

## 🚀 Deployment — AI Backend on Render

1. Log into [https://render.com](https://render.com).
2. Click **"New +"** -> **"Web Service"**.
3. Link your GitHub account and select `DeepakUK17/promptwar2`.
4. Configure service parameters:
   - **Name**: `promptwars-ai-backend`
   - **Region**: Singapore or nearest geographical region
   - **Branch**: `main`
   - **Root Directory**: `promptwars-ai`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python main.py`
   - **Instance Type**: `Free`
5. Navigate to the **Environment** tab and add the required environment variables:
   - `SUPABASE_URL` = `https://loryeipllwjmcazsjyee.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` = `your_rotated_supabase_service_role_key`
   - `GOOGLE_API_KEY` = `your_gemini_api_key`
   - `FRONTEND_ORIGIN` = `https://your-vercel-app.vercel.app`
   - `PORT` = `10000` *(Render sets this automatically; main.py reads the environment variable)*
6. Click **Create Web Service**.
7. Test the deployed service once the build completes:
   ```bash
   curl https://promptwars-ai-backend.onrender.com/health
   ```

---

## 🤖 AI Multi-Agent Architecture

The AI subsystem operates as an integrated multi-agent pipeline:

```
[User Action] ──> [Orchestrator Agent]
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
[Career Intelligence] [Skill Analysis] [Learning Recommendation]
        │                │                │
        └────────────────┼────────────────┘
                         ▼
                [Evaluation Agent]
                         │
                         ▼
        [Supabase DB / Audit Logging]
```

1. **OrchestratorAgent**: Entry point and workflow coordinator. Manages multi-agent execution pipelines, database transactions, and diagnostic audit logs.
2. **CareerIntelligenceAgent**: Evaluates the mathematical weighted readiness equation against career benchmarks.
3. **SkillAnalysisAgent**: Pinpoints verified strengths and classifies critical skill gaps.
4. **LearningRecommendationAgent**: Dynamically synthesizes an adaptive, multi-phase curriculum populated with real documentation resources.
5. **EvaluationAgent**: Calibrates proficiency indices based on exam submissions and injects remedial coursework for weak sub-topics.

---

## 📊 Dual-Track Assessment Strategy

PromptWars implements a dual-track assessment model:

1. **Integrated MCQ Verification (Theory & Architecture)**:
   - Native exam interface built directly into the PromptWars dashboard.
   - Skill-specific question sets tied to database skill records.
   - Real-time question navigation, submission grading, and instant proficiency updates.

2. **Specialized Coding Lab (Practical Implementation)**:
   - Dedicated external coding environment: [https://test-portal-sage.vercel.app](https://test-portal-sage.vercel.app).
   - Designed for live code execution, test cases, and algorithmic verification.
   - Seamlessly integrated into the navigation bar and assessment portal via direct links.

---

## 📡 API Reference

### Health Check
`GET /health`
```json
{
  "status": "healthy",
  "service": "PromptWars AI Engine",
  "gemini_connected": true,
  "agents": [
    "OrchestratorAgent",
    "SkillAnalysisAgent",
    "CareerIntelligenceAgent",
    "LearningRecommendationAgent",
    "EvaluationAgent"
  ]
}
```

### Career Selection Workflow
`POST /api/agents/career-selection`
```json
// Request
{
  "user_id": "8c459f21-7b0a-4a5d-b2a1-000000000000",
  "career_role_id": "3d5f9b12-1a2b-3c4d-5e6f-7a8b9c0d1e2f",
  "reason": "career_selection"
}
```

### Assessment Evaluation Workflow
`POST /api/agents/evaluate`
```json
// Request
{
  "user_id": "8c459f21-7b0a-4a5d-b2a1-000000000000",
  "attempt_id": "7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d",
  "score_percentage": 85.0,
  "weak_topics": ["Event Loop", "Closures"],
  "skill_id": "2b3c4d5e-6f7a-8b9c-0d1e-2f3a4b5c6d7e"
}
```

### AI Mentor Chat
`POST /api/mentor/chat`
```json
// Request
{
  "user_id": "8c459f21-7b0a-4a5d-b2a1-000000000000",
  "message": "What should I focus on today to accelerate my Full Stack progress?",
  "context": {
    "targetCareer": "Full Stack Developer",
    "readinessScore": 64,
    "skillGaps": ["Node.js", "Docker", "PostgreSQL"],
    "currentPhase": "Phase 2: Backend Architecture",
    "weakTopics": ["Asynchronous I/O"]
  }
}
```

---

## 🔧 Troubleshooting Guide

| Issue | Root Cause | Solution |
|---|---|---|
| Registration returns 401 Unauthorized | Service role secret key used in client browser. | Replace frontend key with the Supabase **anon public key** (`eyJ...`). |
| Registration succeeds but fails to auto-login | "Confirm email" is enabled in Supabase project. | Disable "Confirm email" in Supabase Authentication -> Providers -> Email settings. |
| Career Readiness displays 0% | Database migrations have not been applied. | Run `promptwars/supabase/FULL_SETUP.sql` inside the Supabase SQL Editor. |
| AI Mentor reports fallback message | Backend unreachable or Gemini API key unconfigured. | Verify `GOOGLE_API_KEY` in `promptwars-ai/.env` and confirm the backend is running on port 9002. |
| Render Free Tier cold start latency | Free instances spin down after inactivity. | Ping the `/health` endpoint 1 minute prior to live presentation or demo. |

---

## 📄 License & Attribution

Developed for the **PromptWars Hackathon**. Incorporates and refactors architectural concepts from open-source baselines `Skill-Bridge` and `Test-Portal`. All original code remains with respective contributors.
