-- ====================================================================
-- PromptWars Platform: Seed Data for Skills, Careers, Assessments & Questions
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
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

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
ON CONFLICT (title) DO UPDATE SET description = EXCLUDED.description;

-- 3. LINK CAREER REQUIRED SKILLS
-- Helper DO block to link by names
DO $$
DECLARE
  fs_id UUID;
  ds_id UUID;
  fe_id UUID;
  be_id UUID;
  ml_id UUID;
  ai_id UUID;
  da_id UUID;
  ce_id UUID;
  cs_id UUID;
BEGIN
  SELECT id INTO fs_id FROM public.career_roles WHERE title = 'Full Stack Developer';
  SELECT id INTO ds_id FROM public.career_roles WHERE title = 'Data Scientist';
  SELECT id INTO fe_id FROM public.career_roles WHERE title = 'Frontend Developer';
  SELECT id INTO be_id FROM public.career_roles WHERE title = 'Backend Developer';
  SELECT id INTO ml_id FROM public.career_roles WHERE title = 'Machine Learning Engineer';
  SELECT id INTO ai_id FROM public.career_roles WHERE title = 'AI Engineer';
  SELECT id INTO da_id FROM public.career_roles WHERE title = 'Data Analyst';
  SELECT id INTO ce_id FROM public.career_roles WHERE title = 'Cloud Engineer';
  SELECT id INTO cs_id FROM public.career_roles WHERE title = 'Cybersecurity Analyst';

  -- Full Stack Developer
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

  -- Data Scientist
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

  -- Frontend Developer
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

  -- Backend Developer
  IF be_id IS NOT NULL THEN
    INSERT INTO public.career_required_skills (career_role_id, skill_id, min_proficiency, weight)
    SELECT be_id, id, 75, 1.4 FROM public.skills WHERE name = 'Node.js' ON CONFLICT DO NOTHING;
    INSERT INTO public.career_required_skills (career_role_id, skill_id, min_proficiency, weight)
    SELECT be_id, id, 75, 1.4 FROM public.skills WHERE name = 'SQL' ON CONFLICT DO NOTHING;
    INSERT INTO public.career_required_skills (career_role_id, skill_id, min_proficiency, weight)
    SELECT be_id, id, 75, 1.4 FROM public.skills WHERE name = 'PostgreSQL' ON CONFLICT DO NOTHING;
    INSERT INTO public.career_required_skills (career_role_id, skill_id, min_proficiency, weight)
    SELECT be_id, id, 70, 1.3 FROM public.skills WHERE name = 'REST APIs' ON CONFLICT DO NOTHING;
    INSERT INTO public.career_required_skills (career_role_id, skill_id, min_proficiency, weight)
    SELECT be_id, id, 65, 1.1 FROM public.skills WHERE name = 'Docker' ON CONFLICT DO NOTHING;
  END IF;

  -- AI Engineer
  IF ai_id IS NOT NULL THEN
    INSERT INTO public.career_required_skills (career_role_id, skill_id, min_proficiency, weight)
    SELECT ai_id, id, 80, 1.5 FROM public.skills WHERE name = 'Python' ON CONFLICT DO NOTHING;
    INSERT INTO public.career_required_skills (career_role_id, skill_id, min_proficiency, weight)
    SELECT ai_id, id, 75, 1.4 FROM public.skills WHERE name = 'Deep Learning' ON CONFLICT DO NOTHING;
    INSERT INTO public.career_required_skills (career_role_id, skill_id, min_proficiency, weight)
    SELECT ai_id, id, 75, 1.4 FROM public.skills WHERE name = 'Machine Learning' ON CONFLICT DO NOTHING;
    INSERT INTO public.career_required_skills (career_role_id, skill_id, min_proficiency, weight)
    SELECT ai_id, id, 70, 1.3 FROM public.skills WHERE name = 'REST APIs' ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- 4. SEED ASSESSMENTS AND QUESTIONS
DO $$
DECLARE
  js_skill_id UUID;
  py_skill_id UUID;
  react_skill_id UUID;
  sql_skill_id UUID;
  js_assessment_id UUID;
  py_assessment_id UUID;
  react_assessment_id UUID;
  sql_assessment_id UUID;
BEGIN
  SELECT id INTO js_skill_id FROM public.skills WHERE name = 'JavaScript';
  SELECT id INTO py_skill_id FROM public.skills WHERE name = 'Python';
  SELECT id INTO react_skill_id FROM public.skills WHERE name = 'React';
  SELECT id INTO sql_skill_id FROM public.skills WHERE name = 'SQL';

  -- A. JavaScript Assessment
  IF js_skill_id IS NOT NULL THEN
    INSERT INTO public.assessments (title, skill_id, description, duration_minutes, passing_score)
    VALUES (
      'JavaScript Core Proficiency Assessment',
      js_skill_id,
      'Evaluates core JavaScript proficiency across functions, closures, array methods, event loop, and asynchronous programming.',
      15,
      60
    ) RETURNING id INTO js_assessment_id;

    -- Questions for JavaScript
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
      'filter() creates a shallow copy of a portion of a given array, filtered down to just the elements from the given array that pass the test implemented by the provided function.'
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
      'A closure is the combination of a function bundled together with references to its surrounding state (the lexical environment).'
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
      'The plus operator converts both arrays to strings ("1,2,3" and "4,5,6") and concatenates them.'
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
      'The call stack empties first, then the microtask queue (Promises, queueMicrotask) is exhausted completely before the next macrotask (setTimeout, setInterval) is dequeued.'
    );
  END IF;

  -- B. Python Assessment
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
      'Lists in Python are mutable sequences, meaning their contents can be changed in place.'
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
      '*args gathers remaining positional arguments into a tuple inside the function.'
    );
  END IF;

  -- C. SQL Assessment
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
      'LEFT JOIN preserves all rows from the left table even if no match is found in the right table (filling right attributes with NULL).'
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
      'WHERE acts on individual records prior to grouping, while HAVING applies conditions to aggregated summary rows produced by GROUP BY.'
    );
  END IF;

  -- D. React Assessment
  IF react_skill_id IS NOT NULL THEN
    INSERT INTO public.assessments (title, skill_id, description, duration_minutes, passing_score)
    VALUES (
      'React & Component Architecture Assessment',
      react_skill_id,
      'Evaluates React hooks, component lifecycles, state management, and reconciliation.',
      15,
      60
    ) RETURNING id INTO react_assessment_id;

    INSERT INTO public.questions (assessment_id, question_text, difficulty, topic, marks, options, explanation) VALUES
    (
      react_assessment_id,
      'When does the cleanup function in `useEffect(() => { return () => cleanup(); }, [dep])` run?',
      'MEDIUM',
      'Hooks',
      1,
      '[
        {"id": "o1", "text": "Before the effect re-runs when dependencies change, and on component unmount", "is_correct": true},
        {"id": "o2", "text": "Only when the entire browser page reloads", "is_correct": false},
        {"id": "o3", "text": "Immediately before the initial render", "is_correct": false},
        {"id": "o4", "text": "Only if an uncaught error occurs in the component", "is_correct": false}
      ]'::jsonb,
      'React runs the cleanup function of the previous render before re-running the effect with new dependencies, as well as when the component unmounts.'
    );
  END IF;
END $$;
