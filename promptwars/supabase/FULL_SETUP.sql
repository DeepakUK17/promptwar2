-- ====================================================================
-- PROMPTWARS PLATFORM: COMPLETE CONSOLIDATED SETUP FOR NEW SUPABASE PROJECT
-- Project URL: https://loryeipllwjmcazsjyee.supabase.co
-- Run this entire script in Supabase Dashboard -> SQL Editor -> New Query
-- ====================================================================

-- Enable pgcrypto
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'learner' CHECK (role IN ('volunteer', 'ngo', 'learner', 'student', 'admin')),
  skills TEXT[] DEFAULT '{}',
  location TEXT,
  bio TEXT,
  degree TEXT,
  institution TEXT,
  target_career_id UUID,
  certifications JSONB DEFAULT '[]'::jsonb,
  completed_projects JSONB DEFAULT '[]'::jsonb,
  learning_hours_total INT DEFAULT 0,
  organization_name TEXT,
  organization_description TEXT,
  website_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger for new user signup
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. SKILLS CATALOG
CREATE TABLE IF NOT EXISTS public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL DEFAULT 'technical',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. LEARNER SKILLS
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

-- 4. CAREER ROLES CATALOG
CREATE TABLE IF NOT EXISTS public.career_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  recommended_experience TEXT,
  relevant_areas JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link profiles.target_career_id foreign key
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

-- 5. CAREER REQUIRED SKILLS
CREATE TABLE IF NOT EXISTS public.career_required_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  career_role_id UUID NOT NULL REFERENCES public.career_roles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  min_proficiency INT DEFAULT 60 CHECK (min_proficiency BETWEEN 0 AND 100),
  weight FLOAT DEFAULT 1.0 CHECK (weight > 0),
  UNIQUE(career_role_id, skill_id)
);

-- 6. ASSESSMENTS
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

-- 7. QUESTIONS
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  difficulty TEXT DEFAULT 'MEDIUM' CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')),
  topic TEXT,
  marks INT DEFAULT 1,
  options JSONB NOT NULL,
  explanation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ASSESSMENT ATTEMPTS
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
  answers JSONB DEFAULT '{}'::jsonb,
  source TEXT DEFAULT 'native_mcq' CHECK (source IN ('native_mcq', 'coding_lab')),
  weak_topics JSONB DEFAULT '[]'::jsonb
);

-- 9. LEARNING ROADMAPS
CREATE TABLE IF NOT EXISTS public.learning_roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  career_role_id UUID REFERENCES public.career_roles(id) ON DELETE SET NULL,
  version INT DEFAULT 1,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  readiness_score FLOAT DEFAULT 0,
  change_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  archived_at TIMESTAMPTZ
);

-- 10. ROADMAP PHASES
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

-- 11. LEARNING ACTIVITIES
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

-- 12. LEARNING RESOURCES
CREATE TABLE IF NOT EXISTS public.learning_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES public.learning_activities(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL DEFAULT 'url' CHECK (resource_type IN ('url', 'doc', 'video')),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  source TEXT
);

-- 13. LEARNING PROGRESS
CREATE TABLE IF NOT EXISTS public.learning_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES public.learning_activities(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  time_spent_minutes INT DEFAULT 0,
  notes TEXT
);

-- 14. AGENT EXECUTION LOGS
CREATE TABLE IF NOT EXISTS public.agent_execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  trigger_event TEXT NOT NULL,
  agents_used TEXT[] NOT NULL DEFAULT '{}',
  input_payload JSONB DEFAULT '{}'::jsonb,
  output_payload JSONB DEFAULT '{}'::jsonb,
  duration_ms INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. MENTOR CONVERSATIONS
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

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
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

CREATE POLICY "Profiles view" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Profiles update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Profiles insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Public read skills" ON public.skills FOR SELECT USING (true);
CREATE POLICY "Public read career_roles" ON public.career_roles FOR SELECT USING (true);
CREATE POLICY "Public read career_required_skills" ON public.career_required_skills FOR SELECT USING (true);
CREATE POLICY "Public read assessments" ON public.assessments FOR SELECT USING (true);
CREATE POLICY "Public read questions" ON public.questions FOR SELECT USING (true);
CREATE POLICY "Public read learning_resources" ON public.learning_resources FOR SELECT USING (true);

