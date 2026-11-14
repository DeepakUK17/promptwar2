export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13.0.5";
  };
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: string;
          skills: string[] | null;
          location: string | null;
          bio: string | null;
          organization_name: string | null;
          organization_description: string | null;
          website_url: string | null;
          degree: string | null;
          institution: string | null;
          target_career_id: string | null;
          certifications: Json | null;
          completed_projects: Json | null;
          learning_hours_total: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          role?: string;
          skills?: string[] | null;
          location?: string | null;
          bio?: string | null;
          organization_name?: string | null;
          organization_description?: string | null;
          website_url?: string | null;
          degree?: string | null;
          institution?: string | null;
          target_career_id?: string | null;
          certifications?: Json | null;
          completed_projects?: Json | null;
          learning_hours_total?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          role?: string;
          skills?: string[] | null;
          location?: string | null;
          bio?: string | null;
          organization_name?: string | null;
          organization_description?: string | null;
          website_url?: string | null;
          degree?: string | null;
          institution?: string | null;
          target_career_id?: string | null;
          certifications?: Json | null;
          completed_projects?: Json | null;
          learning_hours_total?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_target_career_id_fkey";
            columns: ["target_career_id"];
            isOneToOne: false;
            referencedRelation: "career_roles";
            referencedColumns: ["id"];
          }
        ];
      };

      skills: {
        Row: {
          id: string;
          name: string;
          category: string;
          description: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          category?: string;
          description?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          category?: string;
          description?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };

      learner_skills: {
        Row: {
          id: string;
          user_id: string;
          skill_id: string;
          self_reported_level: number;
          assessed_level: number | null;
          verified: boolean;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          skill_id: string;
          self_reported_level?: number;
          assessed_level?: number | null;
          verified?: boolean;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          skill_id?: string;
          self_reported_level?: number;
          assessed_level?: number | null;
          verified?: boolean;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "learner_skills_skill_id_fkey";
            columns: ["skill_id"];
            isOneToOne: false;
            referencedRelation: "skills";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "learner_skills_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };

      career_roles: {
        Row: {
          id: string;
          title: string;
          description: string;
          recommended_experience: string | null;
          relevant_areas: Json | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          recommended_experience?: string | null;
          relevant_areas?: Json | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          recommended_experience?: string | null;
          relevant_areas?: Json | null;
          created_at?: string | null;
        };
        Relationships: [];
      };

      career_required_skills: {
        Row: {
          id: string;
          career_role_id: string;
          skill_id: string;
          min_proficiency: number;
          weight: number;
        };
        Insert: {
          id?: string;
          career_role_id: string;
          skill_id: string;
          min_proficiency?: number;
          weight?: number;
        };
        Update: {
          id?: string;
          career_role_id?: string;
          skill_id?: string;
          min_proficiency?: number;
          weight?: number;
        };
        Relationships: [
          {
            foreignKeyName: "career_required_skills_career_role_id_fkey";
            columns: ["career_role_id"];
            isOneToOne: false;
            referencedRelation: "career_roles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "career_required_skills_skill_id_fkey";
            columns: ["skill_id"];
            isOneToOne: false;
            referencedRelation: "skills";
            referencedColumns: ["id"];
          }
        ];
      };

      assessments: {
        Row: {
          id: string;
          title: string;
          skill_id: string | null;
          description: string | null;
          duration_minutes: number;
          passing_score: number;
          is_active: boolean;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          skill_id?: string | null;
          description?: string | null;
          duration_minutes?: number;
          passing_score?: number;
          is_active?: boolean;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          skill_id?: string | null;
          description?: string | null;
          duration_minutes?: number;
          passing_score?: number;
          is_active?: boolean;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "assessments_skill_id_fkey";
            columns: ["skill_id"];
            isOneToOne: false;
            referencedRelation: "skills";
            referencedColumns: ["id"];
          }
        ];
      };

      questions: {
        Row: {
          id: string;
          assessment_id: string;
          question_text: string;
          difficulty: string;
          topic: string | null;
          marks: number;
          options: Json;
          explanation: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          assessment_id: string;
          question_text: string;
          difficulty?: string;
          topic?: string | null;
          marks?: number;
          options: Json;
          explanation?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          assessment_id?: string;
          question_text?: string;
          difficulty?: string;
          topic?: string | null;
          marks?: number;
          options?: Json;
          explanation?: string | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "questions_assessment_id_fkey";
            columns: ["assessment_id"];
            isOneToOne: false;
            referencedRelation: "assessments";
            referencedColumns: ["id"];
          }
        ];
      };

      assessment_attempts: {
        Row: {
          id: string;
          user_id: string;
          assessment_id: string | null;
          skill_id: string | null;
          started_at: string | null;
          submitted_at: string | null;
          score: number;
          total_marks: number;
          percentage: number;
          status: string;
          answers: Json;
          source: string;
          weak_topics: Json;
        };
        Insert: {
          id?: string;
          user_id: string;
          assessment_id?: string | null;
          skill_id?: string | null;
          started_at?: string | null;
          submitted_at?: string | null;
          score?: number;
          total_marks?: number;
          percentage?: number;
          status?: string;
          answers?: Json;
          source?: string;
          weak_topics?: Json;
        };
        Update: {
          id?: string;
          user_id?: string;
          assessment_id?: string | null;
          skill_id?: string | null;
          started_at?: string | null;
          submitted_at?: string | null;
          score?: number;
          total_marks?: number;
          percentage?: number;
          status?: string;
          answers?: Json;
          source?: string;
          weak_topics?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "assessment_attempts_assessment_id_fkey";
            columns: ["assessment_id"];
            isOneToOne: false;
            referencedRelation: "assessments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assessment_attempts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };

      learning_roadmaps: {
        Row: {
          id: string;
          user_id: string;
          career_role_id: string | null;
          version: number;
          status: string;
          readiness_score: number;
          change_reason: string | null;
          created_at: string | null;
          archived_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          career_role_id?: string | null;
          version?: number;
          status?: string;
          readiness_score?: number;
          change_reason?: string | null;
          created_at?: string | null;
          archived_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          career_role_id?: string | null;
          version?: number;
          status?: string;
          readiness_score?: number;
          change_reason?: string | null;
          created_at?: string | null;
          archived_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "learning_roadmaps_career_role_id_fkey";
            columns: ["career_role_id"];
            isOneToOne: false;
            referencedRelation: "career_roles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "learning_roadmaps_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };

      roadmap_phases: {
        Row: {
          id: string;
          roadmap_id: string;
          phase_number: number;
          title: string;
          description: string | null;
          status: string;
          estimated_hours: number;
          order_index: number;
        };
        Insert: {
          id?: string;
          roadmap_id: string;
          phase_number: number;
          title: string;
          description?: string | null;
          status?: string;
          estimated_hours?: number;
          order_index?: number;
        };
        Update: {
          id?: string;
          roadmap_id?: string;
          phase_number?: number;
          title?: string;
          description?: string | null;
          status?: string;
          estimated_hours?: number;
          order_index?: number;
        };
        Relationships: [
          {
            foreignKeyName: "roadmap_phases_roadmap_id_fkey";
            columns: ["roadmap_id"];
            isOneToOne: false;
            referencedRelation: "learning_roadmaps";
            referencedColumns: ["id"];
          }
        ];
      };

      learning_activities: {
        Row: {
          id: string;
          phase_id: string;
          skill_id: string | null;
          activity_type: string;
          title: string;
          description: string | null;
          priority: string;
          estimated_hours: number;
          status: string;
          completed_at: string | null;
          order_index: number;
        };
        Insert: {
          id?: string;
          phase_id: string;
          skill_id?: string | null;
          activity_type: string;
          title: string;
          description?: string | null;
          priority?: string;
          estimated_hours?: number;
          status?: string;
          completed_at?: string | null;
          order_index?: number;
        };
        Update: {
          id?: string;
          phase_id?: string;
          skill_id?: string | null;
          activity_type?: string;
          title?: string;
          description?: string | null;
          priority?: string;
          estimated_hours?: number;
          status?: string;
          completed_at?: string | null;
          order_index?: number;
        };
        Relationships: [
          {
            foreignKeyName: "learning_activities_phase_id_fkey";
            columns: ["phase_id"];
            isOneToOne: false;
            referencedRelation: "roadmap_phases";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "learning_activities_skill_id_fkey";
            columns: ["skill_id"];
            isOneToOne: false;
            referencedRelation: "skills";
            referencedColumns: ["id"];
          }
        ];
      };

      learning_resources: {
        Row: {
          id: string;
          activity_id: string;
          resource_type: string;
          title: string;
          url: string;
          source: string | null;
        };
        Insert: {
          id?: string;
          activity_id: string;
          resource_type?: string;
          title: string;
          url: string;
          source?: string | null;
        };
        Update: {
          id?: string;
          activity_id?: string;
          resource_type?: string;
          title?: string;
          url?: string;
          source?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "learning_resources_activity_id_fkey";
            columns: ["activity_id"];
            isOneToOne: false;
            referencedRelation: "learning_activities";
            referencedColumns: ["id"];
          }
        ];
      };

      learning_progress: {
        Row: {
          id: string;
          user_id: string;
          activity_id: string | null;
          completed_at: string | null;
          time_spent_minutes: number;
          notes: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          activity_id?: string | null;
          completed_at?: string | null;
          time_spent_minutes?: number;
          notes?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          activity_id?: string | null;
          completed_at?: string | null;
          time_spent_minutes?: number;
          notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "learning_progress_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };

      agent_execution_logs: {
        Row: {
          id: string;
          user_id: string;
          trigger_event: string;
          agents_used: string[];
          input_payload: Json;
          output_payload: Json;
          duration_ms: number;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          trigger_event: string;
          agents_used?: string[];
          input_payload?: Json;
          output_payload?: Json;
          duration_ms?: number;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          trigger_event?: string;
          agents_used?: string[];
          input_payload?: Json;
          output_payload?: Json;
          duration_ms?: number;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "agent_execution_logs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };

      mentor_conversations: {
        Row: {
          id: string;
          user_id: string;
          role: string;
          content: string;
          agent_context: Json;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: string;
          content: string;
          agent_context?: Json;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: string;
          content?: string;
          agent_context?: Json;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "mentor_conversations_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };

      // Legacy tables kept for backwards compatibility
      opportunities: {
        Row: {
          id: string;
          ngo_id: string;
          title: string;
          description: string;
          required_skills: string[];
          duration: string;
          location: string;
          status: string;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          ngo_id: string;
          title: string;
          description: string;
          required_skills?: string[];
          duration: string;
          location: string;
          status?: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          ngo_id?: string;
          title?: string;
          description?: string;
          required_skills?: string[];
          duration?: string;
          location?: string;
          status?: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };

      applications: {
        Row: {
          id: string;
          opportunity_id: string;
          volunteer_id: string;
          cover_letter: string;
          status: string;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          opportunity_id: string;
          volunteer_id: string;
          cover_letter: string;
          status?: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          opportunity_id?: string;
          volunteer_id?: string;
          cover_letter?: string;
          status?: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };

      messages: {
        Row: {
          id: string;
          sender_id: string;
          receiver_id: string;
          content: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          sender_id: string;
          receiver_id: string;
          content: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          sender_id?: string;
          receiver_id?: string;
          content?: string;
          created_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
        Database["public"]["Views"])
    ? (Database["public"]["Tables"] &
        Database["public"]["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;
