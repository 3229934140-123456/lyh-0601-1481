import type {
  QualityReport,
  LengthCheckResult,
  KeywordCheckResult,
  CoreInfoCheckResult,
  LengthLimit,
  ProductInfo,
  CopyCandidate,
} from './types';

export function checkLength(text: string, limit?: LengthLimit): LengthCheckResult {
  const unit = limit?.unit || 'char';
  let currentLength = 0;

  if (unit === 'char') {
    currentLength = text.length;
  } else {
    currentLength = text.split(/\s+/).filter((w) => w.length > 0).length;
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

export function truncateText(text: string, limit?: LengthLimit): string {
  if (!limit || limit.max === undefined) return text;

  const unit = limit.unit || 'char';

  if (unit === 'char') {
    if (text.length <= limit.max) return text;

    const suffix = '...';
    const suffixLen = suffix.length;
    const maxContentLength = Math.max(0, limit.max - suffixLen);
    let result = text.substring(0, maxContentLength);

    const strongPunctuations = ['。', '！', '？', '\n', '；'];
    let bestCutPoint = -1;

    for (const punct of strongPunctuations) {
      const idx = result.lastIndexOf(punct);
      if (idx > bestCutPoint && idx >= maxContentLength * 0.6) {
        bestCutPoint = idx;
      }
    }

    if (bestCutPoint > 0) {
      result = result.substring(0, bestCutPoint + 1);
    } else {
      const weakPunctuations = ['，', '、', ' '];
      for (const punct of weakPunctuations) {
        const idx = result.lastIndexOf(punct);
        if (idx > bestCutPoint && idx >= maxContentLength * 0.8) {
          bestCutPoint = idx;
        }
      }

      if (bestCutPoint > 0) {
        result = result.substring(0, bestCutPoint + 1);
      }
    }

    return result + suffix;
  } else {
    const words = text.split(/\s+/).filter((w) => w.length > 0);
    if (words.length <= limit.max) return text;

    const resultWords = words.slice(0, limit.max - 1);
    return resultWords.join(' ') + ' ...';
  }
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

  const hasProductName = productInfo?.name
    ? text.includes(productInfo.name)
    : false;
  if (!hasProductName && productInfo?.name) {
    missing.push('商品名称');
  }

  const hasBrand = productInfo?.brand
    ? text.includes(productInfo.brand)
    : false;
  if (!hasBrand && productInfo?.brand) {
    missing.push('品牌名称');
  }

  const hasPrice = productInfo?.price !== undefined
    ? text.includes(String(productInfo.price))
    : false;
  if (!hasPrice && productInfo?.price !== undefined) {
    missing.push('价格信息');
  }

  const features = productInfo?.features || [];
  let hasFeatures = false;
  if (features.length > 0) {
    const featureCount = features.filter((f) => text.includes(f)).length;
    hasFeatures = featureCount >= Math.min(1, features.length);
    if (!hasFeatures) {
      missing.push('产品特点');
    }
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

  const set1 = new Set(text1.split(''));
  const set2 = new Set(text2.split(''));

  let intersection = 0;
  for (const char of set1) {
    if (set2.has(char)) intersection++;
  }

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
      return {
        isDuplicate: true,
        duplicateWith: other.id,
      };
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
    const dupCheck = checkDuplicate(candidate, options.allCandidates, options.duplicateThreshold);
    isDuplicate = dupCheck.isDuplicate;
    duplicateWith = dupCheck.duplicateWith;
  }

  const suggestions: string[] = [];

  if (lengthCheck.tooShort) {
    suggestions.push(`内容偏短，当前${lengthCheck.currentLength}${lengthCheck.unit === 'char' ? '字' : '词'}，建议至少${lengthCheck.minLength}${lengthCheck.unit === 'char' ? '字' : '词'}`);
  }
  if (lengthCheck.tooLong) {
    suggestions.push(`内容偏长，当前${lengthCheck.currentLength}${lengthCheck.unit === 'char' ? '字' : '词'}，建议不超过${lengthCheck.maxLength}${lengthCheck.unit === 'char' ? '字' : '词'}`);
  }

  if (!keywordCheck.allIncluded && keywordCheck.missingKeywords.length > 0) {
    suggestions.push(`缺少关键词：${keywordCheck.missingKeywords.join('、')}`);
  }

  if (coreInfoCheck.missingInfo.length > 0) {
    suggestions.push(`缺少商品核心信息：${coreInfoCheck.missingInfo.join('、')}`);
  }

  if (isDuplicate) {
    suggestions.push('与其他候选内容相似度较高');
  }

  if (candidate.hasSensitive) {
    suggestions.push('包含敏感词，请检查');
  }

  const overallScore = Math.round(
    (lengthCheck.valid ? 25 : 10) +
    (keywordCheck.inclusionRate * 25) +
    (coreInfoCheck.completeness * 25) +
    (isDuplicate ? 5 : 25) +
    (candidate.hasSensitive ? 0 : candidate.score * 25)
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

  public truncateText(text: string, limit?: LengthLimit): string {
    return truncateText(text, limit || this.defaultLengthLimit);
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
}
