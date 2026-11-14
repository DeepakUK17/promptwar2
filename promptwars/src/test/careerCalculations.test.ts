import { describe, it, expect } from "vitest";
import { calculateCareerReadiness } from "@/lib/careerCalculations";

describe("Career Readiness Engine (calculateCareerReadiness)", () => {
  it("returns 0% when no requirements are provided", () => {
    const result = calculateCareerReadiness("c-1", "Full Stack", [], []);
    expect(result.readinessScore).toBe(0);
    expect(result.totalWeightedScore).toBe(0);
    expect(result.strengths).toHaveLength(0);
    expect(result.skillGaps).toHaveLength(0);
  });

  it("calculates 100% readiness when all required skills exceed target proficiency", () => {
    const requirements = [
      { skillId: "s1", skillName: "React", minProficiency: 70, weight: 2.0 },
      { skillId: "s2", skillName: "TypeScript", minProficiency: 60, weight: 1.0 },
    ];
    const learnerSkills = [
      { skillId: "s1", skillName: "React", selfReportedLevel: 80, assessedLevel: null, effectiveProficiency: 80, verified: false },
      { skillId: "s2", skillName: "TypeScript", selfReportedLevel: 75, assessedLevel: null, effectiveProficiency: 75, verified: false },
    ];

    const result = calculateCareerReadiness("c-1", "Frontend Dev", requirements, learnerSkills);
    expect(result.readinessScore).toBe(100);
    expect(result.strengths).toHaveLength(2);
    expect(result.missingSkills).toHaveLength(0);
    expect(result.explanation).toContain("Outstanding alignment");
  });

  it("handles missing skills and computes weighted partial score correctly", () => {
    const requirements = [
      { skillId: "s1", skillName: "Python", minProficiency: 80, weight: 2.0 }, // learner has 40 (50% fulfillment = 1.0)
      { skillId: "s2", skillName: "Docker", minProficiency: 50, weight: 2.0 }, // learner has 0 (0% fulfillment = 0.0)
    ];
    // Total weight = 4.0, Total weighted score = 1.0 -> 25% readiness
    const learnerSkills = [
      { skillId: "s1", skillName: "Python", selfReportedLevel: 40, assessedLevel: null, effectiveProficiency: 40, verified: false },
    ];

    const result = calculateCareerReadiness("c-2", "Backend Dev", requirements, learnerSkills);
    expect(result.readinessScore).toBe(25);
    expect(result.missingSkills).toHaveLength(1);
    expect(result.missingSkills[0].skillName).toBe("Docker");
    expect(result.priorityAreas).toContain("Docker");
    expect(result.explanation).toContain("Early career stage");
  });

  it("prioritizes assessed skill proficiency over self-reported levels", () => {
    const requirements = [
      { skillId: "s1", skillName: "SQL", minProficiency: 70, weight: 1.0 },
    ];
    const learnerSkills = [
      { skillId: "s1", skillName: "SQL", selfReportedLevel: 95, assessedLevel: 50, effectiveProficiency: 50, verified: true },
    ];

    const result = calculateCareerReadiness("c-3", "Data Analyst", requirements, learnerSkills);
    // 50 / 70 = 71.4% -> ~71%
    expect(result.readinessScore).toBe(71);
    expect(result.strengths).toHaveLength(0);
    expect(result.skillGaps).toHaveLength(1);
    expect(result.skillGaps[0].gap).toBe(20);
  });
});
