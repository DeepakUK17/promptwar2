import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getCurrentUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAssessmentDetails, useSubmitAssessment, Question } from "@/hooks/useAssessments";
import { Clock, AlertCircle, CheckCircle2, ArrowRight, ArrowLeft, Send } from "lucide-react";

const AssessmentExam = () => {
  const { id: assessmentId } = useParams<{ id: string }>();
  const [user, setUser] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({}); // questionId -> optionId
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(15 * 60);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);

  const navigate = useNavigate();
  const { data, isLoading } = useAssessmentDetails(assessmentId);
  const submitMutation = useSubmitAssessment();

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        navigate("/login");
        return;
      }
      setUser(currentUser);
    };
    checkAuth();
  }, [navigate]);

  // Initialize timer once assessment is loaded
  useEffect(() => {
    if (data?.assessment?.duration_minutes) {
      setTimeLeftSeconds(data.assessment.duration_minutes * 60);
    }
  }, [data]);

  // Countdown loop
  useEffect(() => {
    if (timeLeftSeconds <= 0) return;
    const interval = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeftSeconds]);

  const handleAutoSubmit = () => {
    handleSubmit();
  };

  const handleSelectOption = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleSubmit = async () => {
    if (!user || !assessmentId || !data) return;

    const result = await submitMutation.mutateAsync({
      userId: user.id,
      assessmentId,
      skillId: data.assessment.skill_id || undefined,
      answers,
      questions: data.questions,
    });

    navigate(`/assessments/${assessmentId}/results`, {
      state: {
        attempt: result.attempt,
        percentage: result.percentage,
        earnedScore: result.earnedScore,
        totalMarks: result.totalMarks,
        weakTopics: result.weakTopics,
        assessmentTitle: data.assessment.title,
        skillName: data.assessment.skill?.name || "Skill",
      },
    });
  };

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
        Loading assessment questions...
      </div>
    );
  }

  const { assessment, questions } = data;
  const currentQuestion: Question | undefined = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;

  const minutes = Math.floor(timeLeftSeconds / 60);
  const seconds = timeLeftSeconds % 60;
  const timerDisplay = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Test Header Bar */}
      <header className="border-b bg-card sticky top-0 z-50 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs font-semibold uppercase">
            {assessment.skill?.name || "Skill Test"}
          </Badge>
          <h1 className="font-semibold text-sm sm:text-base truncate max-w-md">
            {assessment.title}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-1.5 font-mono text-sm font-semibold px-3 py-1 rounded-md border ${
            timeLeftSeconds < 180 ? "bg-red-500/10 text-red-500 border-red-500/30" : "bg-muted border-border"
          }`}>
            <Clock className="w-4 h-4" />
            <span>{timerDisplay}</span>
          </div>

          <Button 
            size="sm" 
            variant="default"
            className="gap-1.5 text-xs bg-primary"
            onClick={() => setConfirmSubmitOpen(true)}
          >
            <Send className="w-3.5 h-3.5" />
            Submit Test
          </Button>
        </div>
      </header>

      {/* Main Examination View */}
      <div className="flex-1 container mx-auto px-4 py-8 max-w-5xl grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left / Center: Question Panel */}
        <div className="md:col-span-3 space-y-6">
          {currentQuestion ? (
            <Card className="border-border/80">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Question {currentIndex + 1} of {questions.length}</span>
                  {currentQuestion.topic && (
                    <Badge variant="secondary" className="text-[11px] font-normal">
                      Topic: {currentQuestion.topic}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-lg font-medium pt-3 leading-relaxed">
                  {currentQuestion.question_text}
                </CardTitle>
              </CardHeader>

              <CardContent className="pt-6">
                <RadioGroup
                  value={answers[currentQuestion.id] || ""}
                  onValueChange={(val) => handleSelectOption(currentQuestion.id, val)}
                  className="space-y-3"
                >
                  {currentQuestion.options.map((opt, idx) => {
                    const isSelected = answers[currentQuestion.id] === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => handleSelectOption(currentQuestion.id, opt.id)}
                        className={`flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-all ${
                          isSelected 
                            ? "border-primary bg-primary/[0.04] ring-1 ring-primary/40 font-medium" 
                            : "hover:bg-muted/40 border-border"
                        }`}
                      >
                        <RadioGroupItem value={opt.id} id={opt.id} />
                        <Label htmlFor={opt.id} className="cursor-pointer flex-1 text-sm leading-relaxed">
                          <span className="font-semibold text-muted-foreground mr-2">
                            {String.fromCharCode(65 + idx)}.
                          </span>
                          {opt.text}
                        </Label>
                      </div>
                    );
                  })}
                </RadioGroup>
              </CardContent>

              <CardFooter className="border-t py-4 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  className="gap-1.5 text-xs"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Previous
                </Button>

                <div className="text-xs text-muted-foreground">
                  {answers[currentQuestion.id] ? "Response recorded" : "Not answered yet"}
                </div>

                {currentIndex < questions.length - 1 ? (
                  <Button
                    size="sm"
                    onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                    className="gap-1.5 text-xs"
                  >
                    Next
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => setConfirmSubmitOpen(true)}
                    className="gap-1.5 text-xs bg-primary"
                  >
                    Review & Submit
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                )}
              </CardFooter>
            </Card>
          ) : (
            <div className="text-center py-12 text-muted-foreground">No questions found.</div>
          )}
        </div>

        {/* Right: Palette & Overview */}
        <div className="md:col-span-1 space-y-4">
          <Card className="border-border/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Question Overview</CardTitle>
              <div className="text-xs text-muted-foreground">
                Answered: <span className="font-semibold text-foreground">{answeredCount}</span> / {questions.length}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-4 gap-2">
                {questions.map((q, idx) => {
                  const isAnswered = !!answers[q.id];
                  const isCurrent = idx === currentIndex;

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-9 w-9 rounded-md font-medium text-xs flex items-center justify-center transition-all ${
                        isCurrent 
                          ? "ring-2 ring-primary ring-offset-2 bg-primary text-primary-foreground font-bold" 
                          : isAnswered
                          ? "bg-emerald-500/20 text-emerald-600 border border-emerald-500/40"
                          : "bg-muted hover:bg-muted/80 text-foreground border border-border"
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 pt-4 border-t space-y-2 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/40" />
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-muted border border-border" />
                  <span>Unanswered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-primary" />
                  <span>Current Question</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmSubmitOpen} onOpenChange={setConfirmSubmitOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Submit Assessment?</DialogTitle>
            <DialogDescription>
              You have answered {answeredCount} out of {questions.length} questions. Once submitted, the Evaluation Agent will analyze your responses and update your learning roadmap.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex sm:justify-between gap-2 mt-4">
            <Button variant="outline" onClick={() => setConfirmSubmitOpen(false)}>
              Continue Test
            </Button>
            <Button onClick={handleSubmit} disabled={submitMutation.isPending} className="gap-2 bg-primary">
              {submitMutation.isPending ? "Evaluating..." : "Confirm & Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AssessmentExam;
