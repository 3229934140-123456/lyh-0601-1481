import type {
  SDKConfig,
  CopyType,
  CopyCandidate,
  CopyTemplate,
  GenerationRecord,
  BaseGenerateParams,
  SellingPointParams,
  TitleParams,
  PromoShortParams,
  LongFormParams,
  ToneAdjustParams,
  GenerateOptions,
  BatchGenerateItem,
  BatchResultItem,
  SensitiveCheckResult,
  SortConfig,
  QualityReport,
  TemplatePreviewResult,
  BatchFillResult,
  LengthLimit,
  ProductInfo,
  TruncateResult,
  BatchQualityReport,
  TemplateValidationResult,
  BatchTemplateHealth,
  GenerateResult,
  TenderDecision,
} from './types';
import { AIClient } from './aiClient';
import { SensitiveWordChecker } from './sensitive';
import { TemplateManager } from './template';
import { RecordManager } from './record';
import { CopyGenerator } from './generator';
import { sortCandidates } from './sorter';
import {
  QualityChecker,
  truncateText as truncateTextUtil,
  truncateTextDetailed as truncateTextDetailedUtil,
  isTruncated as isTruncatedUtil,
  generateBatchQualityReport as generateBatchQualityReportUtil,
  findSimilarGroups as findSimilarGroupsUtil,
  classifyTenderDecisions as classifyTenderDecisionsUtil,
} from './quality';

