-- ====================================================================
-- PromptWars Platform: Core Database Schema Migration
-- ====================================================================

-- 1. Extend profiles table
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('volunteer', 'ngo', 'learner', 'student', 'admin'));

ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS degree TEXT,
  ADD COLUMN IF NOT EXISTS institution TEXT,
  ADD COLUMN IF NOT EXISTS target_career_id UUID,
  ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS completed_projects JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS learning_hours_total INT DEFAULT 0;

-- Update trigger function for profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'role', 'learner')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = CASE WHEN EXCLUDED.full_name <> '' THEN EXCLUDED.full_name ELSE profiles.full_name END;
  RETURN new;
END;
$$;

-- 2. Skills Catalog
CREATE TABLE IF NOT EXISTS public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL DEFAULT 'technical', -- 'technical', 'non-technical'
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Learner Skills (self-reported + assessed proficiency)
CREATE TABLE IF NOT EXISTS public.learner_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  self_reported_level INT DEFAULT 0 CHECK (self_reported_level BETWEEN 0 AND 100),
  assessed_level INT CHECK (assessed_level IS NULL OR assessed_level BETWEEN 0 AND 100),
  verified BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, skill_id)
);

-- 4. Career Roles Catalog
CREATE TABLE IF NOT EXISTS public.career_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  recommended_experience TEXT,
  relevant_areas JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraint to profiles.target_career_id now that career_roles exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_target_career_id_fkey'
  ) THEN
    ALTER TABLE public.profiles 
      ADD CONSTRAINT profiles_target_career_id_fkey 
      FOREIGN KEY (target_career_id) REFERENCES public.career_roles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 5. Career Required Skills (with weights & minimum proficiency)
CREATE TABLE IF NOT EXISTS public.career_required_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  career_role_id UUID NOT NULL REFERENCES public.career_roles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  min_proficiency INT DEFAULT 60 CHECK (min_proficiency BETWEEN 0 AND 100),
  weight FLOAT DEFAULT 1.0 CHECK (weight > 0),
  UNIQUE(career_role_id, skill_id)
);

-- 6. MCQ Assessments Catalog
CREATE TABLE IF NOT EXISTS public.assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  skill_id UUID REFERENCES public.skills(id) ON DELETE SET NULL,
  description TEXT,
  duration_minutes INT DEFAULT 15,
  passing_score INT DEFAULT 60,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Assessment Questions
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  difficulty TEXT DEFAULT 'MEDIUM' CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')),
  topic TEXT,
  marks INT DEFAULT 1,
  options JSONB NOT NULL, -- array of {id: string, text: string, is_correct: boolean}
  explanation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Assessment Attempts
CREATE TABLE IF NOT EXISTS public.assessment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assessment_id UUID REFERENCES public.assessments(id) ON DELETE SET NULL,
  skill_id UUID REFERENCES public.skills(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  score INT DEFAULT 0,
  total_marks INT DEFAULT 0,
  percentage FLOAT DEFAULT 0,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'abandoned')),
  answers JSONB DEFAULT '{}'::jsonb, -- map of question_id -> selected_option_id
  source TEXT DEFAULT 'native_mcq' CHECK (source IN ('native_mcq', 'coding_lab')),
  weak_topics JSONB DEFAULT '[]'::jsonb
);

-- 9. Learning Roadmaps (Versioned)
CREATE TABLE IF NOT EXISTS public.learning_roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  career_role_id UUID REFERENCES public.career_roles(id) ON DELETE SET NULL,
  version INT DEFAULT 1,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  readiness_score FLOAT DEFAULT 0,
  change_reason TEXT, -- 'initial', 'career_goal_change', 'poor_assessment'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  archived_at TIMESTAMPTZ
);

-- 10. Roadmap Phases
CREATE TABLE IF NOT EXISTS public.roadmap_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_id UUID NOT NULL REFERENCES public.learning_roadmaps(id) ON DELETE CASCADE,
  phase_number INT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  estimated_hours INT DEFAULT 10,
  order_index INT DEFAULT 0
);

-- 11. Learning Activities
CREATE TABLE IF NOT EXISTS public.learning_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id UUID NOT NULL REFERENCES public.roadmap_phases(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES public.skills(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('video', 'reading', 'exercise', 'project', 'assessment', 'remedial')),
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  estimated_hours FLOAT DEFAULT 2.0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  completed_at TIMESTAMPTZ,
  order_index INT DEFAULT 0
);

-- 12. Learning Resources (Curated URLs)
CREATE TABLE IF NOT EXISTS public.learning_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES public.learning_activities(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL DEFAULT 'url' CHECK (resource_type IN ('url', 'doc', 'video')),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  source TEXT
);

-- 13. Learning Progress Log
CREATE TABLE IF NOT EXISTS public.learning_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES public.learning_activities(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  time_spent_minutes INT DEFAULT 0,
  notes TEXT
);

-- 14. AI Agent Execution Logs
CREATE TABLE IF NOT EXISTS public.agent_execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  trigger_event TEXT NOT NULL, -- 'career_selection', 'assessment_complete', 'career_goal_change', 'mentor_query'
  agents_used TEXT[] NOT NULL DEFAULT '{}',
  input_payload JSONB DEFAULT '{}'::jsonb,
  output_payload JSONB DEFAULT '{}'::jsonb,
  duration_ms INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. AI Mentor Conversations
CREATE TABLE IF NOT EXISTS public.mentor_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  agent_context JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learner_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_required_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_execution_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_conversations ENABLE ROW LEVEL SECURITY;

-- Public readable reference tables
CREATE POLICY "Public read for skills" ON public.skills FOR SELECT USING (true);
CREATE POLICY "Public read for career_roles" ON public.career_roles FOR SELECT USING (true);
CREATE POLICY "Public read for career_required_skills" ON public.career_required_skills FOR SELECT USING (true);
CREATE POLICY "Public read for assessments" ON public.assessments FOR SELECT USING (true);
CREATE POLICY "Public read for questions" ON public.questions FOR SELECT USING (true);
CREATE POLICY "Public read for learning_resources" ON public.learning_resources FOR SELECT USING (true);

-- User-scoped tables
CREATE POLICY "Learner skills: user manage" ON public.learner_skills
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Assessment attempts: user manage" ON public.assessment_attempts
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Learning roadmaps: user manage" ON public.learning_roadmaps
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Roadmap phases: user view" ON public.roadmap_phases
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.learning_roadmaps r WHERE r.id = roadmap_id AND r.user_id = auth.uid()
  ));

CREATE POLICY "Roadmap phases: user update" ON public.roadmap_phases
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.learning_roadmaps r WHERE r.id = roadmap_id AND r.user_id = auth.uid()
  ));

CREATE POLICY "Learning activities: user view" ON public.learning_activities
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.roadmap_phases p
    JOIN public.learning_roadmaps r ON r.id = p.roadmap_id
    WHERE p.id = phase_id AND r.user_id = auth.uid()
  ));

CREATE POLICY "Learning activities: user update" ON public.learning_activities
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.roadmap_phases p
    JOIN public.learning_roadmaps r ON r.id = p.roadmap_id
    WHERE p.id = phase_id AND r.user_id = auth.uid()
  ));

CREATE POLICY "Learning progress: user manage" ON public.learning_progress
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Agent execution logs: user view" ON public.agent_execution_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Mentor conversations: user manage" ON public.mentor_conversations
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
