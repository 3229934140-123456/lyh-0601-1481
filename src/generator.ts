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
} from './types';
import { AIClient } from './aiClient';
import { SensitiveWordChecker } from './sensitive';
import { sortCandidates, deduplicateCandidates } from './sorter';
import { withRetry, withTimeout } from './retry';
import { QualityChecker, truncateText, truncateTextDetailed, generateBatchQualityReport } from './quality';

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
    return this.generate('selling_point', params, options);
  }

  public async generateTitles(
    params: TitleParams,
    options?: GenerateOptions
  ): Promise<CopyCandidate[]> {
    return this.generate('title', params, options);
  }

  public async generatePromoShorts(
    params: PromoShortParams,
    options?: GenerateOptions
  ): Promise<CopyCandidate[]> {
    return this.generate('promo_short', params, options);
  }

  public async generateLongForms(
    params: LongFormParams,
    options?: GenerateOptions
  ): Promise<CopyCandidate[]> {
    return this.generate('long_form', params, options);
  }

  public async adjustTone(
    params: ToneAdjustParams,
    options?: GenerateOptions
  ): Promise<CopyCandidate[]> {
    return this.generate('tone_adjust', params, options);
  }

  public async generate(
    type: CopyType,
    params: BaseGenerateParams,
    options?: GenerateOptions
  ): Promise<CopyCandidate[]> {
    const opts = { ...this.defaultOptions, ...options };

    const generateFn = async (): Promise<CopyCandidate[]> => {
      const response = await this.aiClient.generate(type, params);

      let candidates: CopyCandidate[] = response.candidates.map((c) => ({
        id: generateCandidateId(),
        content: c.content,
        type,
        score: c.score,
        tags: c.tags,
        sensitiveWords: [],
        hasSensitive: false,
        wasTruncated: false,
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

      if (opts.enableDeduplication) {
        const targetCount = params.candidateCount || 3;
        let threshold = 0.72;
        let deduplicated = deduplicateCandidates(candidates, threshold);

        while (deduplicated.length < targetCount && threshold < 0.96) {
          threshold += 0.04;
          deduplicated = deduplicateCandidates(candidates, threshold);
        }

        if (deduplicated.length < targetCount && candidates.length >= targetCount) {
          const usedIds = new Set(deduplicated.map(d => d.id));
          for (const c of candidates) {
            if (!usedIds.has(c.id) && deduplicated.length < targetCount) {
              deduplicated.push(c);
              usedIds.add(c.id);
            }
          }
        }

        candidates = deduplicated.slice(0, Math.min(targetCount, deduplicated.length));
      }

      if (opts.enableSensitiveCheck) {
        candidates = candidates.map((candidate) => {
          const checkResult = this.sensitiveChecker.check(candidate.content);
          return {
            ...candidate,
            sensitiveWords: checkResult.matches,
            hasSensitive: checkResult.hasSensitive,
          };
        });
      }

      if (opts.enableQualityCheck) {
        candidates = this.qualityChecker.generateAllReports(candidates, {
          lengthLimit: params.lengthLimit,
          keywords: params.keywords,
          productInfo: params.productInfo,
        });
      }

      if (opts.enableSorting) {
        candidates = sortCandidates(candidates, opts.sortConfig, params.lengthLimit?.max);
      }

      return candidates;
    };

    if (opts.timeout) {
      const result = await withTimeout(
        withRetry(generateFn, opts.retry),
        opts.timeout
      );
      return result;
    }

    return withRetry(generateFn, opts.retry);
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
}