CREATE POLICY "Learner skills manage" ON public.learner_skills
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Assessment attempts manage" ON public.assessment_attempts
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Learning roadmaps manage" ON public.learning_roadmaps
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Roadmap phases manage" ON public.roadmap_phases
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.learning_roadmaps r WHERE r.id = roadmap_id AND r.user_id = auth.uid()
  ));

CREATE POLICY "Learning activities manage" ON public.learning_activities
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.roadmap_phases p
    JOIN public.learning_roadmaps r ON r.id = p.roadmap_id
    WHERE p.id = phase_id AND r.user_id = auth.uid()
  ));

CREATE POLICY "Learning progress manage" ON public.learning_progress
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Agent execution logs manage" ON public.agent_execution_logs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Mentor conversations manage" ON public.mentor_conversations
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ====================================================================
-- SEED DATA
-- ====================================================================

-- 1. SEED SKILLS
INSERT INTO public.skills (name, category, description) VALUES
  ('Python', 'technical', 'High-level programming language used in backend development, data science, and scripting.'),
  ('JavaScript', 'technical', 'Core language of the web for client-side interactivity and server-side runtimes.'),
  ('TypeScript', 'technical', 'Typed superset of JavaScript providing static types and modern tooling.'),
  ('React', 'technical', 'Declarative, component-based UI library for modern web applications.'),
  ('Node.js', 'technical', 'JavaScript runtime built on Chrome''s V8 engine for scalable network applications.'),
  ('HTML5', 'technical', 'Standard markup language for documents designed to be displayed in a web browser.'),
  ('CSS3', 'technical', 'Style sheet language used for describing the presentation of a document written in HTML.'),
  ('SQL', 'technical', 'Domain-specific language used in programming and managing relational databases.'),
  ('PostgreSQL', 'technical', 'Powerful, open-source object-relational database system.'),
  ('MongoDB', 'technical', 'Document-oriented NoSQL database program using JSON-like documents.'),
  ('REST APIs', 'technical', 'Architectural style for designing networked applications and web services.'),
  ('Git', 'technical', 'Distributed version control system for tracking changes in source code.'),
  ('Docker', 'technical', 'Platform for developing, shipping, and running applications in containers.'),
  ('Machine Learning', 'technical', 'Field of AI focusing on algorithms that learn from data and improve from experience.'),
  ('Deep Learning', 'technical', 'Subset of machine learning based on artificial neural networks with representation learning.'),
  ('Pandas', 'technical', 'Fast, flexible Python data analysis and manipulation library.'),
  ('NumPy', 'technical', 'Core Python library for scientific computing with multi-dimensional arrays.'),
  ('Scikit-Learn', 'technical', 'Simple and efficient tools for predictive data analysis and machine learning in Python.'),
  ('Data Analysis', 'technical', 'Process of inspecting, cleansing, transforming, and modeling data to discover insights.'),
  ('Cloud Architecture', 'technical', 'Design principles and best practices for building scalable systems in the cloud.'),
  ('AWS', 'technical', 'Comprehensive, evolving cloud computing platform provided by Amazon.'),
  ('Linux', 'technical', 'Open-source Unix-like operating system kernel and command-line environment.'),
  ('Cybersecurity', 'technical', 'Practice of protecting systems, networks, and programs from digital attacks.'),
  ('Problem Solving', 'non-technical', 'Analytical thinking and ability to debug and solve complex challenges.'),
  ('Communication', 'non-technical', 'Clear technical writing and verbal communication with teams and stakeholders.')
ON CONFLICT (name) DO NOTHING;

