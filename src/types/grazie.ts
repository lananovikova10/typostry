// Language enum based on Grazie API
export type Language = 
  | 'EN' 
  | 'DE' 
  | 'ES' 
  | 'FR' 
  | 'IT' 
  | 'PT' 
  | 'RU' 
  | 'ZH' 
  | 'JA' 
  | 'KO';

// Service types for grammar correction
export enum CorrectionServiceType {
  MLEC = 'MLEC',
  SPELL = 'SPELL', 
  RULE = 'RULE'
}

// Problem categories
export enum ProblemCategory {
  SPELLING = 'SPELLING',
  PUNCTUATION = 'PUNCTUATION',
  TYPOGRAPHY = 'TYPOGRAPHY',
  GRAMMAR = 'GRAMMAR',
  SEMANTICS = 'SEMANTICS',
  STYLE = 'STYLE',
  READABILITY = 'READABILITY',
  INCLUSIVITY = 'INCLUSIVITY',
  TONE = 'TONE',
  FORMALITY = 'FORMALITY',
  OTHER = 'OTHER'
}

// Confidence levels
export enum ConfidenceLevel {
  LOW = 'LOW',
  HIGH = 'HIGH'
}

// Text range for highlighting and changes
export interface TextRange {
  start: number;
  endExclusive: number;
}

// Problem ID structure
export interface ProblemKindID {
  id: string; // Format: SERVICE.LANGUAGE.{problem}
}

// Kind info for problems
export interface KindInfo {
  id: ProblemKindID;
  category: ProblemCategory;
  service: CorrectionServiceType;
  displayName: string;
  ruleSettingsId: string | null;
  confidence: ConfidenceLevel;
  message: string;
}

// Problem highlighting
export interface ProblemHighlighting {
  always: TextRange;
  onHover: TextRange;
}

// Context object for problem fixes
export interface Context {
  text: string;
}

// Skip object (represented as ... in UI)
export interface Skip {
  // Marker interface for skipped content
}

// Change object for problem fixes
export interface Change {
  range: TextRange;
  text: string;
}

// Union type for fix parts
export type FixPart = Context | Skip | Change;

// Action suggestion for custom actions
export interface ActionSuggestion {
  parameterId: string;
  parameterDisplayName: string;
  suggestedValue: any;
}

// Problem fix
export interface ProblemFix {
  parts: FixPart[];
  batchId?: string;
  experimental?: any;
  condition?: any;
  actionSuggestion?: ActionSuggestion[];
}

// Problem object
export interface Problem {
  info: KindInfo;
  highlighting: ProblemHighlighting;
  fixes: ProblemFix[];
}

// Sentence with problems (response object)
export interface SentenceWithProblems {
  sentence: string;
  language: Language;
  problems: Problem[];
}

// Request payload
export interface GrazieRequest {
  sentences: string[];
  lang: Language;
  services?: CorrectionServiceType[];
}

// Response payload
export interface GrazieResponse {
  results: SentenceWithProblems[];
}

// API configuration
export interface GrazieConfig {
  baseUrl?: string;
  token: string;
  agent?: {
    name: string;
    version: string;
  };
}

