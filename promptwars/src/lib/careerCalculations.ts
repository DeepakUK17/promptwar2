export interface CareerSkillRequirement {
  skillId: string;
  skillName: string;
  minProficiency: number;
  weight: number;
  category?: string;
}

export interface LearnerSkillItem {
  skillId: string;
  skillName: string;
  selfReportedLevel: number;
  assessedLevel: number | null;
  effectiveProficiency: number; // assessed level if present, else self-reported
  verified: boolean;
}

export interface CareerReadinessAnalysis {
  careerId: string;
  careerTitle: string;
  readinessScore: number; // 0 to 100
  totalWeightedScore: number;
  maxPossibleWeightedScore: number;
  strengths: {
    skillName: string;
    learnerLevel: number;
    requiredLevel: number;
    surplus: number;
  }[];
  skillGaps: {
    skillId: string;
    skillName: string;
    learnerLevel: number;
    requiredLevel: number;
    gap: number;
    weight: number;
    importance: 'High' | 'Medium' | 'Low';
  }[];
  missingSkills: {
    skillId: string;
    skillName: string;
    requiredLevel: number;
    weight: number;
  }[];
  priorityAreas: string[];
  explanation: string;
}

export function calculateCareerReadiness(
  careerId: string,
  careerTitle: string,
  requirements: CareerSkillRequirement[],
  learnerSkills: LearnerSkillItem[]
): CareerReadinessAnalysis {
  if (!requirements || requirements.length === 0) {
    return {
      careerId,
      careerTitle,
      readinessScore: 0,
      totalWeightedScore: 0,
      maxPossibleWeightedScore: 0,
      strengths: [],
      skillGaps: [],
      missingSkills: [],
      priorityAreas: [],
      explanation: `No skill requirements configured for ${careerTitle}.`
    };
  }

  // Create a quick lookup map by skill name (case-insensitive) and skill id
  const learnerSkillMap = new Map<string, LearnerSkillItem>();
  learnerSkills.forEach((s) => {
    learnerSkillMap.set(s.skillId, s);
    learnerSkillMap.set(s.skillName.toLowerCase(), s);
  });

  let totalWeightedScore = 0;
  let totalWeights = 0;

  const strengths: CareerReadinessAnalysis['strengths'] = [];
  const skillGaps: CareerReadinessAnalysis['skillGaps'] = [];
  const missingSkills: CareerReadinessAnalysis['missingSkills'] = [];

  requirements.forEach((req) => {
    const learnerSkill = learnerSkillMap.get(req.skillId) || learnerSkillMap.get(req.skillName.toLowerCase());
    const learnerLevel = learnerSkill ? learnerSkill.effectiveProficiency : 0;
    const requiredLevel = req.minProficiency || 60;
    const weight = req.weight || 1.0;

    totalWeights += weight;

    // Fractional fulfillment up to 100% of requirement
    const fulfillmentRatio = Math.min(learnerLevel, requiredLevel) / requiredLevel;
    totalWeightedScore += fulfillmentRatio * weight;

    if (learnerLevel >= requiredLevel) {
      strengths.push({
        skillName: req.skillName,
        learnerLevel,
        requiredLevel,
        surplus: learnerLevel - requiredLevel
      });
    } else if (learnerLevel === 0) {
      missingSkills.push({
        skillId: req.skillId,
        skillName: req.skillName,
        requiredLevel,
        weight
      });
      skillGaps.push({
        skillId: req.skillId,
        skillName: req.skillName,
        learnerLevel: 0,
        requiredLevel,
        gap: requiredLevel,
        weight,
        importance: weight >= 1.4 ? 'High' : weight >= 1.1 ? 'Medium' : 'Low'
      });
    } else {
      skillGaps.push({
        skillId: req.skillId,
        skillName: req.skillName,
        learnerLevel,
        requiredLevel,
        gap: requiredLevel - learnerLevel,
        weight,
        importance: weight >= 1.4 ? 'High' : weight >= 1.1 ? 'Medium' : 'Low'
      });
    }
  });

  const readinessScore = totalWeights > 0 
    ? Math.round((totalWeightedScore / totalWeights) * 100) 
    : 0;

  // Order gaps by weight * gap descending
  skillGaps.sort((a, b) => (b.weight * b.gap) - (a.weight * a.gap));

  const priorityAreas = skillGaps.slice(0, 4).map((g) => g.skillName);

  let explanation = '';
  if (readinessScore >= 80) {
    explanation = `Outstanding alignment! You currently meet ${readinessScore}% of the verified requirements for ${careerTitle}. Focus on polishing ${priorityAreas.join(', ')} to achieve full job readiness.`;
  } else if (readinessScore >= 50) {
    explanation = `Solid foundation! You meet ${readinessScore}% of the requirements for ${careerTitle}. Your existing capabilities in ${strengths.map(s => s.skillName).join(', ') || 'foundational areas'} give you an edge, but bridging gaps in ${priorityAreas.join(', ')} is required for market competitiveness.`;
  } else {
    explanation = `Early career stage for ${careerTitle} with a current readiness index of ${readinessScore}%. High-priority learning should begin immediately with ${priorityAreas.join(', ')} to construct a viable engineering portfolio.`;
  }

  return {
    careerId,
    careerTitle,
    readinessScore,
    totalWeightedScore: Math.round(totalWeightedScore * 10) / 10,
    maxPossibleWeightedScore: Math.round(totalWeights * 10) / 10,
    strengths,
    skillGaps,
    missingSkills,
    priorityAreas,
    explanation
  };
}
