import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getCurrentUser, getProfile } from "@/lib/auth";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useCareerDetails, useCareerReadiness, useSetTargetCareer } from "@/hooks/useCareers";
import { 
  Compass, 
  CheckCircle2, 
  AlertTriangle, 
  Milestone, 
  Sparkles, 
  ArrowRight, 
  Bot, 
  Zap, 
  Target,
  ShieldAlert,
  GraduationCap
} from "lucide-react";

const CareerReadiness = () => {
  const { id: careerId } = useParams<{ id: string }>();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const navigate = useNavigate();

  const { data: careerDetails, isLoading: careerLoading } = useCareerDetails(careerId);
  const { data: readiness, isLoading: readinessLoading } = useCareerReadiness(user?.id, careerId);
  const setTargetCareerMutation = useSetTargetCareer();

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        navigate("/login");
        return;
      }
      setUser(currentUser);
      const p = await getProfile(currentUser.id);
      setProfile(p);
    };
    checkAuth();
  }, [navigate]);

  const isCurrentTarget = profile?.target_career_id === careerId;

  const handleSelectGoal = async () => {
    if (!user || !careerId) return;
    await setTargetCareerMutation.mutateAsync({
      userId: user.id,
      careerId,
      reason: isCurrentTarget ? "refresh" : "career_goal_change",
    });
    const p = await getProfile(user.id);
    setProfile(p);
  };

  if (careerLoading || readinessLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation profile={profile} />
        <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">
          Running career intelligence match analysis...
        </div>
      </div>
    );
  }

  if (!careerDetails) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation profile={profile} />
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground">Career role not found.</p>
          <Link to="/careers">
            <Button className="mt-4">Back to Careers</Button>
          </Link>
        </div>
      </div>
    );
  }

  const score = readiness?.readinessScore ?? 0;

  return (
    <div className="min-h-screen bg-background pb-16">
      <Navigation profile={profile} />

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header Breadcrumb & Actions */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Link to="/careers" className="hover:underline">Career Matching</Link>
              <span>/</span>
              <span>Analysis</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{careerDetails.title}</h1>
            <p className="text-muted-foreground text-sm mt-1">{careerDetails.description}</p>
          </div>

          <div className="flex items-center gap-3">
            {isCurrentTarget ? (
              <Badge variant="outline" className="px-3 py-1.5 border-primary/40 bg-primary/10 text-primary font-medium gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Active Career Goal
              </Badge>
            ) : (
              <Button onClick={handleSelectGoal} disabled={setTargetCareerMutation.isPending} className="gap-2">
                <Target className="w-4 h-4" />
                {setTargetCareerMutation.isPending ? "Updating Goal..." : "Set as My Target Goal"}
              </Button>
            )}

            <Link to="/roadmap">
              <Button variant="default" className="gap-2 bg-gradient-to-r from-primary to-primary/80">
                <Milestone className="w-4 h-4" />
                View Roadmap
              </Button>
            </Link>
          </div>
        </div>

        {/* Readiness Overview Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Readiness Score Card */}
          <Card className="md:col-span-1 border-primary/30 bg-card flex flex-col justify-between">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase tracking-wider font-semibold">
                Career Readiness Index
              </CardDescription>
              <div className="flex items-baseline gap-2 pt-2">
                <span className="text-5xl font-black tracking-tight text-primary">{score}%</span>
                <span className="text-xs text-muted-foreground">match</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Progress value={score} className="h-2.5" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Weighted Score: {readiness?.totalWeightedScore}</span>
                <span>Max: {readiness?.maxPossibleWeightedScore}</span>
              </div>
            </CardContent>
            <CardFooter className="pt-0 text-[11px] text-muted-foreground border-t py-3">
              Calculated using transparent skill weighting formula
            </CardFooter>
          </Card>

          {/* AI Explanation and Priority Areas */}
          <Card className="md:col-span-2 flex flex-col justify-between">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-primary font-semibold text-xs">
                <Bot className="w-4 h-4" />
                <span>Career Intelligence Agent Assessment</span>
              </div>
              <CardTitle className="text-base font-semibold mt-1">Diagnosis & Gap Explanation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-foreground/90 leading-relaxed bg-muted/30 p-3 rounded-lg border">
                {readiness?.explanation}
              </p>

              {readiness?.priorityAreas && readiness.priorityAreas.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Highest Priority Gaps to Close:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {readiness.priorityAreas.map((skill, i) => (
                      <Badge key={i} variant="secondary" className="text-xs px-2.5 py-1 gap-1 border-amber-500/30 bg-amber-500/10 text-amber-600">
                        <AlertTriangle className="w-3 h-3" />
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="pt-0 pb-3" />
          </Card>
        </div>

        {/* Detailed Gaps Table */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Missing / Gap Skills */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-500" />
                Missing & Low Proficiency Skills ({readiness?.skillGaps.length || 0})
              </CardTitle>
              <CardDescription className="text-xs">
                Skills where your verified level is beneath the minimum job role benchmark.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {readiness?.skillGaps && readiness.skillGaps.length > 0 ? (
                <div className="divide-y text-xs">
                  {readiness.skillGaps.map((gap, i) => (
                    <div key={i} className="py-2.5 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm">{gap.skillName}</p>
                        <p className="text-muted-foreground text-[11px]">
                          Current: <span className="font-medium text-foreground">{gap.learnerLevel}%</span> • Target: <span className="font-medium text-foreground">{gap.requiredLevel}%</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline"
                          className={
                            gap.importance === "High" 
                              ? "border-red-500/30 text-red-500 bg-red-500/10"
                              : gap.importance === "Medium"
                              ? "border-amber-500/30 text-amber-600 bg-amber-500/10"
                              : "border-muted-foreground/30 text-muted-foreground"
                          }
                        >
                          {gap.importance} Priority
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  No critical skill gaps identified for this role!
                </div>
              )}
            </CardContent>
          </Card>

          {/* Verified Strengths */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                Existing Strengths ({readiness?.strengths.length || 0})
              </CardTitle>
              <CardDescription className="text-xs">
                Competencies where you currently satisfy or exceed the career requirement.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {readiness?.strengths && readiness.strengths.length > 0 ? (
                <div className="divide-y text-xs">
                  {readiness.strengths.map((str, i) => (
                    <div key={i} className="py-2.5 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm">{str.skillName}</p>
                        <p className="text-muted-foreground text-[11px]">
                          Your Level: <span className="font-medium text-foreground">{str.learnerLevel}%</span> (Req: {str.requiredLevel}%)
                        </p>
                      </div>
                      <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 bg-emerald-500/10">
                        {str.surplus > 0 ? `+${str.surplus}% Surplus` : "Requirement Met"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  Add or validate your skills in the Skills Manager to see verified strengths.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Multi-Agent Orchestration Visualizer */}
        <Card className="border-border/80 bg-muted/10">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-primary font-semibold text-xs">
              <Zap className="w-4 h-4" />
              <span>Multi-Agent System Workflow (LangGraph)</span>
            </div>
            <CardTitle className="text-base font-semibold">Autonomous Agent Coordination Chain</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs pt-2">
              <div className="p-3 rounded-lg border bg-card">
                <div className="font-semibold text-primary mb-1">1. Orchestrator</div>
                <p className="text-muted-foreground text-[11px]">Receives career goal trigger, retrieves profile state, coordinates pipeline.</p>
              </div>
              <div className="p-3 rounded-lg border bg-card">
                <div className="font-semibold text-primary mb-1">2. Career Intelligence</div>
                <p className="text-muted-foreground text-[11px]">Analyzes industry weights, checks minimum benchmarks, calculates match.</p>
              </div>
              <div className="p-3 rounded-lg border bg-card">
                <div className="font-semibold text-primary mb-1">3. Skill Analysis</div>
                <p className="text-muted-foreground text-[11px]">Reconciles self-reported vs assessed evidence, categorizes gaps.</p>
              </div>
              <div className="p-3 rounded-lg border bg-card">
                <div className="font-semibold text-primary mb-1">4. Recommendation</div>
                <p className="text-muted-foreground text-[11px]">Synthesizes multi-phase learning roadmap with curated verified resources.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CareerReadiness;