-- 2. SEED CAREER ROLES
INSERT INTO public.career_roles (title, description, recommended_experience, relevant_areas) VALUES
  (
    'Full Stack Developer',
    'Builds end-to-end web applications covering responsive user interfaces, backend APIs, and database persistence.',
    '1-3 years building frontend and backend web applications',
    '["Frontend Engineering", "Backend APIs", "Database Design", "DevOps Basics"]'::jsonb
  ),
  (
    'Frontend Developer',
    'Crafts interactive, accessible, and high-performance client-side user interfaces and single-page applications.',
    '1-2 years with modern JavaScript frameworks and responsive styling',
    '["Component Architecture", "State Management", "Web Performance", "UI/UX"]'::jsonb
  ),
  (
    'Backend Developer',
    'Designs robust microservices, server-side APIs, database schemas, and background job processing pipelines.',
    '1-3 years with server-side languages, REST/GraphQL, and SQL/NoSQL databases',
    '["API Architecture", "Database Performance", "Security & Auth", "Caching"]'::jsonb
  ),
  (
    'Data Scientist',
    'Extracts actionable business insights and builds predictive statistical models from structured and unstructured data.',
    '1-2 years data wrangling, exploratory data analysis, and predictive modeling',
    '["Exploratory Data Analysis", "Statistical Modeling", "Feature Engineering", "Data Visualization"]'::jsonb
  ),
  (
    'Machine Learning Engineer',
    'Deploys, monitors, and optimizes scalable machine learning and deep learning models into production environments.',
    '2-4 years machine learning lifecycle, MLOps, and model serving',
    '["Model Training", "MLOps Pipelines", "Neural Networks", "Production Inference"]'::jsonb
  ),
  (
    'AI Engineer',
    'Builds intelligent systems leveraging Foundation Models, LLM fine-tuning, RAG pipelines, and multi-agent systems.',
    '1-3 years software engineering with modern LLMs, vector databases, and agent frameworks',
    '["LLM Orchestration", "Prompt Engineering", "Vector Search / RAG", "Autonomous Agents"]'::jsonb
  ),
  (
    'Data Analyst',
    'Analyzes operational data, crafts interactive BI dashboards, and translates data trends into business strategy.',
    '0-2 years SQL querying, dashboard development, and statistical summaries',
    '["SQL Querying", "Dashboarding (Tableau/PowerBI)", "Reporting", "A/B Testing"]'::jsonb
  ),
  (
    'Cloud Engineer',
    'Provisions, automates, and maintains highly available, secure, and cost-effective cloud infrastructure.',
    '2-3 years cloud infrastructure, infrastructure-as-code, and container orchestration',
    '["Cloud Infrastructure", "Docker & Kubernetes", "CI/CD Automation", "Site Reliability"]'::jsonb
  ),
  (
    'Cybersecurity Analyst',
    'Safeguards corporate infrastructure, monitors security telemetry, and conducts vulnerability assessments.',
    '1-3 years network security, threat analysis, and incident response',
    '["Vulnerability Assessment", "Network Defense", "Incident Response", "Identity Management"]'::jsonb
  )
ON CONFLICT (title) DO NOTHING;

-- 3. LINK CAREER REQUIRED SKILLS
DO $$
DECLARE
  fs_id UUID;
  ds_id UUID;
  fe_id UUID;
  be_id UUID;
  ai_id UUID;
