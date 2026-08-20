// PROJECT NEXT — shared domain types
// These mirror the SQL schema and are the contract between agents, the API, and Angular.

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

export interface OpportunityEvidence {
  brandFit: { score: number; max: number; reason: string };
  momentum: { score: number; max: number; reason: string };
  audience: { score: number; max: number; reason: string };
  risk: { score: number; max: number; reason: string };
}

export type AutonomyLevel = 'GREEN' | 'AMBER' | 'RED';

export interface Opportunity {
  opportunityId: string;
  signalId: string;
  brandId: string;
  title: string;
  opportunityScore: number;
  autonomyLevel: AutonomyLevel;
  opportunityWindowMinutes: number;
  evidence: OpportunityEvidence;
  status: 'NEW' | 'REVIEW' | 'ACTIONED' | 'LOGGED' | 'EXPIRED';
  createdAt: string;
}

export interface CreativeBrief {
  insight: string;
  tension: string;
  bigIdea: string;
  message: string;
  cta: string;
}

export interface Asset {
  assetId: string;
  campaignId: string;
  platform: string;
  assetType: 'copy' | 'image' | 'video';
  content: string;
  governanceStatus: 'PENDING' | 'CLEARED' | 'FLAGGED' | 'REVISED';
  governanceNotes?: string;
}

export interface Campaign {
  campaignId: string;
  opportunityId: string;
  bigIdea: string;
  headline: string;
  brief: CreativeBrief;
  assets: Asset[];
}

// Every agent produces this envelope so the orchestrator and the audit log
// can treat all 12 agents uniformly, regardless of what each one does internally.
export interface AgentResult<T> {
  agentName: string;
  success: boolean;
  data: T;
  modelUsed?: string;
  durationMs: number;
  notes?: string;
}

// The object that flows through the whole pipeline, enriched at each stage.
export interface PipelineContext {
  brand: Brand;
  signal?: Signal;
  evidencePack?: Record<string, unknown>;
  opportunity?: Opportunity;
  creativeBrief?: CreativeBrief;
  campaign?: Campaign;
  log: AgentResult<unknown>[];
}
