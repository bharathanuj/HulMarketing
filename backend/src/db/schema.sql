-- PROJECT NEXT — SQL schema
-- Written for PostgreSQL. For SQL Server: UUID -> UNIQUEIDENTIFIER, JSONB -> NVARCHAR(MAX), now() -> GETDATE().

CREATE TABLE brands (
    brand_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(120) NOT NULL,
    category        VARCHAR(120),
    market          VARCHAR(80),
    created_at      TIMESTAMP NOT NULL DEFAULT now()
);

-- Brand ontology / RAG source documents (positioning, tone, claims, past campaigns, etc.)
CREATE TABLE brand_knowledge (
    knowledge_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id        UUID NOT NULL REFERENCES brands(brand_id),
    doc_type        VARCHAR(60) NOT NULL,   -- positioning | tone | claims | forbidden_claims | audience | campaign_history | legal
    market          VARCHAR(80),
    language        VARCHAR(20),
    content         TEXT NOT NULL,
    valid_from      DATE,
    valid_to        DATE,
    source_ref      VARCHAR(255),
    created_at      TIMESTAMP NOT NULL DEFAULT now()
);

-- Raw normalized signals coming out of the Signal Agent
CREATE TABLE signals (
    signal_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source          VARCHAR(60) NOT NULL,   -- social | news | search | sports | consumer | competitor
    raw_payload     JSONB NOT NULL,
    entities        JSONB,                  -- brands/objects/people/logos detected
    geography       VARCHAR(80),
    language        VARCHAR(20),
    velocity_score  NUMERIC(6,2),
    confidence      NUMERIC(5,4),
    detected_at     TIMESTAMP NOT NULL DEFAULT now()
);

-- Scored opportunities produced by the Opportunity Agent
CREATE TABLE opportunities (
    opportunity_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    signal_id           UUID REFERENCES signals(signal_id),
    brand_id            UUID REFERENCES brands(brand_id),
    title               VARCHAR(200),
    brand_fit_score     NUMERIC(5,2),
    momentum_score      NUMERIC(5,2),
    audience_score      NUMERIC(5,2),
    risk_score          NUMERIC(5,2),
    opportunity_score   NUMERIC(5,2),
    autonomy_level      VARCHAR(10) NOT NULL DEFAULT 'AMBER', -- GREEN | AMBER | RED
    opportunity_window_minutes INT,
    evidence            JSONB,              -- component-level explainability shown in the UI
    status              VARCHAR(30) NOT NULL DEFAULT 'NEW',   -- NEW | REVIEW | ACTIONED | LOGGED | EXPIRED
    created_at          TIMESTAMP NOT NULL DEFAULT now()
);

-- Generated creative campaigns tied to an opportunity
CREATE TABLE campaigns (
    campaign_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id  UUID NOT NULL REFERENCES opportunities(opportunity_id),
    big_idea        TEXT,
    headline        TEXT,
    creative_brief  JSONB,
    created_at      TIMESTAMP NOT NULL DEFAULT now()
);

-- Individual generated assets (per platform/variant) with governance status
CREATE TABLE assets (
    asset_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id     UUID NOT NULL REFERENCES campaigns(campaign_id),
    platform        VARCHAR(40),            -- instagram | reel | story | x | localized_XX
    asset_type      VARCHAR(20),            -- copy | image | video
    content         TEXT,
    governance_status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING | CLEARED | FLAGGED | REVISED
    governance_notes TEXT,
    provenance      JSONB,                  -- which agent/model produced it, source grounding refs
    created_at      TIMESTAMP NOT NULL DEFAULT now()
);

-- Human approval / audit trail (Approval Agent)
CREATE TABLE approvals (
    approval_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id  UUID NOT NULL REFERENCES opportunities(opportunity_id),
    reviewer_name   VARCHAR(120),
    decision        VARCHAR(20),            -- APPROVED | EDITED | REJECTED
    notes           TEXT,
    decided_at      TIMESTAMP NOT NULL DEFAULT now()
);

-- Every agent action, for governance/audit (least-privilege + full traceability)
CREATE TABLE agent_activity_log (
    log_id          BIGSERIAL PRIMARY KEY,
    agent_name      VARCHAR(60) NOT NULL,
    opportunity_id  UUID REFERENCES opportunities(opportunity_id),
    action          VARCHAR(60),
    input_summary   JSONB,
    output_summary  JSONB,
    model_used      VARCHAR(60),
    duration_ms     INT,
    created_at      TIMESTAMP NOT NULL DEFAULT now()
);

-- Post-activation performance, feeding the Learning Agent's feedback loop
CREATE TABLE learning_outcomes (
    outcome_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id  UUID NOT NULL REFERENCES opportunities(opportunity_id),
    engagement_rate NUMERIC(6,4),
    sentiment_delta NUMERIC(6,4),
    recommendation_accepted BOOLEAN,
    notes           TEXT,
    recorded_at     TIMESTAMP NOT NULL DEFAULT now()
);

-- Uploaded company PDFs. Text is extracted on upload and stored as a
-- brand_knowledge row so agents (e.g. Brand Guardian, Brand Fit) can ground on
-- it like any other knowledge source; the raw file stays here for viewing/download.
CREATE TABLE documents (
    document_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id        UUID NOT NULL REFERENCES brands(brand_id),
    knowledge_id    UUID REFERENCES brand_knowledge(knowledge_id),
    title           VARCHAR(255) NOT NULL,
    filename        VARCHAR(255) NOT NULL,
    doc_type        VARCHAR(60) NOT NULL DEFAULT 'company_doc',
    file_size       INT NOT NULL,
    file_data       BYTEA NOT NULL,
    extracted_text  TEXT,                   -- full raw text, for the "view full extract" panel only
    summary         TEXT,                   -- LLM-generated key learnings, shown on the Documents tab
                                             -- AND what actually gets fed to agents as brand_knowledge.content —
                                             -- concise beats a raw multi-page dump in every prompt.
    uploaded_at     TIMESTAMP NOT NULL DEFAULT now()
);

-- Registry of every AI model, plugin, and wrapper available in the company —
-- not just LLMs. category='llm' rows feed the agent pipeline directly: exactly
-- one row per role may be active at a time, and that row is what OllamaService
-- calls next, with no server restart needed (see backend/src/config/modelConfig.ts).
-- category='plugin'|'wrapper'|'tool' rows are a reference registry (e.g. GitHub
-- Copilot, an internal ChatGPT wrapper) — informational, not wired into the pipeline.
CREATE TABLE ai_models (
    model_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(120) NOT NULL,
    provider        VARCHAR(60) NOT NULL DEFAULT 'ollama',
    model_ref       VARCHAR(120) NOT NULL,  -- id passed to OllamaService, e.g. gpt-oss:120b
    role            VARCHAR(20),            -- reasoning | copy | vision — only meaningful for category='llm'
    category        VARCHAR(20) NOT NULL DEFAULT 'llm', -- llm | plugin | wrapper | tool
    description     TEXT,
    link            VARCHAR(255),
    is_active       BOOLEAN NOT NULL DEFAULT false,
    notes           TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_signals_source_time ON signals(source, detected_at DESC);
CREATE INDEX idx_opportunities_status ON opportunities(status, opportunity_score DESC);
CREATE INDEX idx_knowledge_brand ON brand_knowledge(brand_id, doc_type);
CREATE INDEX idx_documents_brand ON documents(brand_id);
CREATE UNIQUE INDEX idx_ai_models_active_per_role ON ai_models(role) WHERE is_active AND category = 'llm';
