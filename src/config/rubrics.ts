/**
 * Evaluation Rubrics Configuration & Rating Tiers
 * 
 * Criteria evaluated out of 10 marks using 5 qualitative options.
 * Each rating option has a fixed point weight (out of 10).
 */

export interface RubricTier {
  weight: number; // 2, 4, 6, 8, 10
  label: string;  // e.g. "Exemplary — Breakthrough Novelty"
  description: string;
}

export interface RubricDefinition {
  id: "scoreInnovation" | "scoreUnderstanding" | "scoreProgress";
  title: string;
  criterionName: string;
  maxScore: number;
  description: string;
  tiers: RubricTier[];
}

export const RUBRICS: RubricDefinition[] = [
  {
    id: "scoreInnovation",
    title: "Rubric 1: Innovation & Novelty",
    criterionName: "Innovation",
    maxScore: 10,
    description: "Evaluates uniqueness of technical approach, creative novelty, and distinction from existing market tools.",
    tiers: [
      {
        weight: 10,
        label: "Exemplary — Breakthrough Innovation [10 Marks]",
        description: "Visionary approach with high originality, novel architecture, and distinct competitive edge."
      },
      {
        weight: 8,
        label: "Commendable — Creative & Distinct [8 Marks]",
        description: "Strong original elements with thoughtful, non-trivial engineering solutions."
      },
      {
        weight: 6,
        label: "Proficient — Solid Concept [6 Marks]",
        description: "Meets standard innovation bar with practical domain-specific enhancements."
      },
      {
        weight: 4,
        label: "Developing — Incremental Variation [4 Marks]",
        description: "Standard conventional approach with limited novelty beyond basic templates."
      },
      {
        weight: 2,
        label: "Novice — Minimal Originality [2 Marks]",
        description: "Direct duplication of existing tutorials or trivial concept without innovation."
      }
    ]
  },
  {
    id: "scoreUnderstanding",
    title: "Rubric 2: Problem Understanding & Technical Feasibility",
    criterionName: "Problem Understanding",
    maxScore: 10,
    description: "Evaluates depth of domain comprehension, constraint handling, edge-case mitigation, and engineering feasibility.",
    tiers: [
      {
        weight: 10,
        label: "Exemplary — Masterful Insight & Architecture [10 Marks]",
        description: "Flawless grasp of hostel edge cases, production-grade system design, and realistic feasibility."
      },
      {
        weight: 8,
        label: "Commendable — Robust Architecture & Deep Understanding [8 Marks]",
        description: "Thorough analysis of root problems with well-structured, feasible technical architecture."
      },
      {
        weight: 6,
        label: "Proficient — Competent Problem Grasp [6 Marks]",
        description: "Accurate problem identification and workable technical approach with minor gaps."
      },
      {
        weight: 4,
        label: "Developing — Surface Comprehension [4 Marks]",
        description: "Superficial understanding of hostel pain points with questionable technical feasibility."
      },
      {
        weight: 2,
        label: "Novice — Misaligned Problem Scope [2 Marks]",
        description: "Fails to grasp core problem constraints and proposes impractical or disjointed design."
      }
    ]
  },
  {
    id: "scoreProgress",
    title: "Rubric 3: Technical Execution & Prototype Progress",
    criterionName: "Progress & Execution",
    maxScore: 10,
    description: "Evaluates working prototype functionality, code quality, repo commits, and demonstrable milestone progress.",
    tiers: [
      {
        weight: 10,
        label: "Exemplary — Battle-Tested Working Prototype [10 Marks]",
        description: "Complete, deployable prototype with exceptional code quality, clean repo, and live demo."
      },
      {
        weight: 8,
        label: "Commendable — Advanced Functional Implementation [8 Marks]",
        description: "Substantial working features, active git repository, and impressive interactive demo."
      },
      {
        weight: 6,
        label: "Proficient — Functional Core MVP [6 Marks]",
        description: "Demonstrable core user journeys with standard code implementation and baseline progress."
      },
      {
        weight: 4,
        label: "Developing — Incomplete Prototype [4 Marks]",
        description: "Only partial execution with broken workflows, major bugs, or shallow UI mockups."
      },
      {
        weight: 2,
        label: "Novice — Rudimentary or Non-Functional [2 Marks]",
        description: "Barely functional skeleton or empty code repository with no tangible milestone progress."
      }
    ]
  }
];

export interface ReviewRoundInfo {
  round: number;
  key: string;
  title: string;
  subtitle: string;
  badgeColor: string;
}

export const REVIEW_ROUNDS: ReviewRoundInfo[] = [
  {
    round: 1,
    key: "REVIEW_1",
    title: "Review 1",
    subtitle: "Internal Review 1",
    badgeColor: "violet"
  },
  {
    round: 2,
    key: "REVIEW_2",
    title: "Review 2",
    subtitle: "Internal Review 2",
    badgeColor: "indigo"
  },
  {
    round: 3,
    key: "REVIEW_3",
    title: "Review 3",
    subtitle: "External Review",
    badgeColor: "amber"
  }
];

export function getRoundInfo(roundNum: number): ReviewRoundInfo {
  return REVIEW_ROUNDS.find((r) => r.round === roundNum) || REVIEW_ROUNDS[0];
}
