import type {
  QualityReport,
  LengthCheckResult,
  KeywordCheckResult,
  CoreInfoCheckResult,
  LengthLimit,
  ProductInfo,
  CopyCandidate,
  TruncateResult,
  BatchQualityReport,
  SimilarityGroup,
  RankedCandidate,
} from './types';

export function checkLength(text: string, limit?: LengthLimit): LengthCheckResult {
  const unit = limit?.unit || 'char';
  let currentLength = 0;

  if (unit === 'char') {
    currentLength = Array.from(text).length;
  } else {
    const cnMatches = text.match(/[\u4e00-\u9fa5]/g) || [];
    const enWords = text.replace(/[\u4e00-\u9fa5]/g, ' ').split(/\s+/).filter((w) => w.length > 0);
    currentLength = cnMatches.length + enWords.length;
  }

  const tooShort = limit?.min !== undefined && currentLength < limit.min;
  const tooLong = limit?.max !== undefined && currentLength > limit.max;

  return {
    valid: !tooShort && !tooLong,
    currentLength,
    minLength: limit?.min,
    maxLength: limit?.max,
    unit,
    tooShort,
    tooLong,
  };
}

export function truncateTextDetailed(text: string, limit?: LengthLimit): TruncateResult {
  const unit = (limit?.unit || 'char') as 'char' | 'word';

  if (!limit || limit.max === undefined) {
    const originalLength = unit === 'char' ? Array.from(text).length : getWordCount(text);
    return {
      text,
      wasTruncated: false,
      originalLength,
      finalLength: originalLength,
      unit,
    };
  }

  const originalLength = unit === 'char' ? Array.from(text).length : getWordCount(text);

  if (originalLength <= limit.max) {
    return {
      text,
      wasTruncated: false,
      originalLength,
      finalLength: originalLength,
      unit,
    };
  }

  if (unit === 'char') {
    const chars = Array.from(text);
    const max = limit.max;

    if (max <= 0) {
      return {
        text: '',
        wasTruncated: true,
        originalLength,
        finalLength: 0,
        unit: 'char',
        truncatePoint: 0,
      };
    }

    if (max === 1) {
      const c = chars[0] || '';
      return {
        text: c,
        wasTruncated: true,
        originalLength,
        finalLength: 1,
        unit: 'char',
        truncatePoint: 1,
      };
    }

    if (max === 2) {
      const c = chars.slice(0, 2).join('');
      return {
        text: c,
        wasTruncated: true,
        originalLength,
        finalLength: 2,
        unit: 'char',
        truncatePoint: 2,
      };
    }

    if (max === 3) {
      const c = chars.slice(0, 3).join('');
      return {
        text: c,
        wasTruncated: true,
        originalLength,
        finalLength: 3,
        unit: 'char',
        truncatePoint: 3,
      };
    }

    const suffix = '...';
    const suffixLen = Array.from(suffix).length;
    const maxContentLen = Math.max(1, max - suffixLen);

    let contentChars = chars.slice(0, maxContentLen);
    const contentStr = contentChars.join('');

    const strongPuncts = ['。', '！', '？', '\n', '；', '.', '!', '?'];
    let bestCut = -1;

    for (const punct of strongPuncts) {
      const idx = contentStr.lastIndexOf(punct);
      if (idx > bestCut && idx >= maxContentLen * 0.55) {
        bestCut = idx;
      }
    }

    if (bestCut > 0) {
      const beforeCut = Array.from(contentStr.substring(0, bestCut + 1));
      return {
        text: beforeCut.join('') + suffix,
        wasTruncated: true,
        originalLength,
        finalLength: beforeCut.length + suffixLen,
        unit: 'char',
        truncatePoint: bestCut + 1,
      };
    }

    const weakPuncts = ['，', '、', ' ', '：', ',', ':', '／', '/'];
    for (const punct of weakPuncts) {
      const idx = contentStr.lastIndexOf(punct);
      if (idx > bestCut && idx >= maxContentLen * 0.8) {
        bestCut = idx;
      }
    }

    if (bestCut > 0) {
      const beforeCut = Array.from(contentStr.substring(0, bestCut + 1));
      return {
        text: beforeCut.join('') + suffix,
        wasTruncated: true,
        originalLength,
        finalLength: beforeCut.length + suffixLen,
        unit: 'char',
        truncatePoint: bestCut + 1,
      };
    }

    return {
      text: contentStr + suffix,
      wasTruncated: true,
      originalLength,
      finalLength: maxContentLen + suffixLen,
      unit: 'char',
      truncatePoint: maxContentLen,
    };
  } else {
    const tokens = tokenizeWords(text);
    if (tokens.length <= limit.max) {
      return {
        text,
        wasTruncated: false,
        originalLength,
        finalLength: tokens.length,
        unit: 'word',
      };
    }

    if (limit.max <= 0) {
      return {
        text: '',
        wasTruncated: true,
        originalLength,
        finalLength: 0,
        unit: 'word',
        truncatePoint: 0,
      };
    }

    const resultTokens = tokens.slice(0, limit.max);
    const suffix = limit.max === 1 ? '…' : ' ...';
    const finalStr = detokenizeWords(resultTokens) + suffix;
    const finalCount = limit.max;

    return {
      text: finalStr,
      wasTruncated: true,
      originalLength,
      finalLength: finalCount,
      unit: 'word',
      truncatePoint: limit.max,
    };
  }
}

