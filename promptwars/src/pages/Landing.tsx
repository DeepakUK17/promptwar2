import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  Compass, 
  Wrench, 
  Milestone, 
  FileCheck2, 
  Bot, 
  ArrowRight, 
  CheckCircle2, 
  TrendingUp, 
  Terminal,
  Cpu
} from "lucide-react";
import Navigation from "@/components/Navigation";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation isAuthenticated={false} />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 lg:py-28 text-center max-w-4xl space-y-6">
        <Badge variant="outline" className="px-3.5 py-1 text-xs gap-1.5 border-primary/30 bg-primary/10 text-primary font-medium">
          <Sparkles className="w-3.5 h-3.5" />
          PromptWars Hackathon Platform
        </Badge>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
          AI-Powered Personalized Learning &{" "}
          <span className="text-primary bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Career Intelligence
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          An adaptive platform that evaluates your real skills, calculates transparent career readiness, orchestrates multi-agent roadmaps, and adapts dynamically to your progress.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link to="/register">
            <Button size="lg" className="w-full sm:w-auto text-base px-8 gap-2 bg-primary">
              Launch Learning Cockpit
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link to="/login">
            <Button size="lg" variant="outline" className="w-full sm:w-auto text-base px-8">
              Sign In
            </Button>
          </Link>
        </div>

        <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Multi-Agent LangGraph System</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Dual Assessment (MCQ + Coding Lab)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Continuous Dynamic Adaptation</span>
          </div>
        </div>
      </section>

      {/* 6 Problem Statement Pillars Section */}
      <section className="container mx-auto px-4 py-16 border-t bg-muted/[0.15]">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Unified Architectural Capabilities</h2>
          <p className="text-sm text-muted-foreground">
            Built strictly to satisfy every dimension of the PromptWars specification.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <Card className="border-border/80">
            <CardContent className="pt-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base">1. Market Career Matching</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Deterministic, weighted matching algorithm calculating match percentage against industry benchmarks for roles like Full Stack, AI Engineer, and Data Scientist.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/80">
            <CardContent className="pt-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <Wrench className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base">2. Skill Analysis & Gap Engine</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Reconciles self-reported proficiencies with empirical assessment performance, highlighting strengths and isolating high-impact missing skills.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/80">
            <CardContent className="pt-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base">3. Dual-Track Assessments</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Skill-targeted diagnostic MCQs integrated natively, paired with a specialized live Coding Lab supporting C, C++, Java & Python code execution.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/80">
            <CardContent className="pt-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
                <Milestone className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base">4. Adaptive Roadmap Generation</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Multi-phase curriculum tailored to your background. Automatically patches with remedial modules when assessment weaknesses are identified.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/80">
            <CardContent className="pt-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base">5. Multi-Agent AI Workflow</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Five specialized AI agents (Orchestrator, Skill Analysis, Career Intelligence, Recommendation, Evaluation) orchestrated via LangGraph.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/80">
            <CardContent className="pt-6 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base">6. Grounded AI Mentor</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Context-aware mentor with real-time access to your profile, verified competencies, target goals, and active roadmap milestones.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-xs text-muted-foreground">
        PromptWars Hackathon Platform • Built with React, Supabase, and LangGraph Multi-Agent Architecture
      </footer>
    </div>
  );
};

export default Landing;
