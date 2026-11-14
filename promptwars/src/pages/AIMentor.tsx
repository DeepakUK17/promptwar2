import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, getProfile } from "@/lib/auth";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useMentorConversation, useSendMentorMessage } from "@/hooks/useMentor";
import { useCareerRoles, useCareerReadiness } from "@/hooks/useCareers";
import { useActiveRoadmap } from "@/hooks/useRoadmap";
import { 
  Bot, 
  Send, 
  Sparkles, 
  Compass, 
  Target, 
  HelpCircle, 
  AlertTriangle,
  Lightbulb,
  User,
  ArrowRight
} from "lucide-react";
import { MarkdownView } from "@/components/MarkdownView";

const AIMentor = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { data: careerRoles = [] } = useCareerRoles();
  const targetCareerId = profile?.target_career_id || careerRoles[0]?.id;
  const currentCareer = careerRoles.find((c) => c.id === targetCareerId);

  const { data: readiness } = useCareerReadiness(user?.id, targetCareerId);
  const { data: roadmap } = useActiveRoadmap(user?.id);
  const { data: conversation = [], isLoading: convLoading } = useMentorConversation(user?.id);
  const sendMessageMutation = useSendMentorMessage();

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation, sendMessageMutation.isPending]);

  const handleSend = (textToSend?: string) => {
    const message = textToSend || inputText;
    if (!message.trim() || !user || sendMessageMutation.isPending) return;

    sendMessageMutation.mutate({
      userId: user.id,
      message: message.trim(),
      context: {
        targetCareer: currentCareer?.title || "Full Stack Developer",
        readinessScore: readiness?.readinessScore ?? 45,
        skillGaps: readiness?.priorityAreas || ["JavaScript", "React", "Node.js"],
        currentPhase: roadmap?.phases[0]?.title || "Phase 1: Foundations",
      },
    });

    setInputText("");
  };

  const quickPrompts = [
    "What should I learn today based on my gaps?",
    "Why do I need these specific skills for my career?",
    "Analyze my recent assessment performance",
    "How does my roadmap adapt if I switch careers?",
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation profile={profile} />

      <div className="flex-1 container mx-auto px-4 py-6 max-w-6xl grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Live Learner Context Drawer */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="border-primary/30 bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-primary font-semibold text-xs">
                <Target className="w-4 h-4" />
                <span>Live Learner State</span>
              </div>
              <CardTitle className="text-base font-bold">Context Grounding</CardTitle>
              <CardDescription className="text-xs">
                The mentor grounds every answer in this live database context.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="p-2.5 rounded-lg border bg-muted/30 space-y-1">
                <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                  Target Career
                </span>
                <p className="font-semibold text-sm text-foreground">
                  {currentCareer?.title || "Full Stack Developer"}
                </p>
              </div>

              <div className="p-2.5 rounded-lg border bg-muted/30 space-y-1">
                <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                  Verified Readiness
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-primary">
                    {readiness?.readinessScore ?? 45}%
                  </span>
                  <span className="text-[11px] text-muted-foreground">match index</span>
                </div>
              </div>

              {readiness?.priorityAreas && readiness.priorityAreas.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                    Target Skill Gaps
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {readiness.priorityAreas.slice(0, 4).map((skill, i) => (
                      <Badge key={i} variant="secondary" className="text-[11px]">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 border-t text-[11px] text-muted-foreground leading-relaxed">
                Powered by LangGraph multi-agent orchestration.
              </div>
            </CardContent>
          </Card>

          {/* Quick Prompts */}
          <Card className="border-border/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold flex items-center gap-1.5 text-muted-foreground">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                Suggested Queries
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 pt-0">
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(prompt)}
                  className="w-full text-left text-xs p-2 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground line-clamp-2 border border-transparent hover:border-border"
                >
                  "{prompt}"
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right: Conversational Stream */}
        <div className="lg:col-span-3 flex flex-col h-[calc(100vh-140px)] rounded-xl border bg-card overflow-hidden">
          {/* Chat Header */}
          <div className="border-b p-4 px-6 flex items-center justify-between bg-card">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-semibold text-sm">PromptWars Context-Aware AI Mentor</h2>
                <p className="text-[11px] text-muted-foreground">
                  Synchronized with Orchestrator, Career Intelligence, and Evaluation Agents
                </p>
              </div>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {conversation.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-3 text-muted-foreground">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-foreground text-base">Hello, {profile?.full_name || "Learner"}!</h3>
                <p className="text-xs leading-relaxed">
                  I am your personalized AI Career Mentor. I have full context of your profile, verified skills, target role ({currentCareer?.title}), and roadmap milestones.
                </p>
                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => handleSend("What should I learn today based on my gaps?")}
                  >
                    What should I learn today?
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => handleSend("Why do I need these specific skills?")}
                  >
                    Why these skills?
                  </Button>
                </div>
              </div>
            ) : (
              conversation.map((msg) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      isUser ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                    }`}>
                      {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>

                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-sm ${
                      isUser 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted/40 border text-foreground"
                    }`}>
                      {isUser ? (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <div className="prose prose-xs dark:prose-invert max-w-none">
                          <MarkdownView content={msg.content} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {sendMessageMutation.isPending && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="rounded-2xl px-4 py-3 bg-muted/40 border text-xs text-muted-foreground flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 animate-spin text-primary" />
                  <span>Synthesizing agent recommendations...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <div className="p-4 border-t bg-card">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <Input
                placeholder="Ask about your skill gaps, roadmap tasks, or practical assignments..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={sendMessageMutation.isPending}
                className="text-xs"
              />
              <Button
                type="submit"
                size="sm"
                disabled={!inputText.trim() || sendMessageMutation.isPending}
                className="gap-1.5 shrink-0 bg-primary"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIMentor;