function generateRecordId(): string {
  return `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export class CopySDK {
  private config: SDKConfig;
  private aiClient: AIClient;
  private sensitiveChecker: SensitiveWordChecker;
  private templateManager: TemplateManager;
  private recordManager: RecordManager;
  private generator: CopyGenerator;
  private qualityChecker: QualityChecker;

  constructor(config: SDKConfig = {}) {
    this.config = {
      defaultToneStyle: 'professional',
      defaultCandidateCount: 3,
      defaultLanguage: 'zh-CN',
      enableSensitiveCheck: true,
      enableSorting: true,
      ...config,
    };

    this.aiClient = new AIClient({
      apiKey: this.config.apiKey,
      apiEndpoint: this.config.apiEndpoint,
      model: this.config.model,
    });

    this.sensitiveChecker = new SensitiveWordChecker(this.config.sensitiveWordList);

    this.templateManager = new TemplateManager(this.config.customTemplates);

    this.recordManager = new RecordManager(1000);

    if (this.config.onGenerate) {
      this.recordManager.setOnRecordCallback(this.config.onGenerate);
    }

    this.qualityChecker = new QualityChecker();

    this.generator = new CopyGenerator(
      this.aiClient,
      this.sensitiveChecker,
      {
        enableSensitiveCheck: this.config.enableSensitiveCheck,
        enableSorting: this.config.enableSorting,
        sortConfig: this.config.sortConfig as Partial<SortConfig>,
        retry: this.config.retry,
        enableQualityCheck: false,
      }
    );
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
    const mergedParams = this.mergeDefaultParams(params);
    const recordId = generateRecordId();

    const record: GenerationRecord = {
      id: recordId,
      type,
      productInfo: mergedParams.productInfo,
      params: mergedParams as Record<string, unknown>,
      candidates: [],
      status: 'success',
      createdAt: Date.now(),
    };

    try {
      const candidates = await this.generator.generate(type, mergedParams, options);
      record.candidates = candidates;
      record.status = candidates.length > 0 ? 'success' : 'partial';
      record.completedAt = Date.now();
      record.duration = Date.now() - record.createdAt;

      this.recordManager.addRecord(record);

      return candidates;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      record.status = 'failed';
      record.error = err.message;
      record.completedAt = Date.now();
      record.duration = Date.now() - record.createdAt;

      this.recordManager.addRecord(record);

      if (this.config.onError) {
        this.config.onError(err, { type, params: mergedParams });
      }

      throw err;
    }
  }

  public async batchGenerate(
    items: BatchGenerateItem[]
  ): Promise<BatchResultItem[]> {
    const results: BatchResultItem[] = [];

    for (const item of items) {
      const itemId = item.id || generateRecordId();

      try {
        const candidates = await this.generate(item.type, item.params, item.options);
        results.push({
          id: itemId,
          type: item.type,
          success: true,
          candidates,
        });
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        results.push({
          id: itemId,
          type: item.type,
          success: false,
          error: err.message,
        });
      }
    }

    return results;
  }

  public checkSensitive(text: string): SensitiveCheckResult {
    return this.sensitiveChecker.check(text);
  }

  public filterSensitiveText(text: string, replacement?: string): string {
    return this.sensitiveChecker.filterText(text, replacement);
  }

  public sortCandidates(
    candidates: CopyCandidate[],
    config?: Partial<SortConfig>,
    idealLength?: number
  ): CopyCandidate[] {
    return sortCandidates(candidates, config, idealLength);
  }

  public checkQuality(
    candidate: CopyCandidate,
    options: {
      lengthLimit?: LengthLimit;
      keywords?: string[];
      productInfo?: ProductInfo;
      allCandidates?: CopyCandidate[];
    } = {}
  ): QualityReport {
    return this.qualityChecker.generateReport(candidate, options);
  }

  public generateQualityReports(
    candidates: CopyCandidate[],
    options: {
      lengthLimit?: LengthLimit;
      keywords?: string[];
      productInfo?: ProductInfo;
    } = {}
  ): CopyCandidate[] {
    return this.qualityChecker.generateAllReports(candidates, options);
  }

  public generateBatchQualityReport(
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
        c.qualityReport = this.qualityChecker.generateReport(c, {
          ...options,
          allCandidates: candidates,
        });
      }
    });
    return generateBatchQualityReportUtil(candidates, options);
  }

  public findSimilarGroups(
    candidates: CopyCandidate[],
    threshold: number = 0.6
  ) {
    return findSimilarGroupsUtil(candidates, threshold);
  }

  public generateQualityReportV2(
    candidate: CopyCandidate,
    options: {
      lengthLimit?: LengthLimit;
      keywords?: string[];
      productInfo?: ProductInfo;
      allCandidates?: CopyCandidate[];
      copyType?: string;
    } = {}
  ): import('./types').QualityReportV2 {
    return this.qualityChecker.generateReportV2(candidate, options);
  }

  public generateQualityReportsV2(
    candidates: CopyCandidate[],
    options: {
      lengthLimit?: LengthLimit;
      keywords?: string[];
      productInfo?: ProductInfo;
      copyType?: string;
    } = {}
  ): CopyCandidate[] {
    return this.qualityChecker.generateAllReportsV2(candidates, options);
  }

  public recommendUsageScenarios(
    text: string,
    options?: {
      qualityReport?: QualityReport;
      productInfo?: ProductInfo;
      copyType?: string;
    }
  ): import('./types').ScenarioRecommendation[] {
    return this.qualityChecker.recommendScenarios(text, options);
  }

  public async generateAdvanced(
    type: CopyType,
    params: BaseGenerateParams,
    options?: GenerateOptions
  ): Promise<GenerateResult> {
    const mergedParams = this.mergeDefaultParams(params);
    const recordId = generateRecordId();

    const record: GenerationRecord = {
      id: recordId,
      type,
      productInfo: mergedParams.productInfo,
      params: mergedParams as Record<string, unknown>,
      candidates: [],
      status: 'success',
      createdAt: Date.now(),
    };

    try {
      const result = await this.generator.generateAdvanced(type, mergedParams, options);
      record.candidates = result.candidates;
      record.status = result.candidates.length > 0 ? 'success' : 'partial';
      record.completedAt = Date.now();
      record.duration = Date.now() - record.createdAt;

      this.recordManager.addRecord(record);

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      record.status = 'failed';
      record.error = err.message;
      record.completedAt = Date.now();
      record.duration = Date.now() - record.createdAt;

      this.recordManager.addRecord(record);

      if (this.config.onError) {
        this.config.onError(err, { type, params: mergedParams });
      }

      throw err;
    }
  }

  public classifyTenderDecisions(
    candidates: CopyCandidate[],
    options?: { productInfo?: ProductInfo; qualityThreshold?: number }
  ): (CopyCandidate & { tenderDecision?: TenderDecision })[] {
    return classifyTenderDecisionsUtil(candidates, options);
  }

  public truncateText(text: string, limit: LengthLimit): string {
    return truncateTextUtil(text, limit);
  }

  public truncateTextDetailed(text: string, limit: LengthLimit): TruncateResult {
    return truncateTextDetailedUtil(text, limit);
  }

  public isTruncated(text: string, limit: LengthLimit): boolean {
    return isTruncatedUtil(text, limit);
  }

  public getTemplate(id: string): CopyTemplate | null {
    return this.templateManager.getTemplate(id);
  }

  public listTemplates(type?: CopyType): CopyTemplate[] {
    return this.templateManager.listTemplates(type);
  }

  public addTemplate(
    template: Omit<CopyTemplate, 'id' | 'createdAt' | 'updatedAt' | 'variables'> & { id?: string }
  ): CopyTemplate {
    return this.templateManager.addTemplate(template);
  }

  public updateTemplate(
    id: string,
    updates: Partial<Omit<CopyTemplate, 'id' | 'createdAt' | 'updatedAt' | 'variables'>>
  ): CopyTemplate | null {
    return this.templateManager.updateTemplate(id, updates);
  }

  public deleteTemplate(id: string): boolean {
    return this.templateManager.deleteTemplate(id);
  }

  public fillTemplate(id: string, variables: Record<string, string>): string {
    return this.templateManager.fillTemplate(id, variables);
  }

  public fillTemplateContent(content: string, variables: Record<string, string>): string {
    return this.templateManager.fillTemplateContent(content, variables);
  }

  public previewTemplate(
    id: string,
    variables: Record<string, string>
  ): TemplatePreviewResult {
    return this.templateManager.previewTemplate(id, variables);
  }

  public previewTemplateContent(
    content: string,
    variables: Record<string, string>
  ): TemplatePreviewResult {
    return this.templateManager.previewTemplateContent(content, { variables });
  }

  public validateTemplateContent(content: string): TemplateValidationResult {
    return this.templateManager.validateTemplateContent(content);
  }

  public validateTemplate(id: string): TemplateValidationResult {
    return this.templateManager.validateTemplate(id);
  }

  public getBatchTemplateHealth(
    items: Array<{ templateId: string; variables: Record<string, string> }>
  ): BatchTemplateHealth {
    return this.templateManager.getBatchHealth(items);
  }

  public batchFillTemplates(
    items: Array<{ templateId: string; variables: Record<string, string> }>
  ): BatchFillResult[] {
    return this.templateManager.batchFill(items);
  }

  public batchPreviewTemplates(
    items: Array<{ templateId: string; variables: Record<string, string> }>
  ): Array<TemplatePreviewResult & { success: boolean; error?: string }> {
    return this.templateManager.batchPreview(items);
  }

  public getGenerationRecord(id: string): GenerationRecord | null {
    return this.recordManager.getRecord(id);
  }

  public listGenerationRecords(type?: CopyType, limit?: number, offset?: number): GenerationRecord[] {
    return this.recordManager.listRecords(type, limit, offset);
  }

  public getStatistics(): {
    total: number;
    success: number;
    failed: number;
    partial: number;
    averageDuration: number;
  } {
    return this.recordManager.getStatistics();
  }

  private mergeDefaultParams<T extends BaseGenerateParams>(params: T): T {
    return {
      ...params,
      toneStyle: params.toneStyle || this.config.defaultToneStyle,
      candidateCount: params.candidateCount || this.config.defaultCandidateCount,
      language: params.language || this.config.defaultLanguage,
    };
  }
}

export default CopySDK;
