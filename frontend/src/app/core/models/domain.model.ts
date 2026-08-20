// Mirrors backend/src/types/index.ts — kept in sync manually for this prototype;
// in production, generate both from one OpenAPI/schema source of truth.

export interface Brand {
  brandId: string;
  name: string;
  category: string;
  market: string;
}

export interface Signal {
  signalId: string;
  source: 'social' | 'news' | 'search' | 'sports' | 'consumer' | 'competitor';
  rawPayload: Record<string, unknown>;
  entities: string[];
  geography: string;
  language: string;
  velocityScore: number;
  confidence: number;
  detectedAt: string;
}

export type AutonomyLevel = 'GREEN' | 'AMBER' | 'RED';

export interface OpportunityEvidenceItem {
  score: number;
  max: number;
  reason: string;
}

export interface Opportunity {
  opportunityId: string;
  brandId?: string;
  title: string;
  opportunityScore: number;
  autonomyLevel: AutonomyLevel;
  opportunityWindowMinutes: number;
  evidence: {
    brandFit: OpportunityEvidenceItem;
    momentum: OpportunityEvidenceItem;
    audience: OpportunityEvidenceItem;
    risk: OpportunityEvidenceItem;
  };
  status: string;
}

export interface Asset {
  assetId: string;
  platform: string;
  assetType: 'copy' | 'image' | 'video';
  content: string;
  governanceStatus: 'PENDING' | 'CLEARED' | 'FLAGGED' | 'REVISED';
  governanceNotes?: string;
}

export interface Campaign {
  campaignId: string;
  bigIdea: string;
  headline: string;
  assets: Asset[];
}

export interface CampaignListItem {
  campaignId: string;
  opportunityId: string;
  opportunityTitle: string;
  bigIdea: string;
  headline: string;
  createdAt: string;
}

export interface GovernanceAsset {
  assetId: string;
  campaignId: string;
  opportunityId: string;
  headline: string;
  platform: string;
  assetType: string;
  governanceStatus: 'PENDING' | 'CLEARED' | 'FLAGGED' | 'REVISED';
  governanceNotes: string | null;
  createdAt: string;
}

export interface LearningOutcome {
  outcomeId: string;
  opportunityId: string;
  opportunityTitle: string;
  engagementRate: number | null;
  sentimentDelta: number | null;
  recommendationAccepted: boolean | null;
  notes: string | null;
  recordedAt: string;
}

export interface CompanyDocument {
  documentId: string;
  title: string;
  filename: string;
  docType: string;
  fileSize: number;
  summary: string | null;
  brandId: string;
  brandName: string;
  uploadedAt: string;
}

export interface CompanyDocumentDetail extends CompanyDocument {
  extractedText: string | null;
}

export type ModelRole = 'reasoning' | 'copy' | 'vision';
export type ModelCategory = 'llm' | 'plugin' | 'wrapper' | 'tool';

export interface AiModel {
  modelId: string;
  name: string;
  provider: string;
  modelRef: string;
  role: ModelRole | null;
  category: ModelCategory;
  description: string | null;
  link: string | null;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
}
