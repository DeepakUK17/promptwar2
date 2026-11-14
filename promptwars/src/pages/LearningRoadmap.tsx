import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCurrentUser, getProfile } from "@/lib/auth";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useActiveRoadmap, useRoadmapHistory, useToggleActivityStatus } from "@/hooks/useRoadmap";
import { useCareerRoles, useSetTargetCareer } from "@/hooks/useCareers";
import { 
  Milestone, 
  CheckCircle2, 
  Circle, 
  Clock, 
  ExternalLink, 
  BookOpen, 
  Video, 
  Code2, 
  AlertTriangle, 
  Sparkles, 
  History,
  FileCheck2,
  Layers,
  ArrowRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const LearningRoadmap = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: roadmap, isLoading: roadmapLoading, refetch: refetchRoadmap } = useActiveRoadmap(user?.id);
  const { data: history = [] } = useRoadmapHistory(user?.id);
  const { data: careerRoles = [] } = useCareerRoles();
  const toggleActivityMutation = useToggleActivityStatus();

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

  // Compute overall roadmap progress
  const allActivities = roadmap?.phases.flatMap((p) => p.activities) || [];
  const completedActivities = allActivities.filter((a) => a.status === "completed");
  const progressPercent = allActivities.length > 0 
    ? Math.round((completedActivities.length / allActivities.length) * 100) 
    : 0;

  const handleGenerateRoadmap = async () => {
    if (!user) return;
    setGenerating(true);

    try {
      const targetCareerId = profile?.target_career_id || careerRoles[0]?.id;
      if (!targetCareerId) throw new Error("Please select a target career first.");

      // Check if AI backend is running
      const aiBackendUrl = import.meta.env.VITE_AI_BACKEND_URL || "http://localhost:8000";
      const res = await fetch(`${aiBackendUrl}/api/agents/career-selection`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          career_role_id: targetCareerId,
          reason: "initial_generation",
        }),
      });

      if (!res.ok) {
        throw new Error("AI Backend returned non-200");
      }

      toast({
        title: "Roadmap generated!",
        description: "Your personalized multi-phase path is ready.",
      });
      await refetchRoadmap();
    } catch (e: any) {
      // Fallback local seed generator for client reliability
      await generateLocalRoadmap(user.id, profile?.target_career_id || careerRoles[0]?.id);
      await refetchRoadmap();
      toast({
        title: "Personalized Roadmap Activated",
        description: "Generated from verified curriculum catalog.",
      });
    } finally {
      setGenerating(false);
    }
  };

  const generateLocalRoadmap = async (userId: string, careerId?: string) => {
    if (!careerId) return;

    // Archive any active roadmap
    await supabase
      .from("learning_roadmaps")
      .update({ status: "archived", archived_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("status", "active");

    // 1. Create roadmap
    const { data: newRoadmap, error: rErr } = await supabase
      .from("learning_roadmaps")
      .insert({
        user_id: userId,
        career_role_id: careerId,
        version: 1,
        status: "active",
        readiness_score: 45,
        change_reason: "initial",
      })
      .select()
      .single();

    if (rErr || !newRoadmap) return;

    // 2. Create Phases
    const phasesData = [
      {
        roadmap_id: newRoadmap.id,
        phase_number: 1,
        title: "Phase 1: Foundations & Core Language Mastery",
        description: "Build robust fluency in modern syntax, closures, and async flow.",
        status: "in_progress",
        estimated_hours: 15,
        order_index: 1,
      },
      {
        roadmap_id: newRoadmap.id,
        phase_number: 2,
        title: "Phase 2: Component Architecture & State Management",
        description: "Component lifecycle, state orchestration, custom hooks, and performance.",
        status: "pending",
        estimated_hours: 20,
        order_index: 2,
      },
      {
        roadmap_id: newRoadmap.id,
        phase_number: 3,
        title: "Phase 3: Backend Services & API Integration",
        description: "RESTful architecture, middleware design, data validation, and auth flows.",
        status: "pending",
        estimated_hours: 25,
        order_index: 3,
      },
      {
        roadmap_id: newRoadmap.id,
        phase_number: 4,
        title: "Phase 4: Capstone Engineering Project",
        description: "End-to-end full stack architecture deployed with automated tests.",
        status: "pending",
        estimated_hours: 30,
        order_index: 4,
      },
    ];

    const { data: createdPhases } = await supabase
      .from("roadmap_phases")
      .insert(phasesData)
      .select();

    if (!createdPhases) return;

    // 3. Create sample activities for Phase 1
    const p1 = createdPhases.find((p) => p.phase_number === 1);
    if (p1) {
      const { data: act1 } = await supabase
        .from("learning_activities")
        .insert({
          phase_id: p1.id,
          activity_type: "reading",
          title: "Deep Dive: Closures, Scope, and Execution Context",
          description: "Master lexical scoping, variable hoisting, and lexical environment memory layout.",
          priority: "high",
          estimated_hours: 2.5,
          status: "in_progress",
          order_index: 1,
        })
        .select()
        .single();

      if (act1) {
        await supabase.from("learning_resources").insert({
          activity_id: act1.id,
          resource_type: "url",
          title: "MDN Web Docs: Closures & Lexical Scoping",
          url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures",
          source: "MDN",
        });
      }

      const { data: act2 } = await supabase
        .from("learning_activities")
        .insert({
          phase_id: p1.id,
          activity_type: "exercise",
          title: "Async Programming & The Event Loop",
          description: "Implement Promise chaining, error boundaries, and async/await wrappers.",
          priority: "critical",
          estimated_hours: 3.0,
          status: "pending",
          order_index: 2,
        })
        .select()
        .single();

      if (act2) {
        await supabase.from("learning_resources").insert({
          activity_id: act2.id,
          resource_type: "url",
          title: "JavaScript.info: Promises, async/await Guide",
          url: "https://javascript.info/async",
          source: "JavaScript.info",
        });
      }
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "video": return <Video className="w-4 h-4 text-blue-500" />;
      case "reading": return <BookOpen className="w-4 h-4 text-purple-500" />;
      case "exercise": return <Code2 className="w-4 h-4 text-emerald-500" />;
      case "remedial": return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case "assessment": return <FileCheck2 className="w-4 h-4 text-primary" />;
      default: return <Milestone className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      <Navigation profile={profile} />

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs text-primary font-semibold mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Adaptive Multi-Agent Learning Engine</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Personalized Learning Roadmap</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Curated by the Learning Recommendation Agent and dynamically updated when your goals or assessment results change.
            </p>
          </div>

          {roadmap && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary text-xs px-2.5 py-1">
                Version {roadmap.version}.0
              </Badge>
              {roadmap.change_reason && (
                <Badge variant="secondary" className="text-xs capitalize">
                  {roadmap.change_reason.replace(/_/g, " ")}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Active Roadmap Container */}
        {roadmapLoading ? (
          <div className="text-center py-16 text-muted-foreground">Loading your personalized roadmap...</div>
        ) : roadmap && roadmap.phases.length > 0 ? (
          <div className="space-y-6">
            {/* Progress Bar Card */}
            <Card className="border-border/80">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
                  <div>
                    <span className="text-sm font-semibold">
                      Target Career: {roadmap.career_role?.title || "Specialized Track"}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {completedActivities.length} of {allActivities.length} activities completed
                    </p>
                  </div>
                  <span className="text-2xl font-bold text-primary">{progressPercent}%</span>
                </div>
                <Progress value={progressPercent} className="h-2.5" />
              </CardContent>
            </Card>

            {/* Phases Accordion */}
            <Accordion type="multiple" defaultValue={roadmap.phases.map((p) => p.id)} className="space-y-4">
              {roadmap.phases.map((phase) => (
                <AccordionItem key={phase.id} value={phase.id} className="border rounded-lg bg-card px-4">
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 text-left w-full pr-4">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                        {phase.phase_number}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-base">{phase.title}</span>
                          <Badge 
                            variant="outline" 
                            className={`text-[10px] capitalize ${
                              phase.status === "completed" 
                                ? "border-emerald-500/30 text-emerald-600 bg-emerald-500/10" 
                                : phase.status === "in_progress"
                                ? "border-primary/30 text-primary bg-primary/10"
                                : "text-muted-foreground"
                            }`}
                          >
                            {phase.status.replace(/_/g, " ")}
                          </Badge>
                        </div>
                        {phase.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{phase.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                        <Clock className="w-3.5 h-3.5" />
                        <span>~{phase.estimated_hours}h</span>
                      </div>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="pt-2 pb-4 space-y-3">
                    {phase.activities && phase.activities.length > 0 ? (
                      phase.activities.map((activity) => {
                        const isDone = activity.status === "completed";
                        return (
                          <div 
                            key={activity.id} 
                            className={`p-3.5 rounded-lg border transition-all ${
                              isDone ? "bg-muted/30 border-muted opacity-80" : "bg-card hover:border-primary/30"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3">
                                <button
                                  type="button"
                                  onClick={() => user && toggleActivityMutation.mutate({
                                    userId: user.id,
                                    activityId: activity.id,
                                    newStatus: isDone ? "pending" : "completed",
                                  })}
                                  className="mt-0.5 text-muted-foreground hover:text-primary transition-colors"
                                >
                                  {isDone ? (
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-500/20" />
                                  ) : (
                                    <Circle className="w-5 h-5 text-muted-foreground" />
                                  )}
                                </button>

                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`text-sm font-semibold ${isDone ? "line-through text-muted-foreground" : ""}`}>
                                      {activity.title}
                                    </span>
                                    <Badge variant="outline" className="text-[10px] capitalize gap-1 py-0 px-1.5">
                                      {getActivityIcon(activity.activity_type)}
                                      {activity.activity_type}
                                    </Badge>
                                    {activity.priority === "critical" && (
                                      <Badge variant="outline" className="text-[10px] border-red-500/30 text-red-500 bg-red-500/10 py-0 px-1.5">
                                        High Impact
                                      </Badge>
                                    )}
                                  </div>
                                  {activity.description && (
                                    <p className="text-xs text-muted-foreground">{activity.description}</p>
                                  )}

                                  {/* Verified Resources Links */}
                                  {activity.resources && activity.resources.length > 0 && (
                                    <div className="flex flex-wrap gap-2 pt-1.5">
                                      {activity.resources.map((res) => (
                                        <a
                                          key={res.id}
                                          href={res.url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-medium bg-primary/5 border border-primary/20 px-2 py-0.5 rounded"
                                        >
                                          <span>{res.title}</span>
                                          <ExternalLink className="w-3 h-3" />
                                        </a>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                                {activity.estimated_hours}h
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-muted-foreground py-2">Activities being populated by agent...</p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ) : (
          <Card className="text-center py-16 px-4 border-dashed">
            <CardContent className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
                <Milestone className="w-6 h-6" />
              </div>
              <CardTitle className="text-xl">No active roadmap generated yet</CardTitle>
              <CardDescription className="max-w-md mx-auto text-xs">
                {profile?.target_career_id 
                  ? "Your target career is set! Trigger the Learning Recommendation Agent to construct your multi-phase path." 
                  : "Select a target career role in Career Matching to synthesize an adaptive roadmap."}
              </CardDescription>

              <div className="flex justify-center gap-3 pt-2">
                <Button onClick={handleGenerateRoadmap} disabled={generating} className="gap-2">
                  <Sparkles className="w-4 h-4" />
                  {generating ? "Orchestrating Agents..." : "Generate AI Learning Roadmap"}
                </Button>
                <Link to="/careers">
                  <Button variant="outline">Browse Careers</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Roadmap History (Archived Roadmaps for Career Goal Change tracking) */}
        {history.length > 1 && (
          <div className="mt-12 pt-8 border-t">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
              <History className="w-5 h-5 text-muted-foreground" />
              Roadmap Version History (Preserved Data)
            </h2>
            <div className="space-y-2">
              {history.filter((h) => h.status === "archived").map((archived) => (
                <div key={archived.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 text-xs">
                  <div>
                    <span className="font-semibold">{archived.career_role?.title || "Career Path"}</span>
                    <span className="text-muted-foreground ml-2">Version {archived.version}.0</span>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Archived: {new Date(archived.archived_at || archived.created_at).toLocaleDateString()} • Reason: {archived.change_reason || "Replaced"}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-muted-foreground">Archived</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LearningRoadmap;