function tokenizeWords(text: string): Array<{ type: 'cn' | 'en' | 'punct'; value: string }> {
  const tokens: Array<{ type: 'cn' | 'en' | 'punct'; value: string }> = [];
  let i = 0;
  const chars = Array.from(text);
  while (i < chars.length) {
    const c = chars[i];
    if (/[\u4e00-\u9fa5]/.test(c)) {
      tokens.push({ type: 'cn', value: c });
      i++;
    } else if (/[a-zA-Z0-9]/.test(c)) {
      let j = i;
      while (j < chars.length && /[a-zA-Z0-9]/.test(chars[j])) j++;
      tokens.push({ type: 'en', value: chars.slice(i, j).join('') });
      i = j;
    } else {
      let j = i;
      while (j < chars.length && !/[\u4e00-\u9fa5a-zA-Z0-9]/.test(chars[j])) j++;
      tokens.push({ type: 'punct', value: chars.slice(i, j).join('') });
      i = j;
    }
  }
  return tokens;
}

function detokenizeWords(tokens: Array<{ type: string; value: string }>): string {
  return tokens.map(t => t.value).join('');
}

function getWordCount(text: string): number {
  return tokenizeWords(text).filter(t => t.type !== 'punct').length;
}

export function truncateText(text: string, limit?: LengthLimit): string {
  return truncateTextDetailed(text, limit).text;
}

export function isTruncated(text: string, limit?: LengthLimit): boolean {
  return truncateTextDetailed(text, limit).wasTruncated;
}

export function checkKeywords(text: string, keywords: string[]): KeywordCheckResult {
  if (!keywords || keywords.length === 0) {
    return {
      allIncluded: true,
      includedKeywords: [],
      missingKeywords: [],
      inclusionRate: 1,
    };
  }

  const included: string[] = [];
  const missing: string[] = [];
  const lowerText = text.toLowerCase();

  for (const keyword of keywords) {
    if (lowerText.includes(keyword.toLowerCase())) {
      included.push(keyword);
    } else {
      missing.push(keyword);
    }
  }

  return {
    allIncluded: missing.length === 0,
    includedKeywords: included,
    missingKeywords: missing,
    inclusionRate: keywords.length > 0 ? included.length / keywords.length : 1,
  };
}

export function checkCoreInfo(text: string, productInfo?: ProductInfo): CoreInfoCheckResult {
  const missing: string[] = [];

  const hasProductName = productInfo?.name ? text.includes(productInfo.name) : true;
  if (!hasProductName && productInfo?.name) missing.push('商品名称');

  const hasBrand = productInfo?.brand ? text.includes(productInfo.brand) : true;
  if (!hasBrand && productInfo?.brand) missing.push('品牌名称');

  const hasPrice = productInfo?.price !== undefined ? text.includes(String(productInfo.price)) : true;
  if (!hasPrice && productInfo?.price !== undefined) missing.push('价格信息');

  const features = productInfo?.features || [];
  let hasFeatures = features.length === 0;
  if (features.length > 0) {
    const cnt = features.filter(f => text.includes(f)).length;
    hasFeatures = cnt >= Math.ceil(features.length * 0.3);
    if (!hasFeatures) missing.push('产品特点');
  }

  const conditions = [
    !!productInfo?.name,
    !!productInfo?.brand,
    productInfo?.price !== undefined,
    features.length > 0,
  ];
  const totalChecks = conditions.filter(Boolean).length;

  const checks = [hasProductName, hasBrand, hasPrice, hasFeatures];
  const completedChecks = checks.filter((v, i) => conditions[i] && v).length;

  return {
    hasProductName,
    hasBrand,
    hasPrice,
    hasFeatures,
    missingInfo: missing,
    completeness: totalChecks > 0 ? completedChecks / totalChecks : 1,
  };
}

