import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { calculateCareerReadiness, CareerReadinessAnalysis, CareerSkillRequirement, LearnerSkillItem } from "@/lib/careerCalculations";

export interface CareerRole {
  id: string;
  title: string;
  description: string;
  recommended_experience: string | null;
  relevant_areas: string[] | null;
}

export interface CareerWithRequirements extends CareerRole {
  requirements: CareerSkillRequirement[];
}

export const useCareerRoles = () => {
  return useQuery({
    queryKey: ["career-roles"],
    queryFn: async (): Promise<CareerRole[]> => {
      const { data, error } = await supabase
        .from("career_roles")
        .select("*")
        .order("title");

      if (error) {
        console.error("Error fetching career roles:", error);
        return [];
      }
      return (data as any) || [];
    },
  });
};

export const useCareerDetails = (careerId?: string) => {
  return useQuery({
    queryKey: ["career-details", careerId],
    enabled: !!careerId,
    queryFn: async (): Promise<CareerWithRequirements | null> => {
      if (!careerId) return null;

      const { data: roleData, error: roleError } = await supabase
        .from("career_roles")
        .select("*")
        .eq("id", careerId)
        .single();

      if (roleError || !roleData) return null;

      const { data: reqData, error: reqError } = await supabase
        .from("career_required_skills")
        .select("*, skill:skills(*)")
        .eq("career_role_id", careerId);

      const requirements: CareerSkillRequirement[] = ((reqData as any[]) || []).map((r) => ({
        skillId: r.skill_id,
        skillName: r.skill?.name || "Unknown Skill",
        minProficiency: r.min_proficiency,
        weight: r.weight,
        category: r.skill?.category,
      }));

      return {
        ...(roleData as any),
        requirements,
      };
    },
  });
};

export const useCareerReadiness = (userId?: string, careerId?: string) => {
  return useQuery({
    queryKey: ["career-readiness", userId, careerId],
    enabled: !!userId && !!careerId,
    queryFn: async (): Promise<CareerReadinessAnalysis | null> => {
      if (!userId || !careerId) return null;

      // 1. Get career requirements
      const { data: roleData } = await supabase
        .from("career_roles")
        .select("*")
        .eq("id", careerId)
        .single();

      if (!roleData) return null;

      const { data: reqData } = await supabase
        .from("career_required_skills")
        .select("*, skill:skills(*)")
        .eq("career_role_id", careerId);

      const requirements: CareerSkillRequirement[] = ((reqData as any[]) || []).map((r) => ({
        skillId: r.skill_id,
        skillName: r.skill?.name || "Skill",
        minProficiency: r.min_proficiency,
        weight: r.weight,
        category: r.skill?.category,
      }));

      // 2. Get learner skills
      const { data: userSkillsData } = await supabase
        .from("learner_skills")
        .select("*, skill:skills(*)")
        .eq("user_id", userId);

      const learnerSkills: LearnerSkillItem[] = ((userSkillsData as any[]) || []).map((s) => ({
        skillId: s.skill_id,
        skillName: s.skill?.name || "",
        selfReportedLevel: s.self_reported_level,
        assessedLevel: s.assessed_level,
        effectiveProficiency: s.assessed_level !== null ? s.assessed_level : s.self_reported_level,
        verified: s.verified,
      }));

      return calculateCareerReadiness(roleData.id, roleData.title, requirements, learnerSkills);
    },
  });
};

export const useSetTargetCareer = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, careerId, reason }: { userId: string; careerId: string; reason?: string }) => {
      // 1. Update profiles table
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ target_career_id: careerId, updated_at: new Date().toISOString() })
        .eq("id", userId);

      if (profileError) throw profileError;

      // 2. Archive current active roadmaps for this user
      await supabase
        .from("learning_roadmaps")
        .update({
          status: "archived",
          archived_at: new Date().toISOString(),
          change_reason: reason || "career_goal_change",
        })
        .eq("user_id", userId)
        .eq("status", "active");

      // 3. Trigger AI agent service to orchestrate roadmap generation
      const aiBackendUrl = import.meta.env.VITE_AI_BACKEND_URL || "http://localhost:8000";
      try {
        await fetch(`${aiBackendUrl}/api/agents/career-selection`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            career_role_id: careerId,
            reason: reason || "career_selection",
          }),
        });
      } catch (e) {
        console.warn("AI Backend service notification was buffered or offline:", e);
      }

      return { userId, careerId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["user-profile", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["career-readiness"] });
      queryClient.invalidateQueries({ queryKey: ["active-roadmap", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["roadmap-history", variables.userId] });
      toast({
        title: "Target career updated!",
        description: "Multi-agent intelligence is generating your adaptive roadmap.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Failed to update target career",
        description: err.message,
        variant: "destructive",
      });
    },
  });
};
