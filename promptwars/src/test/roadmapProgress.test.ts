import { describe, it, expect } from "vitest";

export interface Activity {
  id: string;
  status: "pending" | "in_progress" | "completed";
  estimated_hours: number;
}

export interface Phase {
  id: string;
  activities: Activity[];
}

export function calculateRoadmapProgress(phases: Phase[]) {
  let totalActivities = 0;
  let completedActivities = 0;
  let totalHours = 0;
  let completedHours = 0;

  phases.forEach((p) => {
    p.activities.forEach((act) => {
      totalActivities += 1;
      totalHours += act.estimated_hours || 0;
      if (act.status === "completed") {
        completedActivities += 1;
        completedHours += act.estimated_hours || 0;
      }
    });
  });

  const activityProgressPct = totalActivities > 0 
    ? Math.round((completedActivities / totalActivities) * 100) 
    : 0;

  const hoursProgressPct = totalHours > 0 
    ? Math.round((completedHours / totalHours) * 100) 
    : 0;

  return {
    totalActivities,
    completedActivities,
    pendingActivities: totalActivities - completedActivities,
    totalHours,
    completedHours,
    activityProgressPct,
    hoursProgressPct,
    isComplete: totalActivities > 0 && totalActivities === completedActivities,
  };
}

describe("Roadmap Progress Calculation (calculateRoadmapProgress)", () => {
  it("calculates 0% progress when no activities completed", () => {
    const phases: Phase[] = [
      {
        id: "p1",
        activities: [
          { id: "a1", status: "pending", estimated_hours: 4 },
          { id: "a2", status: "in_progress", estimated_hours: 6 },
        ],
      },
    ];

    const result = calculateRoadmapProgress(phases);
    expect(result.totalActivities).toBe(2);
    expect(result.completedActivities).toBe(0);
    expect(result.activityProgressPct).toBe(0);
    expect(result.isComplete).toBe(false);
  });

  it("calculates accurate completed percentages across multiple phases", () => {
    const phases: Phase[] = [
      {
        id: "p1",
        activities: [
          { id: "a1", status: "completed", estimated_hours: 5 },
          { id: "a2", status: "completed", estimated_hours: 5 },
        ],
      },
      {
        id: "p2",
        activities: [
          { id: "a3", status: "pending", estimated_hours: 10 },
          { id: "a4", status: "pending", estimated_hours: 10 },
        ],
      },
    ];

    const result = calculateRoadmapProgress(phases);
    expect(result.totalActivities).toBe(4);
    expect(result.completedActivities).toBe(2);
    expect(result.pendingActivities).toBe(2);
    expect(result.activityProgressPct).toBe(50);
    expect(result.totalHours).toBe(30);
    expect(result.completedHours).toBe(10);
    expect(result.hoursProgressPct).toBe(33); // 10/30 = 33%
    expect(result.isComplete).toBe(false);
  });

  it("detects 100% roadmap completion", () => {
    const phases: Phase[] = [
      {
        id: "p1",
        activities: [{ id: "a1", status: "completed", estimated_hours: 8 }],
      },
    ];

    const result = calculateRoadmapProgress(phases);
    expect(result.activityProgressPct).toBe(100);
    expect(result.isComplete).toBe(true);
  });
});
