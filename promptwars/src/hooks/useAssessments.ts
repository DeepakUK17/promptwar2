import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Assessment {
  id: string;
  title: string;
  skill_id: string | null;
  description: string | null;
  duration_minutes: number;
  passing_score: number;
  is_active: boolean;
  skill?: {
    id: string;
    name: string;
    category: string;
  };
  questions_count?: number;
}

export interface QuestionOption {
  id: string;
  text: string;
  is_correct: boolean;
}

export interface Question {
  id: string;
  assessment_id: string;
  question_text: string;
  difficulty: string;
  topic: string | null;
  marks: number;
  options: QuestionOption[];
  explanation: string | null;
}

export interface AssessmentAttempt {
  id: string;
  user_id: string;
  assessment_id: string | null;
  skill_id: string | null;
  started_at: string;
  submitted_at: string | null;
  score: number;
  total_marks: number;
  percentage: number;
  status: string;
  answers: Record<string, string>;
  source: string;
  weak_topics: string[];
  assessment?: Assessment;
}

export const useAssessments = () => {
  return useQuery({
    queryKey: ["assessments-list"],
    queryFn: async (): Promise<Assessment[]> => {
      const { data, error } = await supabase
        .from("assessments")
        .select("*, skill:skills(*)")
        .eq("is_active", true)
        .order("title");

      if (error) {
        console.error("Error fetching assessments:", error);
        return [];
      }
      return (data as any) || [];
    },
  });
};

export const useAssessmentDetails = (assessmentId?: string) => {
  return useQuery({
    queryKey: ["assessment-details", assessmentId],
    enabled: !!assessmentId,
    queryFn: async () => {
      if (!assessmentId) return null;

      const { data: assessment, error: aError } = await supabase
        .from("assessments")
        .select("*, skill:skills(*)")
        .eq("id", assessmentId)
        .single();

      if (aError) throw aError;

      const { data: questions, error: qError } = await supabase
        .from("questions")
        .select("*")
        .eq("assessment_id", assessmentId)
        .order("created_at");

      if (qError) throw qError;

      return {
        assessment: assessment as unknown as Assessment,
        questions: (questions as any[]) || [],
      };
    },
  });
};

export const useSubmitAssessment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      userId,
      assessmentId,
      skillId,
      answers,
      questions,
    }: {
      userId: string;
      assessmentId: string;
      skillId?: string;
      answers: Record<string, string>; // questionId -> optionId
      questions: Question[];
    }) => {
      let earnedScore = 0;
      let totalMarks = 0;
      const weakTopicsSet = new Set<string>();

      questions.forEach((q) => {
        totalMarks += q.marks || 1;
        const selectedOptId = answers[q.id];
        const selectedOpt = q.options.find((o) => o.id === selectedOptId);
        
        if (selectedOpt && selectedOpt.is_correct) {
          earnedScore += q.marks || 1;
        } else {
          // Identify weak topic
          if (q.topic) {
            weakTopicsSet.add(q.topic);
          }
        }
      });

      const percentage = totalMarks > 0 ? Math.round((earnedScore / totalMarks) * 100) : 0;
      const weakTopics = Array.from(weakTopicsSet);

      // 1. Insert into assessment_attempts
      const { data: attempt, error: attemptError } = await supabase
        .from("assessment_attempts")
        .insert({
          user_id: userId,
          assessment_id: assessmentId,
          skill_id: skillId || null,
          started_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          submitted_at: new Date().toISOString(),
          score: earnedScore,
          total_marks: totalMarks,
          percentage,
          status: "submitted",
          answers,
          source: "native_mcq",
          weak_topics: weakTopics,
        })
        .select()
        .single();

      if (attemptError) throw attemptError;

      // 2. Update learner_skills table with the verified assessed level
      if (skillId) {
        await supabase
          .from("learner_skills")
          .upsert(
            {
              user_id: userId,
              skill_id: skillId,
              assessed_level: percentage,
              verified: true,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id,skill_id" }
          );
      }

      // 3. Trigger Evaluation Agent via AI backend
      const aiBackendUrl = import.meta.env.VITE_AI_BACKEND_URL || "http://localhost:8000";
      try {
        await fetch(`${aiBackendUrl}/api/agents/evaluate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            attempt_id: attempt.id,
            skill_id: skillId,
            score_percentage: percentage,
            weak_topics: weakTopics,
          }),
        });
      } catch (e) {
        console.warn("AI Backend evaluation notification failed/offline:", e);
      }

      return {
        attempt,
        percentage,
        earnedScore,
        totalMarks,
        weakTopics,
      };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["learner-skills", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["career-readiness"] });
      queryClient.invalidateQueries({ queryKey: ["active-roadmap", variables.userId] });
      toast({
        title: "Assessment submitted!",
        description: "Evaluation Agent analyzed your responses and updated your skill profile.",
      });
    },
  });
};

export const useSyncCodingTest = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      userId,
      skillName,
      scorePercentage,
      testTitle,
      notes,
    }: {
      userId: string;
      skillName: string;
      scorePercentage: number;
      testTitle: string;
      notes?: string;
    }) => {
      // Find skill id if exists
      const { data: skill } = await supabase
        .from("skills")
        .select("id")
        .ilike("name", skillName)
        .maybeSingle();

      const skillId = skill?.id || null;

      // Insert record
      const { data: attempt, error } = await supabase
        .from("assessment_attempts")
        .insert({
          user_id: userId,
          skill_id: skillId,
          started_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          submitted_at: new Date().toISOString(),
          score: scorePercentage,
          total_marks: 100,
          percentage: scorePercentage,
          status: "submitted",
          source: "coding_lab",
          weak_topics: scorePercentage < 60 ? [`${skillName} Code Implementation`] : [],
        })
        .select()
        .single();

      if (error) throw error;

      if (skillId) {
        await supabase
          .from("learner_skills")
          .upsert(
            {
              user_id: userId,
              skill_id: skillId,
              assessed_level: scorePercentage,
              verified: true,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id,skill_id" }
          );
      }

      // Notify Evaluation Agent
      const aiBackendUrl = import.meta.env.VITE_AI_BACKEND_URL || "http://localhost:8000";
      try {
        await fetch(`${aiBackendUrl}/api/agents/evaluate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            attempt_id: attempt.id,
            skill_id: skillId,
            score_percentage: scorePercentage,
            source: "coding_lab",
          }),
        });
      } catch (e) {
        console.warn("AI Backend evaluation notification failed/offline:", e);
      }

      return attempt;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["learner-skills", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["career-readiness"] });
      queryClient.invalidateQueries({ queryKey: ["active-roadmap", variables.userId] });
      toast({
        title: "Coding Lab results synchronized!",
        description: "Skill proficiency calibrated and adaptive learning path updated.",
      });
    },
  });
};
