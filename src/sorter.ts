import type { CopyCandidate, SortConfig } from './types';

const DEFAULT_SORT_CONFIG: SortConfig = {
  criteria: ['score', 'diversity', 'length'],
  weights: [0.6, 0.25, 0.15],
  ascending: false,
};

function calculateDiversityScore(candidates: CopyCandidate[], index: number): number {
  const candidate = candidates[index];
  let totalSimilarity = 0;
  let count = 0;

  for (let i = 0; i < candidates.length; i++) {
    if (i === index) continue;
    const other = candidates[i];
    const similarity = calculateSimilarity(candidate.content, other.content);
    totalSimilarity += similarity;
    count++;
  }

  return count > 0 ? 1 - totalSimilarity / count : 1;
}

function calculateSimilarity(text1: string, text2: string): number {
  if (text1 === text2) return 1;
  if (!text1 || !text2) return 0;

  const set1 = new Set(text1.split(''));
  const set2 = new Set(text2.split(''));

  let intersection = 0;
  for (const char of set1) {
    if (set2.has(char)) intersection++;
  }

  const union = set1.size + set2.size - intersection;
  return union > 0 ? intersection / union : 0;
}

function getLengthScore(text: string, idealLength?: number): number {
  const length = text.length;
  if (!idealLength) {
    return Math.min(length / 100, 1);
  }
  const diff = Math.abs(length - idealLength);
  return Math.max(0, 1 - diff / idealLength);
}

export function sortCandidates(
  candidates: CopyCandidate[],
  config?: Partial<SortConfig>,
  idealLength?: number
): CopyCandidate[] {
  const sortConfig: SortConfig = {
    ...DEFAULT_SORT_CONFIG,
    ...config,
  };

  const { criteria, weights, ascending } = sortConfig;

  const scoredCandidates = candidates.map((candidate, index) => {
    let finalScore = 0;
    let totalWeight = 0;

    for (let i = 0; i < criteria.length; i++) {
      const criterion = criteria[i];
      const weight = weights[i] || 0;
      totalWeight += weight;

      let score = 0;
      switch (criterion) {
        case 'score':
          score = candidate.score;
          break;
        case 'diversity':
          score = calculateDiversityScore(candidates, index);
          break;
        case 'length':
          score = getLengthScore(candidate.content, idealLength);
          break;
        case 'freshness':
          score = 1;
          break;
        default:
          score = 0;
      }

      finalScore += score * weight;
    }

    if (totalWeight > 0) {
      finalScore = finalScore / totalWeight;
    }

    return {
      candidate,
      finalScore,
    };
  });

  scoredCandidates.sort((a, b) => {
    return ascending ? a.finalScore - b.finalScore : b.finalScore - a.finalScore;
  });

  return scoredCandidates.map((item) => item.candidate);
}

export function deduplicateCandidates(candidates: CopyCandidate[], threshold: number = 0.8): CopyCandidate[] {
  const result: CopyCandidate[] = [];

  for (const candidate of candidates) {
    let isDuplicate = false;

    for (const existing of result) {
      const similarity = calculateSimilarity(candidate.content, existing.content);
      if (similarity >= threshold) {
        isDuplicate = true;
        break;
      }
    }

    if (!isDuplicate) {
      result.push(candidate);
    }
  }

  return result;
}
