import { useLocation, Link, useNavigate, useParams } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Milestone, 
  Bot, 
  Sparkles, 
  ArrowRight, 
  RotateCcw,
  ShieldCheck,
  TrendingUp,
  FileCheck2
} from "lucide-react";

const AssessmentResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id: assessmentId } = useParams<{ id: string }>();

  const state = location.state as {
    attempt?: any;
    percentage?: number;
    earnedScore?: number;
    totalMarks?: number;
    weakTopics?: string[];
    assessmentTitle?: string;
    skillName?: string;
  } | undefined;

  const percentage = state?.percentage ?? 70;
  const isPass = percentage >= 60;
  const weakTopics = state?.weakTopics || [];
  const skillName = state?.skillName || "Technology";
  const assessmentTitle = state?.assessmentTitle || "Skill Assessment";

  return (
    <div className="min-h-screen bg-background pb-16">
      <Navigation />

      <div className="container mx-auto px-4 py-10 max-w-4xl">
        <div className="text-center space-y-2 mb-8">
          <Badge variant="outline" className="text-xs uppercase font-semibold">
            Assessment Completed
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight">{assessmentTitle}</h1>
          <p className="text-muted-foreground text-sm">
            Evaluation Agent diagnostics and skill profile calibration report.
          </p>
        </div>

        {/* Hero Score Card */}
        <Card className={`mb-8 border-2 text-center p-6 ${
          isPass ? "border-emerald-500/40 bg-emerald-500/[0.02]" : "border-amber-500/40 bg-amber-500/[0.02]"
        }`}>
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center font-black text-3xl border-4 ${
              isPass 
                ? "border-emerald-500 text-emerald-500 bg-emerald-500/10" 
                : "border-amber-500 text-amber-500 bg-amber-500/10"
            }`}>
              {percentage}%
            </div>

            <div>
              <div className="flex items-center justify-center gap-2">
                {isPass ? (
                  <Badge variant="default" className="bg-emerald-600 text-white gap-1 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Benchmark Passed
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="gap-1 text-xs">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Benchmark Not Met (Remediation Triggered)
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                Score: {state?.earnedScore ?? percentage} / {state?.totalMarks ?? 100} marks earned
              </p>
            </div>
          </div>
        </Card>

        {/* 2-Column Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Skill Verification Impact */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Skill Profile Calibration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="p-3.5 rounded-lg border bg-card flex items-center justify-between">
                <div>
                  <span className="font-semibold">{skillName}</span>
                  <p className="text-xs text-muted-foreground">Assessed Skill Level</p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold text-primary">{percentage}%</span>
                  <div className="flex items-center gap-1 text-[11px] text-emerald-600">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Verified</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Your career readiness index has been recomputed automatically using this verified score instead of self-reported estimations.
              </p>
            </CardContent>
          </Card>

          {/* Weak Topics Analysis */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Identified Conceptual Gaps
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {weakTopics.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    The Evaluation Agent analyzed incorrect answers and flagged these concepts:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {weakTopics.map((topic, i) => (
                      <Badge key={i} variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-600 text-xs px-2.5 py-1">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground py-2 flex items-center gap-2 text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>No conceptual deficiencies detected across evaluated questions!</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Adaptive Roadmap Trigger Banner */}
        <Card className="border-primary/40 bg-primary/[0.03] mb-8">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-primary font-semibold text-xs">
              <Bot className="w-4 h-4" />
              <span>Evaluation Agent & Recommendation Agent Adaptive Action</span>
            </div>
            <CardTitle className="text-lg mt-1">
              {isPass ? "Path Accelerated & Validated" : "Roadmap Dynamically Patched"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground/90 leading-relaxed">
              {isPass 
                ? `Because you demonstrated ${percentage}% mastery in ${skillName}, your learning roadmap has unlocked subsequent intermediate and advanced engineering modules.`
                : `Because your score in ${skillName} fell beneath the 60% requirement, the Evaluation Agent has dynamically inserted remedial exercises on ${weakTopics.join(', ') || 'foundational concepts'} into your active phase before advancing to dependent topics.`
              }
            </p>
          </CardContent>
          <CardFooter className="pt-0 flex flex-wrap gap-3">
            <Link to="/roadmap">
              <Button className="gap-2 text-xs">
                <Milestone className="w-4 h-4" />
                Inspect Updated Roadmap
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>

            <Link to="/assessments">
              <Button variant="outline" className="gap-2 text-xs">
                <FileCheck2 className="w-4 h-4" />
                Assessment Center
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default AssessmentResults;
