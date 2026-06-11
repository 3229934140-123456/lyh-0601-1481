export type CopyType =
  | 'selling_point'
  | 'title'
  | 'promo_short'
  | 'long_form'
  | 'tone_adjust';

export type ToneStyle =
  | 'formal'
  | 'casual'
  | 'humorous'
  | 'professional'
  | 'warm'
  | 'urgent'
  | 'luxury'
  | 'youthful';

export type TargetAudience = {
  ageRange?: [number, number];
  gender?: 'male' | 'female' | 'all';
  occupation?: string;
  interests?: string[];
  region?: string;
  consumptionLevel?: 'low' | 'medium' | 'high';
  description?: string;
};

export type ProductInfo = {
  name: string;
  category?: string;
  brand?: string;
  price?: number;
  originalPrice?: number;
  features?: string[];
  specifications?: Record<string, string>;
  usageScenarios?: string[];
  targetAudience?: TargetAudience;
  images?: string[];
  description?: string;
};

export type LengthLimit = {
  min?: number;
  max?: number;
  unit?: 'char' | 'word';
};

export type SensitiveWordLevel = 'low' | 'medium' | 'high';

export type SensitiveWordMatch = {
  word: string;
  position: number;
  level: SensitiveWordLevel;
  category: string;
  suggestion?: string;
};

export type CopyCandidate = {
  id: string;
  content: string;
  type: CopyType;
  score: number;
  tags: string[];
  sensitiveWords: SensitiveWordMatch[];
  hasSensitive: boolean;
  qualityReport?: QualityReport;
  qualityReportV2?: QualityReportV2;
  wasTruncated: boolean;
  truncateInfo?: TruncateResult;
  poolInfo?: CandidatePoolSource;
  createdAt: number;
  metadata?: Record<string, unknown>;
};

export type GenerationRecord = {
  id: string;
  type: CopyType;
  productInfo?: ProductInfo;
  params: Record<string, unknown>;
  candidates: CopyCandidate[];
  status: 'success' | 'failed' | 'partial';
  error?: string;
  createdAt: number;
  completedAt?: number;
  duration?: number;
};

export type CopyTemplate = {
  id: string;
  name: string;
  type: CopyType;
  content: string;
  variables: string[];
  description?: string;
  createdAt: number;
  updatedAt: number;
};

export type RetryConfig = {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryableErrors: string[];
};

export type SortConfig = {
  criteria: ('score' | 'length' | 'diversity' | 'freshness')[];
  weights: number[];
  ascending: boolean;
};

export type BaseGenerateParams = {
  productInfo?: ProductInfo;
  toneStyle?: ToneStyle;
  lengthLimit?: LengthLimit;
  targetAudience?: TargetAudience;
  candidateCount?: number;
  keywords?: string[];
  excludeKeywords?: string[];
  referenceCopy?: string;
  language?: string;
  seed?: number;
  poolConfig?: PoolConfig;
  extraParams?: Record<string, unknown>;
};

export type PoolStyle =
  | 'official'
  | 'bestseller'
  | 'grassroots'
  | 'promotion'
  | 'emotional'
  | 'professional'
  | 'youthful'
  | 'luxury';

export type PoolConfig = {
  preferredStyles?: PoolStyle[];
  disabledStyles?: PoolStyle[];
  disabledPatterns?: string[];
  weightByStyle?: Partial<Record<PoolStyle, number>>;
};

export type CandidatePoolSource = {
  poolId: string;
  poolName: string;
  style: PoolStyle;
  matchScore: number;
  selectedReason: string;
};

export type UsageScenario =
  | 'search_title'
  | 'detail_hero'
  | 'sms_promo'
  | 'social_grass'
  | 'live_stream'
  | 'email_marketing'
  | 'banner_ad'
  | 'push_notification';

export type ScenarioRecommendation = {
  scenario: UsageScenario;
  fitScore: number;
  reason: string;
};

export type QualityReportV2 = QualityReport & {
  recommendScenarios: ScenarioRecommendation[];
  rankingBasis: string[];
  poolInfo?: CandidatePoolSource;
};

export type SellingPointParams = BaseGenerateParams & {
  type?: 'bullet' | 'paragraph' | 'numbered';
  highlightBenefits?: boolean;
};

export type TitleParams = BaseGenerateParams & {
  includeBrand?: boolean;
  includeKeywords?: boolean;
  seoOptimized?: boolean;
};

export type PromoShortParams = BaseGenerateParams & {
  promotionType?: 'discount' | 'limited' | 'gift' | 'new' | 'hot';
  urgency?: boolean;
  includePrice?: boolean;
};

export type LongFormParams = BaseGenerateParams & {
  sections?: string[];
  structure?: 'intro_body_conclusion' | 'problem_solution' | 'storytelling';
  format?: 'article' | 'description' | 'review' | 'guide';
};

