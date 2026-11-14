import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCurrentUser, getProfile } from "@/lib/auth";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAssessments, useSyncCodingTest } from "@/hooks/useAssessments";
import { useLearnerSkills } from "@/hooks/useSkills";
import { 
  FileCheck2, 
  Terminal, 
  ExternalLink, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  Code2, 
  ArrowRight,
  ShieldCheck,
  RefreshCw
} from "lucide-react";

const AssessmentPortal = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [syncData, setSyncData] = useState({
    skillName: "JavaScript",
    scorePercentage: 75,
    testTitle: "Practical Algorithm & DOM Coding Test",
  });

  const navigate = useNavigate();
  const { data: assessments = [], isLoading: assessmentsLoading } = useAssessments();
  const { data: learnerSkills = [] } = useLearnerSkills(user?.id);
  const syncCodingMutation = useSyncCodingTest();

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

  const handleSyncSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    await syncCodingMutation.mutateAsync({
      userId: user.id,
      skillName: syncData.skillName,
      scorePercentage: Number(syncData.scorePercentage),
      testTitle: syncData.testTitle,
    });
    setSyncDialogOpen(false);
  };

  // Map of verified skill IDs
  const verifiedSkillMap = new Map<string, number>();
  learnerSkills.forEach((ls) => {
    if (ls.verified && ls.assessed_level !== null) {
      verifiedSkillMap.set(ls.skill_id, ls.assessed_level);
    }
  });

  return (
    <div className="min-h-screen bg-background pb-16">
      <Navigation profile={profile} />

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs text-primary font-semibold mb-1">
            <FileCheck2 className="w-4 h-4" />
            <span>Dual Assessment Infrastructure</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Skill Assessment Center</h1>
          <p className="text-muted-foreground text-sm mt-1 max-w-2xl">
            Validate conceptual understanding via skill-specific MCQs, or test hands-on programming in our dedicated Coding Lab.
          </p>
        </div>

        {/* Section 1: Coding Lab (Specialized Code Execution) */}
        <Card className="mb-10 border-primary/40 bg-gradient-to-br from-primary/[0.04] to-card overflow-hidden">
          <div className="p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-xl">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs border-primary/30 text-primary bg-primary/10 gap-1">
                  <Terminal className="w-3.5 h-3.5" />
                  Live Code Execution Lab
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  Monaco Editor • C, C++, Java, Python
                </Badge>
              </div>

              <h2 className="text-2xl font-bold tracking-tight">Interactive Coding Laboratory</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Need to run real algorithms against automated test cases? Our dedicated Coding Portal supports live compilation, execution timeout guards, and instant pass/fail test harnesses.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <a
                  href="https://test-portal-sage.vercel.app"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button className="gap-2">
                    Open Coding Lab
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </a>

                <Dialog open={syncDialogOpen} onOpenChange={setSyncDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <RefreshCw className="w-4 h-4" />
                      Sync Coding Lab Result
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Synchronize Coding Lab Assessment</DialogTitle>
                      <DialogDescription>
                        Record your performance from the live Coding Portal to calibrate your verified skill level and update the AI roadmap.
                      </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSyncSubmit} className="space-y-4 py-2">
                      <div className="space-y-2">
                        <Label htmlFor="sync_skill">Technology Evaluated</Label>
                        <Input
                          id="sync_skill"
                          value={syncData.skillName}
                          onChange={(e) => setSyncData({ ...syncData, skillName: e.target.value })}
                          placeholder="e.g. Python or JavaScript"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="sync_title">Test Name / Problem</Label>
                        <Input
                          id="sync_title"
                          value={syncData.testTitle}
                          onChange={(e) => setSyncData({ ...syncData, testTitle: e.target.value })}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <Label htmlFor="sync_score">Score Earned</Label>
                          <span className="font-bold text-primary">{syncData.scorePercentage}%</span>
                        </div>
                        <Input
                          id="sync_score"
                          type="number"
                          min="0"
                          max="100"
                          value={syncData.scorePercentage}
                          onChange={(e) => setSyncData({ ...syncData, scorePercentage: Number(e.target.value) })}
                          required
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={syncCodingMutation.isPending}
                        className="w-full gap-2 mt-2"
                      >
                        {syncCodingMutation.isPending ? "Syncing..." : "Sync Score with AI Agents"}
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="hidden lg:block w-44 p-4 rounded-xl border bg-card/60 text-xs space-y-2">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Lab Features
              </span>
              <ul className="space-y-1.5 text-muted-foreground list-disc list-inside">
                <li>Automated test cases</li>
                <li>Syntax highlight</li>
                <li>Execution benchmarks</li>
                <li>Multi-language support</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Section 2: Native Skill-Specific Concept Assessments */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Concept Mastery Assessments</h2>
              <p className="text-xs text-muted-foreground">
                Diagnostic evaluations specifically designed to test architectural fundamentals and identify weak topics.
              </p>
            </div>
          </div>

          {assessmentsLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading assessments catalog...</div>
          ) : assessments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assessments.map((a) => {
                const skillId = a.skill_id || "";
                const verifiedScore = verifiedSkillMap.get(skillId);
                const isCompleted = verifiedScore !== undefined;

                return (
                  <Card key={a.id} className="flex flex-col justify-between hover:border-primary/40 transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <Badge variant="outline" className="text-xs capitalize font-medium">
                          {a.skill?.name || "General"}
                        </Badge>

                        {isCompleted && (
                          <Badge variant="outline" className="text-xs gap-1 border-emerald-500/30 text-emerald-600 bg-emerald-500/10">
                            <CheckCircle2 className="w-3 h-3" />
                            Completed ({verifiedScore}%)
                          </Badge>
                        )}
                      </div>

                      <CardTitle className="text-lg mt-2">{a.title}</CardTitle>
                      <CardDescription className="text-xs line-clamp-2 mt-1">
                        {a.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {a.duration_minutes} mins
                        </span>
                        <span>Passing: {a.passing_score}%</span>
                      </div>
                    </CardContent>

                    <CardFooter className="pt-2 border-t">
                      <Link to={`/assessments/${a.id}/exam`} className="w-full">
                        <Button size="sm" variant={isCompleted ? "outline" : "default"} className="w-full gap-2 text-xs">
                          <FileCheck2 className="w-4 h-4" />
                          {isCompleted ? "Retake Assessment" : "Start Assessment"}
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-muted-foreground">
              No assessments currently published.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssessmentPortal;