export function calculateSimilarity(text1: string, text2: string): number {
  if (text1 === text2) return 1;
  if (!text1 || !text2) return 0;

  const tokens1 = tokenizeWords(text1).filter(t => t.type !== 'punct').map(t => t.value);
  const tokens2 = tokenizeWords(text2).filter(t => t.type !== 'punct').map(t => t.value);

  const set1 = new Set(tokens1);
  const set2 = new Set(tokens2);

  let intersection = 0;
  for (const t of set1) if (set2.has(t)) intersection++;

  const union = set1.size + set2.size - intersection;
  return union > 0 ? intersection / union : 0;
}

export function checkDuplicate(
  candidate: CopyCandidate,
  allCandidates: CopyCandidate[],
  threshold: number = 0.85
): { isDuplicate: boolean; duplicateWith?: string } {
  for (const other of allCandidates) {
    if (other.id === candidate.id) continue;
    const similarity = calculateSimilarity(candidate.content, other.content);
    if (similarity >= threshold) {
      return { isDuplicate: true, duplicateWith: other.id };
    }
  }
  return { isDuplicate: false };
}

export function generateQualityReport(
  candidate: CopyCandidate,
  options: {
    lengthLimit?: LengthLimit;
    keywords?: string[];
    productInfo?: ProductInfo;
    allCandidates?: CopyCandidate[];
    duplicateThreshold?: number;
  } = {}
): QualityReport {
  const lengthCheck = checkLength(candidate.content, options.lengthLimit);
  const keywordCheck = checkKeywords(candidate.content, options.keywords || []);
  const coreInfoCheck = checkCoreInfo(candidate.content, options.productInfo);

  let isDuplicate = false;
  let duplicateWith: string | undefined;

  if (options.allCandidates && options.allCandidates.length > 1) {
    const dup = checkDuplicate(candidate, options.allCandidates, options.duplicateThreshold);
    isDuplicate = dup.isDuplicate;
    duplicateWith = dup.duplicateWith;
  }

  const suggestions: string[] = [];

  if (lengthCheck.tooShort)
    suggestions.push(`内容偏短（${lengthCheck.currentLength}${lengthCheck.unit === 'char' ? '字' : '词'}），建议≥${lengthCheck.minLength}`);
  if (lengthCheck.tooLong)
    suggestions.push(`内容偏长（${lengthCheck.currentLength}${lengthCheck.unit === 'char' ? '字' : '词'}），建议≤${lengthCheck.maxLength}`);
  if (!keywordCheck.allIncluded && keywordCheck.missingKeywords.length > 0)
    suggestions.push(`缺少关键词：${keywordCheck.missingKeywords.join('、')}`);
  if (coreInfoCheck.missingInfo.length > 0)
    suggestions.push(`缺少核心信息：${coreInfoCheck.missingInfo.join('、')}`);
  if (isDuplicate)
    suggestions.push('与其他候选内容高度相似');
  if (candidate.hasSensitive)
    suggestions.push('包含敏感词，请检查');

  const overallScore = Math.round(
    (lengthCheck.valid ? 25 : Math.max(5, 25 - Math.abs(lengthCheck.currentLength - (lengthCheck.maxLength || lengthCheck.currentLength)) * 0.3)) +
    keywordCheck.inclusionRate * 25 +
    coreInfoCheck.completeness * 25 +
    (isDuplicate ? 5 : 25) +
    (candidate.hasSensitive ? 0 : Math.min(25, candidate.score * 25))
  ) / 100;

  return {
    length: lengthCheck,
    keywords: keywordCheck,
    coreInfo: coreInfoCheck,
    isDuplicate,
    duplicateWith,
    overallScore,
    suggestions,
  };
}