BEGIN
  SELECT id INTO fs_id FROM public.career_roles WHERE title = 'Full Stack Developer';
  SELECT id INTO ds_id FROM public.career_roles WHERE title = 'Data Scientist';
  SELECT id INTO fe_id FROM public.career_roles WHERE title = 'Frontend Developer';
  SELECT id INTO be_id FROM public.career_roles WHERE title = 'Backend Developer';
  SELECT id INTO ai_id FROM public.career_roles WHERE title = 'AI Engineer';

  IF fs_id IS NOT NULL THEN
    INSERT INTO public.career_required_skills (career_role_id, skill_id, min_proficiency, weight)
    SELECT fs_id, id, 75, 1.5 FROM public.skills WHERE name = 'JavaScript' ON CONFLICT DO NOTHING;
    INSERT INTO public.career_required_skills (career_role_id, skill_id, min_proficiency, weight)
    SELECT fs_id, id, 70, 1.4 FROM public.skills WHERE name = 'React' ON CONFLICT DO NOTHING;
    INSERT INTO public.career_required_skills (career_role_id, skill_id, min_proficiency, weight)
    SELECT fs_id, id, 65, 1.3 FROM public.skills WHERE name = 'Node.js' ON CONFLICT DO NOTHING;
    INSERT INTO public.career_required_skills (career_role_id, skill_id, min_proficiency, weight)
    SELECT fs_id, id, 70, 1.0 FROM public.skills WHERE name = 'HTML5' ON CONFLICT DO NOTHING;
    INSERT INTO public.career_required_skills (career_role_id, skill_id, min_proficiency, weight)
    SELECT fs_id, id, 65, 1.0 FROM public.skills WHERE name = 'CSS3' ON CONFLICT DO NOTHING;
    INSERT INTO public.career_required_skills (career_role_id, skill_id, min_proficiency, weight)
    SELECT fs_id, id, 60, 1.2 FROM public.skills WHERE name = 'SQL' ON CONFLICT DO NOTHING;
    INSERT INTO public.career_required_skills (career_role_id, skill_id, min_proficiency, weight)
    SELECT fs_id, id, 65, 1.3 FROM public.skills WHERE name = 'REST APIs' ON CONFLICT DO NOTHING;
    INSERT INTO public.career_required_skills (career_role_id, skill_id, min_proficiency, weight)
    SELECT fs_id, id, 60, 1.1 FROM public.skills WHERE name = 'Git' ON CONFLICT DO NOTHING;
    INSERT INTO public.career_required_skills (career_role_id, skill_id, min_proficiency, weight)
    SELECT fs_id, id, 50, 0.8 FROM public.skills WHERE name = 'Python' ON CONFLICT DO NOTHING;
  END IF;

  IF ds_id IS NOT NULL THEN
    INSERT INTO public.career_required_skills (career_role_id, skill_id, min_proficiency, weight)
    SELECT ds_id, id, 80, 1.5 FROM public.skills WHERE name = 'Python' ON CONFLICT DO NOTHING;
    INSERT INTO public.career_required_skills (career_role_id, skill_id, min_proficiency, weight)
    SELECT ds_id, id, 70, 1.3 FROM public.skills WHERE name = 'SQL' ON CONFLICT DO NOTHING;
    INSERT INTO public.career_required_skills (career_role_id, skill_id, min_proficiency, weight)
    SELECT ds_id, id, 75, 1.5 FROM public.skills WHERE name = 'Machine Learning' ON CONFLICT DO NOTHING;
    INSERT INTO public.career_required_skills (career_role_id, skill_id, min_proficiency, weight)
    SELECT ds_id, id, 75, 1.4 FROM public.skills WHERE name = 'Pandas' ON CONFLICT DO NOTHING;
    INSERT INTO public.career_required_skills (career_role_id, skill_id, min_proficiency, weight)
    SELECT ds_id, id, 70, 1.2 FROM public.skills WHERE name = 'NumPy' ON CONFLICT DO NOTHING;
    INSERT INTO public.career_required_skills (career_role_id, skill_id, min_proficiency, weight)
    SELECT ds_id, id, 70, 1.3 FROM public.skills WHERE name = 'Scikit-Learn' ON CONFLICT DO NOTHING;
    INSERT INTO public.career_required_skills (career_role_id, skill_id, min_proficiency, weight)
    SELECT ds_id, id, 75, 1.4 FROM public.skills WHERE name = 'Data Analysis' ON CONFLICT DO NOTHING;
    INSERT INTO public.career_required_skills (career_role_id, skill_id, min_proficiency, weight)
    SELECT ds_id, id, 60, 1.0 FROM public.skills WHERE name = 'Deep Learning' ON CONFLICT DO NOTHING;
  END IF;

  IF fe_id IS NOT NULL THEN
    INSERT INTO public.career_required_skills (career_role_id, skill_id, min_proficiency, weight)
    SELECT fe_id, id, 80, 1.5 FROM public.skills WHERE name = 'JavaScript' ON CONFLICT DO NOTHING;
    INSERT INTO public.career_required_skills (career_role_id, skill_id, min_proficiency, weight)
    SELECT fe_id, id, 75, 1.4 FROM public.skills WHERE name = 'React' ON CONFLICT DO NOTHING;
    INSERT INTO public.career_required_skills (career_role_id, skill_id, min_proficiency, weight)
    SELECT fe_id, id, 75, 1.2 FROM public.skills WHERE name = 'HTML5' ON CONFLICT DO NOTHING;
    INSERT INTO public.career_required_skills (career_role_id, skill_id, min_proficiency, weight)
    SELECT fe_id, id, 75, 1.2 FROM public.skills WHERE name = 'CSS3' ON CONFLICT DO NOTHING;
    INSERT INTO public.career_required_skills (career_role_id, skill_id, min_proficiency, weight)
    SELECT fe_id, id, 70, 1.3 FROM public.skills WHERE name = 'TypeScript' ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- 4. SEED ASSESSMENTS AND QUESTIONS
