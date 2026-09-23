import type { ProjectScoring, ScoringCriterion } from "../types/project";

export function getWeightedScore(scoring: ProjectScoring, criteria: ScoringCriterion[]) {
  const ratings = new Map(scoring.entries.map((entry) => [entry.criterionId, entry.rating]));
  return criteria.reduce((total, criterion) => {
    const rating = ratings.get(criterion.id);
    return total + (rating ? (rating / 5) * criterion.weight : 0);
  }, 0);
}

export function getScoringCompletion(scoring: ProjectScoring, criteria: ScoringCriterion[]) {
  if (!criteria.length) return 0;
  const ratedIds = new Set(scoring.entries.filter((entry) => entry.rating !== null).map((entry) => entry.criterionId));
  return Math.round((criteria.filter((criterion) => ratedIds.has(criterion.id)).length / criteria.length) * 100);
}

export function weightsTotal(criteria: ScoringCriterion[]) {
  return criteria.reduce((total, criterion) => total + criterion.weight, 0);
}
