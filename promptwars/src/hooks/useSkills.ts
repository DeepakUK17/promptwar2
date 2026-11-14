import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Skill {
  id: string;
  name: string;
  category: string;
  description: string | null;
}

export interface LearnerSkill {
  id: string;
  user_id: string;
  skill_id: string;
  self_reported_level: number;
  assessed_level: number | null;
  verified: boolean;
  updated_at: string | null;
  skill?: Skill;
}

export const useSkills = () => {
  return useQuery({
    queryKey: ["skills-catalog"],
    queryFn: async (): Promise<Skill[]> => {
      const { data, error } = await supabase
        .from("skills")
        .select("*")
        .order("name");

      if (error) {
        console.error("Error fetching skills catalog:", error);
        return [];
      }
      return data || [];
    },
  });
};

export const useLearnerSkills = (userId?: string) => {
  return useQuery({
    queryKey: ["learner-skills", userId],
    enabled: !!userId,
    queryFn: async (): Promise<LearnerSkill[]> => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from("learner_skills")
        .select("*, skill:skills(*)")
        .eq("user_id", userId);

      if (error) {
        console.error("Error fetching learner skills:", error);
        return [];
      }
      return (data as any) || [];
    },
  });
};

export const useSaveLearnerSkill = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      userId,
      skillId,
      selfReportedLevel,
      assessedLevel,
      verified,
    }: {
      userId: string;
      skillId: string;
      selfReportedLevel?: number;
      assessedLevel?: number;
      verified?: boolean;
    }) => {
      const payload: any = {
        user_id: userId,
        skill_id: skillId,
        updated_at: new Date().toISOString(),
      };
      if (selfReportedLevel !== undefined) payload.self_reported_level = selfReportedLevel;
      if (assessedLevel !== undefined) payload.assessed_level = assessedLevel;
      if (verified !== undefined) payload.verified = verified;

      const { data, error } = await supabase
        .from("learner_skills")
        .upsert(payload, { onConflict: "user_id,skill_id" })
        .select("*, skill:skills(*)")
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["learner-skills", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["career-readiness"] });
      queryClient.invalidateQueries({ queryKey: ["active-roadmap"] });
      toast({ title: "Skill updated successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update skill",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteLearnerSkill = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, skillId }: { userId: string; skillId: string }) => {
      const { error } = await supabase
        .from("learner_skills")
        .delete()
        .eq("user_id", userId)
        .eq("skill_id", skillId);

      if (error) throw error;
      return { userId, skillId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["learner-skills", data.userId] });
      queryClient.invalidateQueries({ queryKey: ["career-readiness"] });
      toast({ title: "Skill removed" });
    },
  });
};