export function findSimilarGroups(
  candidates: CopyCandidate[],
  threshold: number = 0.6
): SimilarityGroup[] {
  const groups: SimilarityGroup[] = [];
  const used = new Set<string>();

  for (let i = 0; i < candidates.length; i++) {
    const c1 = candidates[i];
    if (used.has(c1.id)) continue;

    const group = [c1.id];
    let totalSim = 0;
    let simCount = 0;

    for (let j = i + 1; j < candidates.length; j++) {
      const c2 = candidates[j];
      if (used.has(c2.id)) continue;
      const sim = calculateSimilarity(c1.content, c2.content);
      if (sim >= threshold) {
        group.push(c2.id);
        totalSim += sim;
        simCount++;
      }
    }

    if (group.length >= 2) {
      group.forEach(id => used.add(id));
      groups.push({
        groupId: `group_${groups.length + 1}`,
        candidateIds: group,
        averageSimilarity: simCount > 0 ? Math.round((totalSim / simCount) * 100) / 100 : 1,
        representativeId: group[0],
      });
    }
  }

  return groups;
}

export function generateBatchQualityReport(
  candidates: CopyCandidate[],
  options: {
    lengthLimit?: LengthLimit;
    keywords?: string[];
    productInfo?: ProductInfo;
    duplicateThreshold?: number;
    sortConfig?: { criteria: string[]; weights: number[] };
  } = {}
): BatchQualityReport {
  const threshold = options.duplicateThreshold || 0.85;

  candidates.forEach((c) => {
    if (!c.qualityReport) {
      c.qualityReport = generateQualityReport(c, {
        ...options,
        allCandidates: candidates,
      });
    }
  });

  const similarGroups = findSimilarGroups(candidates, 0.55);

  const keywordRanking = [...candidates]
    .map((c) => ({
      id: c.id,
      inclusionRate: c.qualityReport!.keywords.inclusionRate,
      includedCount: c.qualityReport!.keywords.includedKeywords.length,
    }))
    .sort((a, b) => b.inclusionRate - a.inclusionRate || b.includedCount - a.includedCount);

  const lengthRanking = [...candidates]
    .map((c) => ({
      id: c.id,
      length: c.qualityReport!.length.currentLength,
      valid: c.qualityReport!.length.valid,
    }))
    .sort((a, b) => (b.valid ? 1 : 0) - (a.valid ? 1 : 0) || Math.abs(a.length - (options.lengthLimit?.max || a.length)) - Math.abs(b.length - (options.lengthLimit?.max || b.length)));

  const qualityRanking = [...candidates]
    .map((c) => ({ id: c.id, overallScore: c.qualityReport!.overallScore }))
    .sort((a, b) => b.overallScore - a.overallScore);

  const criteria = options.sortConfig?.criteria || ['score', 'keywords', 'length'];
  const weights = options.sortConfig?.weights || [0.4, 0.3, 0.3];

  const scoreMap = (c: CopyCandidate) => {
    let finalScore = 0;
    let totalW = 0;
    const reasons: string[] = [];
    const qr = c.qualityReport!;

    criteria.forEach((crit, idx) => {
      const w = weights[idx] || 0;
      totalW += w;
      let s = 0;
      switch (crit) {
        case 'score':
        case 'quality':
          s = qr.overallScore;
          if (s >= 0.8) reasons.push('综合质量高');
          break;
        case 'keywords':
          s = qr.keywords.inclusionRate;
          if (qr.keywords.allIncluded) reasons.push('关键词全部覆盖');
          else if (qr.keywords.inclusionRate >= 0.5) reasons.push(`覆盖${Math.round(qr.keywords.inclusionRate * 100)}%关键词`);
          break;
        case 'length':
          s = qr.length.valid ? 1 : Math.max(0, 1 - Math.abs(qr.length.currentLength - (options.lengthLimit?.max || qr.length.currentLength)) / (options.lengthLimit?.max || 100));
          if (qr.length.valid) reasons.push('长度合规');
          break;
        case 'diversity':
          s = qr.isDuplicate ? 0.2 : 1;
          if (!qr.isDuplicate) reasons.push('内容独特无重复');
          break;
        default:
          s = c.score;
      }
      finalScore += s * w;
    });

    if (qr.coreInfo.completeness >= 0.75 && !reasons.includes('核心信息完整')) reasons.push('核心信息完整');
    if (qr.suggestions.length === 0) reasons.push('无明显问题');

    return { finalScore: totalW > 0 ? finalScore / totalW : 0, reasons };
  };

  const scored = candidates.map((c) => ({ c, ...scoreMap(c) }))
    .sort((a, b) => b.finalScore - a.finalScore);

  const rankedCandidates: RankedCandidate[] = scored.map((item, idx) => ({
    id: item.c.id,
    rank: idx + 1,
    reasons: item.reasons,
    keywordRank: keywordRanking.findIndex(k => k.id === item.c.id) + 1,
    lengthRank: lengthRanking.findIndex(l => l.id === item.c.id) + 1,
    qualityRank: qualityRanking.findIndex(q => q.id === item.c.id) + 1,
  }));

  return {
    totalCandidates: candidates.length,
    similarGroups,
    keywordRanking,
    lengthRanking,
    qualityRanking,
    rankedCandidates,
    summary: {
      totalValidLength: candidates.filter(c => c.qualityReport!.length.valid).length,
      totalWithAllKeywords: candidates.filter(c => c.qualityReport!.keywords.allIncluded).length,
      totalWithDuplicates: candidates.filter(c => c.qualityReport!.isDuplicate).length,
      totalCompleteCoreInfo: candidates.filter(c => c.qualityReport!.coreInfo.completeness >= 0.75).length,
    },
  };
}

