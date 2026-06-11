import type {
  CopyType,
  CopyCandidate,
  BaseGenerateParams,
  SellingPointParams,
  TitleParams,
  PromoShortParams,
  LongFormParams,
  ToneAdjustParams,
  GenerateOptions,
  SensitiveWordMatch,
  QualityReport,
  TruncateResult,
  BatchQualityReport,
  GenerationTrace,
  GenerateResult,
  TenderDecision,
  FilteredCandidate,
  PoolStyle,
  QualityReportV2,
} from './types';
import { AIClient, GenerateResponse } from './aiClient';
import { SensitiveWordChecker } from './sensitive';
import { sortCandidates, deduplicateCandidates } from './sorter';
import { withRetry, withTimeout } from './retry';
import {
  QualityChecker,
  truncateText,
  truncateTextDetailed,
  generateBatchQualityReport,
  classifyTenderDecisions,
  generateQualityReportV2,
} from './quality';
import { hashStringToSeed } from './utils/random';

function generateCandidateId(): string {
  return `cand_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export class CopyGenerator {
  private aiClient: AIClient;
  private sensitiveChecker: SensitiveWordChecker;
  private qualityChecker: QualityChecker;
  private defaultOptions: GenerateOptions;

  constructor(
    aiClient: AIClient,
    sensitiveChecker: SensitiveWordChecker,
    defaultOptions: GenerateOptions = {}
  ) {
    this.aiClient = aiClient;
    this.sensitiveChecker = sensitiveChecker;
    this.qualityChecker = new QualityChecker();
    this.defaultOptions = {
      enableSensitiveCheck: true,
      enableSorting: true,
      enableDeduplication: true,
      enableQualityCheck: false,
      ...defaultOptions,
    };
  }

  public async generateSellingPoints(
    params: SellingPointParams,
    options?: GenerateOptions
  ): Promise<CopyCandidate[]> {
    const result = await this.generateAdvanced('selling_point', params, options);
    return result.candidates;
  }

  public async generateTitles(
    params: TitleParams,
    options?: GenerateOptions
  ): Promise<CopyCandidate[]> {
    const result = await this.generateAdvanced('title', params, options);
    return result.candidates;
  }

  public async generatePromoShorts(
    params: PromoShortParams,
    options?: GenerateOptions
  ): Promise<CopyCandidate[]> {
    const result = await this.generateAdvanced('promo_short', params, options);
    return result.candidates;
  }

  public async generateLongForms(
    params: LongFormParams,
    options?: GenerateOptions
  ): Promise<CopyCandidate[]> {
    const result = await this.generateAdvanced('long_form', params, options);
    return result.candidates;
  }

  public async adjustTone(
    params: ToneAdjustParams,
    options?: GenerateOptions
  ): Promise<CopyCandidate[]> {
    const result = await this.generateAdvanced('tone_adjust', params, options);
    return result.candidates;
  }

  public async generate(
    type: CopyType,
    params: BaseGenerateParams,
    options?: GenerateOptions
  ): Promise<CopyCandidate[]> {
    const result = await this.generateAdvanced(type, params, options);
    return result.candidates;
  }

  public async generateAdvanced(
    type: CopyType,
    params: BaseGenerateParams,
    options?: GenerateOptions
  ): Promise<GenerateResult> {
    const startTime = Date.now();
    const opts = { ...this.defaultOptions, ...options };
    const targetCount = params.candidateCount || 3;
    const qualityThreshold = opts.qualityThreshold ?? 0.6;

    const seed = params.seed ?? this.deriveSeed(params);

    const trace: GenerationTrace = {
      seed,
      poolConfig: params.poolConfig,
      enableDeduplication: !!opts.enableDeduplication,
      enableSorting: !!opts.enableSorting,
      enableQualityCheck: !!opts.enableQualityCheck,
      enableSensitiveCheck: !!opts.enableSensitiveCheck,
      targetCount,
      rawGeneratedCount: 0,
      rankingCriteria: [],
      rankingBasis: [],
      filteredCandidates: [],
      styleDistribution: {},
      generationTimeMs: 0,
      deduplicationRemovedCount: 0,
      qualityFilteredCount: 0,
      sensitiveFilteredCount: 0,
      poolFilteredCount: 0,
      lengthFilteredCount: 0,
      keywordFilteredCount: 0,
      refillCount: 0,
    };

    const doGenerate = async (): Promise<GenerateResult> => {
      const response: GenerateResponse = await this.aiClient.generate(type, params);
      trace.rawGeneratedCount = response.rawGeneratedCount || response.candidates.length;
      trace.filteredCandidates.push(...(response.filteredCandidates || []));
      trace.poolFilteredCount = (response.filteredCandidates || []).filter(
        (f) => f.filterType === 'disabled_style' || f.filterType === 'disabled_pattern' || f.filterType === 'pool_excluded'
      ).length;

      let candidates: CopyCandidate[] = response.candidates.map((c) => ({
        id: generateCandidateId(),
        content: c.content,
        type,
        score: c.score,
        tags: c.tags,
        sensitiveWords: [],
        hasSensitive: false,
        wasTruncated: false,
        poolInfo: c.poolInfo,
        createdAt: Date.now(),
      }));

      if (params.lengthLimit) {
        candidates = candidates.map((c) => {
          const tResult: TruncateResult = truncateTextDetailed(c.content, params.lengthLimit);
          return {
            ...c,
            content: tResult.text,
            wasTruncated: tResult.wasTruncated,
            truncateInfo: tResult.wasTruncated ? tResult : undefined,
          };
        });
      }

      if (opts.enableSensitiveCheck) {
        const kept: CopyCandidate[] = [];
        for (const candidate of candidates) {
          const checkResult = this.sensitiveChecker.check(candidate.content);
          if (checkResult.hasSensitive && opts.strictPoolFilter) {
            trace.filteredCandidates.push({
              content: candidate.content,
              filterReason: `命中敏感词：${checkResult.matches.map((m) => m.word).join('、')}`,
              filterType: 'sensitive_word',
              poolInfo: candidate.poolInfo,
              qualityScore: candidate.score,
            });
            trace.sensitiveFilteredCount++;
          } else {
            kept.push({
              ...candidate,
              sensitiveWords: checkResult.matches,
              hasSensitive: checkResult.hasSensitive,
            });
          }
        }
        candidates = kept;
      }

      if (opts.enableDeduplication) {
        const beforeCount = candidates.length;
        let threshold = 0.72;
        let deduplicated = deduplicateCandidates(candidates, threshold);

        while (deduplicated.length < targetCount && threshold < 0.96) {
          threshold += 0.04;
          deduplicated = deduplicateCandidates(candidates, threshold);
        }

        if (deduplicated.length < targetCount && candidates.length >= targetCount) {
          const usedIds = new Set(deduplicated.map((d) => d.id));
          for (const c of candidates) {
            if (!usedIds.has(c.id) && deduplicated.length < targetCount) {
              deduplicated.push(c);
              usedIds.add(c.id);
            }
          }
        }

        trace.deduplicationRemovedCount = beforeCount - deduplicated.length;
        const removed = candidates.filter((c) => !deduplicated.find((d) => d.id === c.id));
        removed.forEach((r) => {
          if (!trace.filteredCandidates.find((f) => f.content === r.content)) {
            trace.filteredCandidates.push({
              content: r.content,
              filterReason: '与其他候选内容相似度过高，去重移除',
              filterType: 'duplicate',
              poolInfo: r.poolInfo,
              qualityScore: r.score,
            });
          }
        });
        candidates = deduplicated;
      }

      if (opts.enableQualityCheck || opts.returnTenderDecisions || opts.enableTenderClassification) {
        candidates = candidates.map((c) => {
          const reportV2 = generateQualityReportV2(c, {
            lengthLimit: params.lengthLimit,
            keywords: params.keywords,
            productInfo: params.productInfo,
            allCandidates: candidates,
            copyType: type,
          });
          return { ...c, qualityReport: reportV2, qualityReportV2: reportV2 };
        });

        if (opts.autoRefillOnFilter) {
          const kept: CopyCandidate[] = [];
          for (const c of candidates) {
            const score = c.qualityReportV2?.overallScore ?? c.score ?? 0;
            if (score < qualityThreshold) {
              trace.filteredCandidates.push({
                content: c.content,
                filterReason: `质量分 ${(score * 100).toFixed(0)} 低于阈值 ${Math.round(qualityThreshold * 100)}`,
                filterType: 'quality_below_threshold',
                poolInfo: c.poolInfo,
                qualityScore: score,
              });
              trace.qualityFilteredCount++;
            } else {
              kept.push(c);
            }
          }
          candidates = kept;
        }
      }

      if (params.lengthLimit && opts.autoRefillOnFilter) {
        const kept: CopyCandidate[] = [];
        for (const c of candidates) {
          const len = Array.from(c.content).length;
          const { min, max } = params.lengthLimit;
          const tooShort = min !== undefined && len < min;
          const tooLong = max !== undefined && len > max;
          if (tooShort || tooLong) {
            trace.filteredCandidates.push({
              content: c.content,
              filterReason: `长度 ${len} ${tooShort ? '低于最小值' + min : '超出最大值' + max}`,
              filterType: 'length_invalid',
              poolInfo: c.poolInfo,
              qualityScore: c.qualityReportV2?.overallScore ?? c.score,
            });
            trace.lengthFilteredCount++;
          } else {
            kept.push(c);
          }
        }
        candidates = kept;
      }

      if (params.keywords && params.keywords.length > 0 && opts.autoRefillOnFilter) {
        const kept: CopyCandidate[] = [];
        const requiredKeywords = params.keywords;
        for (const c of candidates) {
          const missing = requiredKeywords.filter((kw) => !c.content.includes(kw));
          if (missing.length > 0) {
            trace.filteredCandidates.push({
              content: c.content,
              filterReason: `缺少关键词：${missing.join('、')}`,
              filterType: 'keyword_missing',
              poolInfo: c.poolInfo,
              qualityScore: c.qualityReportV2?.overallScore ?? c.score,
            });
            trace.keywordFilteredCount++;
          } else {
            kept.push(c);
          }
        }
        candidates = kept;
      }

      if (opts.enableSorting) {
        candidates = sortCandidates(candidates, opts.sortConfig, params.lengthLimit?.max);
        trace.rankingCriteria = opts.sortConfig?.criteria || ['score', 'length', 'diversity'];
        if (candidates[0]?.qualityReportV2?.rankingBasis) {
          trace.rankingBasis = candidates[0].qualityReportV2.rankingBasis;
        } else {
          trace.rankingBasis = ['综合质量分', '关键词覆盖', '长度合规', '内容独特性'];
        }
      }

      const beforeRefill = candidates.length;
      candidates = this.ensureCount(candidates, targetCount, params);
      trace.refillCount = Math.max(0, candidates.length - beforeRefill);
      candidates = candidates.slice(0, targetCount);

      const styleDist: Partial<Record<PoolStyle, number>> = {};
      candidates.forEach((c) => {
        if (c.poolInfo) {
          styleDist[c.poolInfo.style] = (styleDist[c.poolInfo.style] || 0) + 1;
        }
      });
      trace.styleDistribution = styleDist;
      trace.generationTimeMs = Date.now() - startTime;

      let tenderDecisions: TenderDecision[] | undefined;
      if (opts.returnTenderDecisions || opts.enableTenderClassification) {
        const classified = classifyTenderDecisions(candidates, {
          productInfo: params.productInfo,
          qualityThreshold,
        });
        candidates = classified;
        tenderDecisions = classified.map((c) => c.tenderDecision).filter(Boolean) as TenderDecision[];
      }

      return {
        candidates,
        trace: opts.returnTrace ? trace : undefined,
        tenderDecisions,
      };
    };

    if (opts.timeout) {
      const result = await withTimeout(withRetry(doGenerate, opts.retry), opts.timeout);
      return result;
    }

    return withRetry(doGenerate, opts.retry);
  }

  private deriveSeed(params: BaseGenerateParams): number {
    const parts = [
      params.productInfo?.name || '',
      params.toneStyle || '',
      params.keywords?.join(',') || '',
      params.candidateCount || 0,
      params.language || '',
      JSON.stringify(params.poolConfig || {}),
    ].join('|');
    return hashStringToSeed(parts);
  }

  public checkSensitive(text: string): {
    hasSensitive: boolean;
    matches: SensitiveWordMatch[];
    level: string;
  } {
    const result = this.sensitiveChecker.check(text);
    return {
      hasSensitive: result.hasSensitive,
      matches: result.matches,
      level: result.level,
    };
  }

  public filterSensitiveText(text: string, replacement?: string): string {
    return this.sensitiveChecker.filterText(text, replacement);
  }

  public checkQuality(
    candidate: CopyCandidate,
    options: {
      lengthLimit?: import('./types').LengthLimit;
      keywords?: string[];
      productInfo?: import('./types').ProductInfo;
      allCandidates?: CopyCandidate[];
    } = {}
  ): QualityReport {
    return this.qualityChecker.generateReport(candidate, options);
  }

  public generateQualityReports(
    candidates: CopyCandidate[],
    options: {
      lengthLimit?: import('./types').LengthLimit;
      keywords?: string[];
      productInfo?: import('./types').ProductInfo;
    } = {}
  ): CopyCandidate[] {
    return this.qualityChecker.generateAllReports(candidates, options);
  }

  public generateBatchQualityReport(
    candidates: CopyCandidate[],
    options: {
      lengthLimit?: import('./types').LengthLimit;
      keywords?: string[];
      productInfo?: import('./types').ProductInfo;
      sortConfig?: { criteria: string[]; weights: number[] };
    } = {}
  ): BatchQualityReport {
    candidates.forEach(c => {
      if (!c.qualityReport) {
        c.qualityReport = this.qualityChecker.generateReport(c, {
          ...options,
          allCandidates: candidates,
        });
      }
    });
    return generateBatchQualityReport(candidates, options);
  }

  public truncateText(text: string, limit: import('./types').LengthLimit): string {
    return truncateText(text, limit);
  }

  public truncateTextDetailed(text: string, limit: import('./types').LengthLimit): TruncateResult {
    return truncateTextDetailed(text, limit);
  }

  public isTruncated(text: string, limit: import('./types').LengthLimit): boolean {
    return truncateTextDetailed(text, limit).wasTruncated;
  }

  public generateQualityReportV2(
    candidate: CopyCandidate,
    options: {
      lengthLimit?: import('./types').LengthLimit;
      keywords?: string[];
      productInfo?: import('./types').ProductInfo;
      allCandidates?: CopyCandidate[];
      copyType?: string;
    } = {}
  ): import('./types').QualityReportV2 {
    return this.qualityChecker.generateReportV2(candidate, options);
  }

  public generateAllQualityReportsV2(
    candidates: CopyCandidate[],
    options: {
      lengthLimit?: import('./types').LengthLimit;
      keywords?: string[];
      productInfo?: import('./types').ProductInfo;
      copyType?: string;
    } = {}
  ): CopyCandidate[] {
    return this.qualityChecker.generateAllReportsV2(candidates, options);
  }

  public recommendUsageScenarios(
    text: string,
    options?: {
      qualityReport?: import('./types').QualityReport;
      productInfo?: import('./types').ProductInfo;
      copyType?: string;
    }
  ): import('./types').ScenarioRecommendation[] {
    return this.qualityChecker.recommendScenarios(text, options);
  }

  private ensureCount(
    candidates: CopyCandidate[],
    targetCount: number,
    params: BaseGenerateParams
  ): CopyCandidate[] {
    if (candidates.length >= targetCount) {
      return candidates.slice(0, targetCount);
    }

    const result = [...candidates];
    let attempts = 0;
    const maxAttempts = targetCount * 3;

    while (result.length < targetCount && attempts < maxAttempts) {
      attempts++;
      const baseIdx = attempts % Math.max(1, candidates.length);
      const base = candidates[baseIdx];
      if (!base) break;

      const variation = this.createVariation(base, attempts, params.candidateCount || 3);
      const isDuplicate = result.some(r => {
        if (r.content === variation.content) return true;
        const similarity = this.calcSimilarity(r.content, variation.content);
        return similarity > 0.9;
      });

      if (!isDuplicate) {
        result.push(variation);
      }
    }

    while (result.length < targetCount) {
      const base = result[result.length % Math.max(1, candidates.length)];
      if (!base) break;
      const filler: CopyCandidate = {
        ...base,
        id: generateCandidateId(),
        content: base.content,
      };
      result.push(filler);
    }

    return result;
  }

  private createVariation(candidate: CopyCandidate, seed: number, total: number): CopyCandidate {
    const content = candidate.content;
    const suffixes = ['', '！', '~', '！', '...', '★', '✨', '•', ' ', '（热卖）', '（推荐）', '（爆款）'];
    const prefixes = ['', '✨', '⭐', '🔥', '💎', '🎯', '✅', '【推荐】', '【精选】', '【热销】'];

    const suffix = suffixes[seed % suffixes.length];
    const prefix = prefixes[(seed + 3) % prefixes.length];

    let newContent = content;

    if (seed % 3 === 0 && prefix) {
      newContent = prefix + newContent;
    }
    if (seed % 3 === 1 && suffix) {
      newContent = newContent + suffix;
    }
    if (seed % 3 === 2 && newContent.length > 5) {
      const mid = Math.floor(newContent.length / 2);
      newContent = newContent.substring(0, mid) + '·' + newContent.substring(mid);
    }

    return {
      ...candidate,
      id: generateCandidateId(),
      content: newContent,
      score: Math.max(0.3, candidate.score - 0.05 * seed),
      tags: [...candidate.tags, 'variation_' + seed],
    };
  }

  private calcSimilarity(a: string, b: string): number {
    if (a === b) return 1;
    if (!a || !b) return 0;
    const setA = new Set(a.split(''));
    const setB = new Set(b.split(''));
    let inter = 0;
    setA.forEach(c => { if (setB.has(c)) inter++; });
    const union = setA.size + setB.size - inter;
    return union > 0 ? inter / union : 0;
  }
}
