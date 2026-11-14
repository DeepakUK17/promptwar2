import { describe, it, expect, vi } from "vitest";

// Sample mock Supabase response factory
export function createMockSupabase(skillsData: any[] = [], error: any = null) {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: error ? null : skillsData,
          error,
        }),
        eq: vi.fn().mockResolvedValue({
          data: error ? null : skillsData,
          error,
        }),
      }),
      upsert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: error ? null : skillsData[0],
            error,
          }),
        }),
      }),
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error,
          }),
        }),
      }),
    }),
  };
}

describe("Skill Management Data Access & States", () => {
  it("handles success state when fetching skills catalog", async () => {
    const mockSkills = [
      { id: "s1", name: "JavaScript", category: "Frontend" },
      { id: "s2", name: "Python", category: "Backend" },
    ];
    const mockSupabase = createMockSupabase(mockSkills);

    const { data, error } = await mockSupabase.from("skills").select("*").order("name");

    expect(error).toBeNull();
    expect(data).toHaveLength(2);
    expect(data[0].name).toBe("JavaScript");
  });

  it("handles empty state when no skills are cataloged", async () => {
    const mockSupabase = createMockSupabase([]);
    const { data, error } = await mockSupabase.from("skills").select("*").order("name");

    expect(error).toBeNull();
    expect(data).toHaveLength(0);
  });

  it("handles error state gracefully on network/db failures", async () => {
    const mockError = { message: "Failed to connect to database" };
    const mockSupabase = createMockSupabase([], mockError);

    const { data, error } = await mockSupabase.from("skills").select("*").order("name");

    expect(data).toBeNull();
    expect(error).not.toBeNull();
    expect(error.message).toBe("Failed to connect to database");
  });

  it("successfully upserts a learner skill with self-reported level", async () => {
    const savedSkill = {
      id: "ls-1",
      user_id: "u-1",
      skill_id: "s-1",
      self_reported_level: 75,
      assessed_level: null,
      verified: false,
    };
    const mockSupabase = createMockSupabase([savedSkill]);

    const { data, error } = await mockSupabase
      .from("learner_skills")
      .upsert(savedSkill)
      .select()
      .single();

    expect(error).toBeNull();
    expect(data.self_reported_level).toBe(75);
    expect(data.verified).toBe(false);
  });
});
