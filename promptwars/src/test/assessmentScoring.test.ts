import { describe, it, expect } from "vitest";

interface QuestionOption {
  id: string;
  text: string;
  is_correct: boolean;
}

interface Question {
  id: string;
  marks: number;
  topic: string | null;
  options: QuestionOption[];
}

export function scoreAssessment(
  questions: Question[],
  answers: Record<string, string> // questionId -> selectedOptionId
) {
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
      if (q.topic) {
        weakTopicsSet.add(q.topic);
      }
    }
  });

  const percentage = totalMarks > 0 ? Math.round((earnedScore / totalMarks) * 100) : 0;
  const passed = percentage >= 60;

  return {
    earnedScore,
    totalMarks,
    percentage,
    passed,
    weakTopics: Array.from(weakTopicsSet),
  };
}

describe("Assessment Scoring Logic (scoreAssessment)", () => {
  const sampleQuestions: Question[] = [
    {
      id: "q1",
      marks: 1,
      topic: "Closures",
      options: [
        { id: "opt1", text: "A function bundled with lexical scope", is_correct: true },
        { id: "opt2", text: "A loop control structure", is_correct: false },
      ],
    },
    {
      id: "q2",
      marks: 2,
      topic: "Promises",
      options: [
        { id: "opt3", text: "Synchronous callback", is_correct: false },
        { id: "opt4", text: "Object representing eventual completion", is_correct: true },
      ],
    },
  ];

  it("calculates 100% when all questions are answered correctly", () => {
    const answers = { q1: "opt1", q2: "opt4" };
    const result = scoreAssessment(sampleQuestions, answers);

    expect(result.earnedScore).toBe(3);
    expect(result.totalMarks).toBe(3);
    expect(result.percentage).toBe(100);
    expect(result.passed).toBe(true);
    expect(result.weakTopics).toHaveLength(0);
  });

  it("calculates partial score and records weak topics on mistakes", () => {
    const answers = { q1: "opt2", q2: "opt4" }; // missed q1 (Closures)
    const result = scoreAssessment(sampleQuestions, answers);

    expect(result.earnedScore).toBe(2);
    expect(result.totalMarks).toBe(3);
    expect(result.percentage).toBe(67);
    expect(result.passed).toBe(true);
    expect(result.weakTopics).toContain("Closures");
    expect(result.weakTopics).not.toContain("Promises");
  });

  it("identifies failing attempt and isolates multiple weak topics", () => {
    const answers = { q1: "opt2", q2: "opt3" }; // missed both
    const result = scoreAssessment(sampleQuestions, answers);

    expect(result.earnedScore).toBe(0);
    expect(result.percentage).toBe(0);
    expect(result.passed).toBe(false);
    expect(result.weakTopics).toEqual(["Closures", "Promises"]);
  });

  it("handles empty answers gracefully", () => {
    const result = scoreAssessment(sampleQuestions, {});
    expect(result.percentage).toBe(0);
    expect(result.passed).toBe(false);
    expect(result.weakTopics).toHaveLength(2);
  });
});
