import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface LearningResource {
  id: string;
  activity_id: string;
  resource_type: string;
  title: string;
  url: string;
  source: string | null;
}

export interface LearningActivity {
  id: string;
  phase_id: string;
  skill_id: string | null;
  activity_type: string; // video, reading, exercise, project, assessment, remedial
  title: string;
  description: string | null;
  priority: string; // low, medium, high, critical
  estimated_hours: number;
  status: string; // pending, in_progress, completed
  completed_at: string | null;
  order_index: number;
  resources?: LearningResource[];
  skill?: {
    id: string;
    name: string;
  };
}

export interface RoadmapPhase {
  id: string;
  roadmap_id: string;
  phase_number: number;
  title: string;
  description: string | null;
  status: string; // pending, in_progress, completed
  estimated_hours: number;
  order_index: number;
  activities: LearningActivity[];
}

export interface LearningRoadmap {
  id: string;
  user_id: string;
  career_role_id: string | null;
  version: number;
  status: string; // active, archived
  readiness_score: number;
  change_reason: string | null;
  created_at: string;
  archived_at: string | null;
  career_role?: {
    id: string;
    title: string;
    description: string;
  };
  phases: RoadmapPhase[];
}

export const useActiveRoadmap = (userId?: string) => {
  return useQuery({
    queryKey: ["active-roadmap", userId],
    enabled: !!userId,
    queryFn: async (): Promise<LearningRoadmap | null> => {
      if (!userId) return null;

      // 1. Get active roadmap
      const { data: roadmap, error: rError } = await supabase
        .from("learning_roadmaps")
        .select("*, career_role:career_roles(*)")
        .eq("user_id", userId)
        .eq("status", "active")
        .order("version", { ascending: false })
        .maybeSingle();

      if (rError || !roadmap) return null;

      // 2. Get phases
      const { data: phases, error: pError } = await supabase
        .from("roadmap_phases")
        .select("*")
        .eq("roadmap_id", roadmap.id)
        .order("order_index", { ascending: true });

      if (pError || !phases) return { ...(roadmap as any), phases: [] };

      // 3. For each phase, get activities + resources
      const phaseIds = phases.map((p) => p.id);
      const { data: activities, error: aError } = await supabase
        .from("learning_activities")
        .select("*, skill:skills(*)")
        .in("phase_id", phaseIds)
        .order("order_index", { ascending: true });

      const activityIds = (activities || []).map((a) => a.id);
      let resources: any[] = [];
      if (activityIds.length > 0) {
        const { data: resData } = await supabase
          .from("learning_resources")
          .select("*")
          .in("activity_id", activityIds);
        resources = resData || [];
      }

      // Group activities and resources into phases
      const populatedPhases: RoadmapPhase[] = phases.map((phase) => {
        const phaseActs = (activities || [])
          .filter((a) => a.phase_id === phase.id)
          .map((act) => ({
            ...act,
            resources: resources.filter((r) => r.activity_id === act.id),
          }));

        return {
          ...phase,
          activities: phaseActs as any[],
        };
      });

      return {
        ...(roadmap as any),
        phases: populatedPhases,
      };
    },
  });
};

export const useRoadmapHistory = (userId?: string) => {
  return useQuery({
    queryKey: ["roadmap-history", userId],
    enabled: !!userId,
    queryFn: async (): Promise<LearningRoadmap[]> => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("learning_roadmaps")
        .select("*, career_role:career_roles(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching roadmap history:", error);
        return [];
      }
      return (data as any) || [];
    },
  });
};

export const useToggleActivityStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      userId,
      activityId,
      newStatus,
    }: {
      userId: string;
      activityId: string;
      newStatus: "pending" | "in_progress" | "completed";
    }) => {
      const isCompleted = newStatus === "completed";
      const { error } = await supabase
        .from("learning_activities")
        .update({
          status: newStatus,
          completed_at: isCompleted ? new Date().toISOString() : null,
        })
        .eq("id", activityId);

      if (error) throw error;

      // Log progress
      if (isCompleted) {
        await supabase.from("learning_progress").insert({
          user_id: userId,
          activity_id: activityId,
          completed_at: new Date().toISOString(),
          time_spent_minutes: 60,
        });
      }

      return { activityId, newStatus };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["active-roadmap", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["learning-progress", variables.userId] });
      toast({ title: `Activity marked as ${variables.newStatus}` });
    },
  });
};