DO $$
DECLARE
  js_skill_id UUID;
  py_skill_id UUID;
  sql_skill_id UUID;
  react_skill_id UUID;
  js_assessment_id UUID;
  py_assessment_id UUID;
  sql_assessment_id UUID;
  react_assessment_id UUID;
BEGIN
  SELECT id INTO js_skill_id FROM public.skills WHERE name = 'JavaScript';
  SELECT id INTO py_skill_id FROM public.skills WHERE name = 'Python';
  SELECT id INTO sql_skill_id FROM public.skills WHERE name = 'SQL';
  SELECT id INTO react_skill_id FROM public.skills WHERE name = 'React';

  -- JavaScript
  IF js_skill_id IS NOT NULL THEN
    INSERT INTO public.assessments (title, skill_id, description, duration_minutes, passing_score)
    VALUES (
      'JavaScript Core Proficiency Assessment',
      js_skill_id,
      'Evaluates core JavaScript proficiency across functions, closures, array methods, event loop, and asynchronous programming.',
      15,
      60
    ) RETURNING id INTO js_assessment_id;

    INSERT INTO public.questions (assessment_id, question_text, difficulty, topic, marks, options, explanation) VALUES
    (
      js_assessment_id,
      'What will `console.log(typeof NaN)` output in JavaScript?',
      'EASY',
      'Data Types',
      1,
      '[
        {"id": "o1", "text": "number", "is_correct": true},
        {"id": "o2", "text": "NaN", "is_correct": false},
        {"id": "o3", "text": "undefined", "is_correct": false},
        {"id": "o4", "text": "object", "is_correct": false}
      ]'::jsonb,
      'In JavaScript, NaN (Not-a-Number) is formally of numeric type (number).'
    ),
    (
      js_assessment_id,
      'Which array method returns a new array with all elements that pass the provided test?',
      'EASY',
      'Array Methods',
      1,
      '[
        {"id": "o1", "text": "map()", "is_correct": false},
        {"id": "o2", "text": "filter()", "is_correct": true},
        {"id": "o3", "text": "forEach()", "is_correct": false},
        {"id": "o4", "text": "reduce()", "is_correct": false}
      ]'::jsonb,
      'filter() creates a shallow copy of a portion of a given array filtered by test.'
    ),
    (
      js_assessment_id,
      'What is a closure in JavaScript?',
      'MEDIUM',
      'Closures',
      1,
      '[
        {"id": "o1", "text": "A function that has access to its outer lexical scope even after the outer function has closed", "is_correct": true},
        {"id": "o2", "text": "A method to close browser tabs programmatically", "is_correct": false},
        {"id": "o3", "text": "A private variable that cannot be accessed by any function", "is_correct": false},
        {"id": "o4", "text": "A syntax error that closes execution", "is_correct": false}
      ]'::jsonb,
      'A closure combines a function with its surrounding lexical state.'
    ),
    (
      js_assessment_id,
      'What is the result of `[1, 2, 3] + [4, 5, 6]` in JavaScript?',
      'MEDIUM',
      'Type Coercion',
      1,
      '[
        {"id": "o1", "text": "\"1,2,34,5,6\"", "is_correct": true},
        {"id": "o2", "text": "[1, 2, 3, 4, 5, 6]", "is_correct": false},
        {"id": "o3", "text": "NaN", "is_correct": false},
        {"id": "o4", "text": "TypeError", "is_correct": false}
      ]'::jsonb,
      'Both arrays coerce to strings and concatenate.'
    ),
    (
      js_assessment_id,
      'Which statement accurately describes the JavaScript Event Loop order of execution?',
      'HARD',
      'Asynchronous & Event Loop',
      1,
      '[
        {"id": "o1", "text": "Synchronous call stack -> Microtasks (Promises) -> Macrotasks (setTimeout)", "is_correct": true},
        {"id": "o2", "text": "Synchronous call stack -> Macrotasks (setTimeout) -> Microtasks (Promises)", "is_correct": false},
        {"id": "o3", "text": "Microtasks -> Synchronous call stack -> Macrotasks", "is_correct": false},
        {"id": "o4", "text": "Macrotasks execute simultaneously using multi-threading", "is_correct": false}
      ]'::jsonb,
      'Call stack exhausts first, then microtask queue completely, then next macrotask.'
    );
  END IF;

  -- Python
  IF py_skill_id IS NOT NULL THEN
    INSERT INTO public.assessments (title, skill_id, description, duration_minutes, passing_score)
    VALUES (
      'Python Core Proficiency Assessment',
      py_skill_id,
      'Evaluates Python fundamentals including data structures, list comprehensions, decorators, and memory management.',
      15,
      60
    ) RETURNING id INTO py_assessment_id;

    INSERT INTO public.questions (assessment_id, question_text, difficulty, topic, marks, options, explanation) VALUES
    (
      py_assessment_id,
      'Which data structure in Python is mutable?',
      'EASY',
      'Data Structures',
      1,
      '[
        {"id": "o1", "text": "list", "is_correct": true},
        {"id": "o2", "text": "tuple", "is_correct": false},
        {"id": "o3", "text": "str", "is_correct": false},
        {"id": "o4", "text": "frozenset", "is_correct": false}
      ]'::jsonb,
      'Lists are mutable sequences in Python.'
    ),
    (
      py_assessment_id,
      'What does the `*args` syntax in a Python function definition allow you to do?',
      'MEDIUM',
      'Functions',
      1,
      '[
        {"id": "o1", "text": "Pass a variable number of non-keyword positional arguments as a tuple", "is_correct": true},
        {"id": "o2", "text": "Pass keyword arguments as a dictionary", "is_correct": false},
        {"id": "o3", "text": "Multiply arguments automatically", "is_correct": false},
        {"id": "o4", "text": "Require strict type validation on arguments", "is_correct": false}
      ]'::jsonb,
      '*args gathers positional arguments into a tuple.'
    );
  END IF;

  -- SQL
  IF sql_skill_id IS NOT NULL THEN
    INSERT INTO public.assessments (title, skill_id, description, duration_minutes, passing_score)
    VALUES (
      'SQL & Relational Database Assessment',
      sql_skill_id,
      'Evaluates SQL queries, joins, aggregations, indexing, and transactional integrity.',
      15,
      60
    ) RETURNING id INTO sql_assessment_id;

    INSERT INTO public.questions (assessment_id, question_text, difficulty, topic, marks, options, explanation) VALUES
    (
      sql_assessment_id,
      'Which JOIN returns all rows from the left table, and matching rows from the right table?',
      'EASY',
      'Joins',
      1,
      '[
        {"id": "o1", "text": "LEFT JOIN", "is_correct": true},
        {"id": "o2", "text": "INNER JOIN", "is_correct": false},
        {"id": "o3", "text": "FULL OUTER JOIN", "is_correct": false},
        {"id": "o4", "text": "CROSS JOIN", "is_correct": false}
      ]'::jsonb,
      'LEFT JOIN preserves all rows from left table.'
    ),
    (
      sql_assessment_id,
      'What is the difference between WHERE and HAVING in SQL?',
      'MEDIUM',
      'Aggregations',
      1,
      '[
        {"id": "o1", "text": "WHERE filters rows before grouping; HAVING filters groups after GROUP BY aggregation", "is_correct": true},
        {"id": "o2", "text": "HAVING filters rows before grouping; WHERE filters aggregated results", "is_correct": false},
        {"id": "o3", "text": "WHERE and HAVING are completely interchangeable synonyms", "is_correct": false},
        {"id": "o4", "text": "HAVING can only be used with primary keys", "is_correct": false}
      ]'::jsonb,
      'WHERE acts before grouping, HAVING after GROUP BY.'
    );
  END IF;
END $$;