export class QualityChecker {
  private defaultLengthLimit?: LengthLimit;
  private duplicateThreshold: number = 0.85;

  constructor(options?: {
    defaultLengthLimit?: LengthLimit;
    duplicateThreshold?: number;
  }) {
    this.defaultLengthLimit = options?.defaultLengthLimit;
    this.duplicateThreshold = options?.duplicateThreshold || 0.85;
  }

  public checkLength(text: string, limit?: LengthLimit): LengthCheckResult {
    return checkLength(text, limit || this.defaultLengthLimit);
  }

  public truncateDetailed(text: string, limit?: LengthLimit): TruncateResult {
    return truncateTextDetailed(text, limit || this.defaultLengthLimit);
  }

  public truncateText(text: string, limit?: LengthLimit): string {
    return truncateText(text, limit || this.defaultLengthLimit);
  }

  public isTruncated(text: string, limit?: LengthLimit): boolean {
    return isTruncated(text, limit || this.defaultLengthLimit);
  }

  public checkKeywords(text: string, keywords: string[]): KeywordCheckResult {
    return checkKeywords(text, keywords);
  }

  public checkCoreInfo(text: string, productInfo?: ProductInfo): CoreInfoCheckResult {
    return checkCoreInfo(text, productInfo);
  }

  public generateReport(
    candidate: CopyCandidate,
    options: {
      lengthLimit?: LengthLimit;
      keywords?: string[];
      productInfo?: ProductInfo;
      allCandidates?: CopyCandidate[];
    } = {}
  ): QualityReport {
    return generateQualityReport(candidate, {
      ...options,
      duplicateThreshold: this.duplicateThreshold,
    });
  }

  public generateAllReports(
    candidates: CopyCandidate[],
    options: {
      lengthLimit?: LengthLimit;
      keywords?: string[];
      productInfo?: ProductInfo;
    } = {}
  ): CopyCandidate[] {
    return candidates.map((candidate) => ({
      ...candidate,
      qualityReport: generateQualityReport(candidate, {
        ...options,
        allCandidates: candidates,
        duplicateThreshold: this.duplicateThreshold,
      }),
    }));
  }

  public generateBatchReport(
    candidates: CopyCandidate[],
    options: {
      lengthLimit?: LengthLimit;
      keywords?: string[];
      productInfo?: ProductInfo;
      sortConfig?: { criteria: string[]; weights: number[] };
    } = {}
  ): BatchQualityReport {
    candidates.forEach(c => {
      if (!c.qualityReport) {
        c.qualityReport = generateQualityReport(c, {
          ...options,
          allCandidates: candidates,
          duplicateThreshold: this.duplicateThreshold,
        });
      }
    });
    return generateBatchQualityReport(candidates, {
      ...options,
      duplicateThreshold: this.duplicateThreshold,
    });
  }

  public findSimilarGroups(candidates: CopyCandidate[], threshold = 0.6): SimilarityGroup[] {
    return findSimilarGroups(candidates, threshold);
  }
}
