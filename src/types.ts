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
  extraParams?: Record<string, unknown>;
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
