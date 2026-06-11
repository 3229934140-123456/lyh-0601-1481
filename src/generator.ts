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
  LengthLimit,
} from './types';
import { AIClient } from './aiClient';
import { SensitiveWordChecker } from './sensitive';
import { sortCandidates, deduplicateCandidates } from './sorter';
import { withRetry, withTimeout } from './retry';

function generateCandidateId(): string {
  return `cand_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function truncateText(text: string, limit?: LengthLimit): string {
  if (!limit || limit.max === undefined) return text;

  const unit = limit.unit || 'char';

  if (unit === 'char') {
    if (text.length > limit.max) {
      return text.substring(0, limit.max - 3) + '...';
    }
  } else {
    const words = text.split(/\s+/);
    if (words.length > limit.max) {
      return words.slice(0, limit.max - 1).join(' ') + ' ...';
    }
  }

  return text;
}

export class CopyGenerator {
  private aiClient: AIClient;
  private sensitiveChecker: SensitiveWordChecker;
  private defaultOptions: GenerateOptions;

  constructor(
    aiClient: AIClient,
    sensitiveChecker: SensitiveWordChecker,
    defaultOptions: GenerateOptions = {}
  ) {
    this.aiClient = aiClient;
    this.sensitiveChecker = sensitiveChecker;
    this.defaultOptions = {
      enableSensitiveCheck: true,
      enableSorting: true,
      enableDeduplication: true,
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
        content: truncateText(c.content, params.lengthLimit),
        type,
        score: c.score,
        tags: c.tags,
        sensitiveWords: [],
        hasSensitive: false,
        createdAt: Date.now(),
      }));

      if (opts.enableDeduplication) {
        candidates = deduplicateCandidates(candidates, 0.7);
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
}