export type ToneAdjustParams = BaseGenerateParams & {
  sourceCopy: string;
  targetTone: ToneStyle;
  keepMeaning?: boolean;
};

export type GenerateOptions = {
  enableSensitiveCheck?: boolean;
  enableSorting?: boolean;
  sortConfig?: Partial<SortConfig>;
  enableDeduplication?: boolean;
  enableQualityCheck?: boolean;
  timeout?: number;
  retry?: Partial<RetryConfig>;
};

export type BatchGenerateItem<T extends BaseGenerateParams = BaseGenerateParams> = {
  id?: string;
  type: CopyType;
  params: T;
  options?: GenerateOptions;
};

export type BatchResultItem = {
  id: string;
  type: CopyType;
  success: boolean;
  candidates?: CopyCandidate[];
  error?: string;
};

export type SDKConfig = {
  apiKey?: string;
  apiEndpoint?: string;
  model?: string;
  defaultToneStyle?: ToneStyle;
  defaultCandidateCount?: number;
  defaultLanguage?: string;
  enableSensitiveCheck?: boolean;
  enableSorting?: boolean;
  retry?: Partial<RetryConfig>;
  sortConfig?: Partial<SortConfig>;
  sensitiveWordList?: SensitiveWordMatch[];
  customTemplates?: CopyTemplate[];
  onGenerate?: (record: GenerationRecord) => void;
  onError?: (error: Error, context?: Record<string, unknown>) => void;
};

export type SensitiveCheckResult = {
  hasSensitive: boolean;
  matches: SensitiveWordMatch[];
  level: SensitiveWordLevel;
};

export type TruncateResult = {
  text: string;
  wasTruncated: boolean;
  originalLength: number;
  finalLength: number;
  unit: 'char' | 'word';
  truncatePoint?: number;
};

export type LengthCheckResult = {
  valid: boolean;
  currentLength: number;
  minLength?: number;
  maxLength?: number;
  unit: 'char' | 'word';
  tooShort: boolean;
  tooLong: boolean;
};

export type KeywordCheckResult = {
  allIncluded: boolean;
  includedKeywords: string[];
  missingKeywords: string[];
  inclusionRate: number;
};

export type CoreInfoCheckResult = {
  hasProductName: boolean;
  hasBrand: boolean;
  hasPrice: boolean;
  hasFeatures: boolean;
  missingInfo: string[];
  completeness: number;
};

export type SimilarityGroup = {
  groupId: string;
  candidateIds: string[];
  averageSimilarity: number;
  representativeId: string;
};

export type RankedCandidate = {
  id: string;
  rank: number;
  reasons: string[];
  keywordRank?: number;
  lengthRank?: number;
  qualityRank?: number;
};

export type BatchQualityReport = {
  totalCandidates: number;
  similarGroups: SimilarityGroup[];
  keywordRanking: Array<{ id: string; inclusionRate: number; includedCount: number }>;
  lengthRanking: Array<{ id: string; length: number; valid: boolean }>;
  qualityRanking: Array<{ id: string; overallScore: number }>;
  rankedCandidates: RankedCandidate[];
  summary: {
    totalValidLength: number;
    totalWithAllKeywords: number;
    totalWithDuplicates: number;
    totalCompleteCoreInfo: number;
  };
};

export type QualityReport = {
  length: LengthCheckResult;
  keywords: KeywordCheckResult;
  coreInfo: CoreInfoCheckResult;
  isDuplicate: boolean;
  duplicateWith?: string;
  overallScore: number;
  suggestions: string[];
};

export type TemplatePreviewResult = {
  id: string;
  name: string;
  originalContent: string;
  previewContent: string;
  variables: string[];
  filledVariables: string[];
  missingVariables: string[];
  isComplete: boolean;
};

export type TemplateValidationIssue = {
  type: 'duplicate_variable' | 'unclosed_placeholder' | 'unopened_placeholder' | 'empty_variable' | 'invalid_variable_name';
  severity: 'error' | 'warning';
  message: string;
  position?: number;
  variableName?: string;
};

export type TemplateValidationResult = {
  valid: boolean;
  variables: string[];
  duplicateVariables: string[];
  issues: TemplateValidationIssue[];
  errorCount: number;
  warningCount: number;
  suggestion?: string;
};

export type BatchTemplateHealth = {
  totalTemplates: number;
  validTemplates: number;
  invalidTemplates: number;
  fillableTemplates: number;
  partiallyFillable: number;
  unfillableTemplates: number;
  details: Array<{
    templateId: string;
    templateName: string;
    canFill: boolean;
    fillPercentage: number;
    validation: TemplateValidationResult;
    variables: { name: string; filled: boolean }[];
  }>;
};

export type BatchFillResult = {
  templateId: string;
  templateName: string;
  content: string;
  success: boolean;
  error?: string;
  variables: string[];
  filledVariables: string[];
  missingVariables: string[];
};
