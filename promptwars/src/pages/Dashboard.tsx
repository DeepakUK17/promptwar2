import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCurrentUser, getProfile } from "@/lib/auth";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useLearnerSkills } from "@/hooks/useSkills";
import { useCareerRoles, useCareerReadiness } from "@/hooks/useCareers";
import { useActiveRoadmap } from "@/hooks/useRoadmap";
import { 
  Sparkles, 
  Target, 
  Milestone, 
  FileCheck2, 
  Bot, 
  Wrench, 
  TrendingUp, 
  CheckCircle2, 
  ArrowRight,
  Clock,
  Layers,
  Award
} from "lucide-react";

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const { data: careerRoles = [] } = useCareerRoles();
  const { data: learnerSkills = [] } = useLearnerSkills(user?.id);
  const { data: roadmap } = useActiveRoadmap(user?.id);

  // Current target career
  const targetCareerId = profile?.target_career_id || careerRoles[0]?.id;
  const currentCareer = careerRoles.find((c) => c.id === targetCareerId);
  const { data: readiness } = useCareerReadiness(user?.id, targetCareerId);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          navigate("/login");
          return;
        }
        setUser(currentUser);
        const p = await getProfile(currentUser.id);
        setProfile(p);
      } catch (err) {
        console.error("Auth error:", err);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation isAuthenticated />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <p className="text-muted-foreground">Loading learner cockpit...</p>
        </div>
      </div>
    );
  }

  const readinessScore = readiness?.readinessScore ?? 0;
  const verifiedSkillsCount = learnerSkills.filter((s) => s.verified && s.assessed_level !== null).length;

  const allActivities = roadmap?.phases.flatMap((p) => p.activities) || [];
  const completedActivities = allActivities.filter((a) => a.status === "completed");
  const roadmapProgress = allActivities.length > 0 
    ? Math.round((completedActivities.length / allActivities.length) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-background pb-16">
      <Navigation isAuthenticated profile={profile} />

      <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
        {/* Welcome Banner */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-primary/[0.08] via-primary/[0.02] to-transparent p-6 rounded-2xl border border-primary/20">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                Learner Cockpit
              </span>
              <span className="text-xs text-muted-foreground">
                {profile?.degree || "Student"} • {profile?.institution || "University"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Welcome back, {profile?.full_name || "Learner"}!
            </h1>
            <p className="text-sm text-muted-foreground max-w-xl">
              Target Goal: <span className="font-semibold text-foreground">{currentCareer?.title || "Full Stack Developer"}</span>
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <Link to="/mentor">
              <Button variant="default" size="sm" className="gap-2 bg-gradient-to-r from-primary to-primary/80 shadow-sm">
                <Bot className="w-4 h-4" />
                Ask AI Mentor
              </Button>
            </Link>
            <Link to="/careers">
              <Button variant="outline" size="sm" className="gap-2">
                <Target className="w-4 h-4" />
                Switch Goal
              </Button>
            </Link>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border/80">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">Career Readiness</CardDescription>
              <CardTitle className="text-2xl sm:text-3xl font-bold text-primary flex items-baseline gap-1">
                {readinessScore}%
                <span className="text-xs font-normal text-muted-foreground">match</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={readinessScore} className="h-1.5" />
            </CardContent>
          </Card>

          <Card className="border-border/80">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">Roadmap Progress</CardDescription>
              <CardTitle className="text-2xl sm:text-3xl font-bold text-foreground flex items-baseline gap-1">
                {roadmapProgress}%
                <span className="text-xs font-normal text-muted-foreground">done</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={roadmapProgress} className="h-1.5" />
            </CardContent>
          </Card>

          <Card className="border-border/80">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">Verified Skills</CardDescription>
              <CardTitle className="text-2xl sm:text-3xl font-bold text-emerald-600 flex items-baseline gap-1">
                {verifiedSkillsCount}
                <span className="text-xs font-normal text-muted-foreground">of {learnerSkills.length} logged</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Evaluated via assessments
            </CardContent>
          </Card>

          <Card className="border-border/80">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">Learning Velocity</CardDescription>
              <CardTitle className="text-2xl sm:text-3xl font-bold text-foreground flex items-baseline gap-1">
                {profile?.learning_hours_total || 14}
                <span className="text-xs font-normal text-muted-foreground">hrs logged</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <span>Active pace</span>
            </CardContent>
          </Card>
        </div>

        {/* 2-Column Main Section: Career Match + Active Roadmap */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Career Readiness & Skill Gaps Summary (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">Career Readiness Breakdown</CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {currentCareer?.title}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs mt-1">
                    Based on market-calibrated weights and your verified skills.
                  </CardDescription>
                </div>

                <Link to={targetCareerId ? `/careers/${targetCareerId}/readiness` : "/careers"}>
                  <Button variant="ghost" size="sm" className="gap-1 text-xs text-primary">
                    Full Analysis
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-xs text-foreground/80 bg-muted/30 p-3 rounded-lg border leading-relaxed">
                  {readiness?.explanation || "Diagnosing skill gaps..."}
                </p>

                {/* Priority Gaps Preview */}
                {readiness?.priorityAreas && readiness.priorityAreas.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Critical Areas to Address:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {readiness.priorityAreas.map((skill, i) => (
                        <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-card text-xs">
                          <span className="font-medium">{skill}</span>
                          <span className="text-[10px] text-amber-500 font-semibold">• High Impact</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Skill Comparison Chips */}
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Verified Skills Snapshot</span>
                    <Link to="/skills" className="text-primary hover:underline">Manage All</Link>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {learnerSkills.slice(0, 6).map((ls) => (
                      <Badge 
                        key={ls.id} 
                        variant="secondary" 
                        className="text-xs py-1 px-2.5 gap-1.5"
                      >
                        <span>{ls.skill?.name}</span>
                        <span className="font-bold text-primary">
                          {ls.assessed_level !== null ? `${ls.assessed_level}%` : `${ls.self_reported_level}%`}
                        </span>
                        {ls.verified && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Assessment Quick Launch Card */}
            <Card className="border-border/80">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileCheck2 className="w-5 h-5 text-primary" />
                    Validation & Coding Lab
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Choose an assessment environment to test your competencies.
                  </CardDescription>
                </div>
                <Link to="/assessments">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs text-primary">
                    View Center
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <Link to="/assessments" className="p-3.5 rounded-lg border hover:border-primary/40 transition-all bg-card space-y-1 block">
                  <span className="font-semibold text-sm flex items-center gap-1.5 text-foreground">
                    <FileCheck2 className="w-4 h-4 text-primary" />
                    Diagnostic MCQs
                  </span>
                  <p className="text-muted-foreground text-[11px]">
                    15-min architectural question tests mapped to skills.
                  </p>
                </Link>

                <a 
                  href="https://test-portal-sage.vercel.app" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="p-3.5 rounded-lg border hover:border-primary/40 transition-all bg-card space-y-1 block"
                >
                  <span className="font-semibold text-sm flex items-center gap-1.5 text-foreground">
                    <Award className="w-4 h-4 text-emerald-500" />
                    Live Coding Lab →
                  </span>
                  <p className="text-muted-foreground text-[11px]">
                    Monaco editor with compiler for C, C++, Java & Python.
                  </p>
                </a>
              </CardContent>
            </Card>
          </div>

          {/* Active Milestone Sidebar (1 Col) */}
          <div className="space-y-6">
            <Card className="h-full flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Milestone className="w-5 h-5 text-primary" />
                    Current Milestone
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px] text-primary">Active</Badge>
                </div>
                <CardDescription className="text-xs">
                  {roadmap?.phases[0]?.title || "Phase 1: Foundations"}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3 flex-1">
                {roadmap?.phases[0]?.activities && roadmap.phases[0].activities.length > 0 ? (
                  <div className="space-y-2">
                    {roadmap.phases[0].activities.slice(0, 4).map((act) => (
                      <div key={act.id} className="p-2.5 rounded border text-xs bg-muted/20 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-foreground truncate max-w-[180px]">
                            {act.title}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{act.estimated_hours}h</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-1">{act.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-xs text-muted-foreground">
                    No active activities loaded.
                  </div>
                )}
              </CardContent>

              <div className="p-6 pt-0 border-t mt-4">
                <Link to="/roadmap" className="w-full">
                  <Button className="w-full gap-2 text-xs">
                    Open Full Learning Path
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
