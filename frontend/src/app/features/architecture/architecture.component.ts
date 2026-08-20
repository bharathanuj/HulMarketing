import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface StackItem {
  layer: string;
  tech: string;
  detail: string;
}

interface PipelineStage {
  stage: string;
  agents: string;
  model: string;
  summary: string;
  detail: string;
}

interface TableInfo {
  name: string;
  purpose: string;
}

/**
 * ARCHITECTURE PAGE. Static reference page, no API calls — explains what the
 * system is and how a signal turns into a governed, published campaign, for
 * readers who have never seen the codebase (reviewers, stakeholders, new devs).
 */
@Component({
  selector: 'next-architecture',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './architecture.component.html',
  styleUrl: './architecture.component.scss',
})
export class ArchitectureComponent {
  readonly stack: StackItem[] = [
    { layer: 'Frontend', tech: 'Angular 18 (standalone components)', detail: 'One route per screen, deployed as a static build on Vercel.' },
    { layer: 'Backend', tech: 'Node.js + TypeScript on Express', detail: 'REST API and a Socket.IO channel, deployed on Render.' },
    { layer: 'Database', tech: 'PostgreSQL', detail: 'One brand-agnostic schema — brands and their knowledge are rows, not code.' },
    { layer: 'AI inference', tech: 'Ollama Cloud', detail: 'Hosted LLMs called through one shared OllamaService — no local GPU needed.' },
    { layer: 'Realtime', tech: 'Socket.IO', detail: 'Pushes live signal/opportunity updates to the UI instead of polling.' },
  ];

  readonly pipeline: PipelineStage[] = [
    {
      stage: 'SENSE',
      agents: 'Signal Agent',
      model: 'Deterministic — no LLM',
      summary: 'Takes a raw event and normalizes it.',
      detail: 'A signal comes in from social, news, search, sports, consumer, or competitor sources — either a real feed or, in this prototype, a preset/manual entry on the Live Pulse screen. This agent normalizes it into one shape: source, entities involved, geography, language, velocity score, confidence.',
    },
    {
      stage: 'UNDERSTAND',
      agents: 'Context Agent, Brand Fit Agent',
      model: 'reasoning model',
      summary: 'Explains what happened and whether it fits the brand.',
      detail: 'The Context Agent builds a short evidence pack: what happened, who is involved, why it might matter. The Brand Fit Agent then retrieves the brand’s own positioning, tone, and claims from brand_knowledge (retrieval-augmented generation, not a generic LLM opinion) and scores how well the moment fits that specific brand.',
    },
    {
      stage: 'DECIDE',
      agents: 'Opportunity Agent',
      model: 'Deterministic — no LLM',
      summary: 'Turns four scores into one go/no-go decision.',
      detail: 'Combines brand fit, momentum, audience fit, and risk into a single opportunity score, sets a time window before the moment goes stale, and assigns an autonomy level: GREEN, AMBER, or RED. This is deliberately deterministic, not model output — the score a reviewer sees has to be explainable and reproducible.',
    },
    {
      stage: 'CREATE',
      agents: 'Creative Strategist, Copy, Visual, Localization Agents',
      model: 'reasoning / copy / vision models',
      summary: 'Drafts the campaign — brief, copy, visuals, localized variants.',
      detail: 'Only runs for AMBER or GREEN opportunities (RED stops here, see below). The Creative Strategist turns the opportunity into a brief (insight, tension, big idea, message, CTA). Copy fans that brief out into platform-specific variants. Visual assembles a visual-direction brief. Localization adapts the result to each target market and language.',
    },
    {
      stage: 'GOVERN',
      agents: 'Brand Guardian',
      model: 'reasoning model',
      summary: 'Checks every asset before a human ever sees it.',
      detail: 'Reviews every generated asset against brand voice, approved claims, rights, safety, and cultural fit, using the same brand_knowledge plus an explicit list of forbidden claims. Each asset comes out CLEARED, FLAGGED, or REVISED, with a written reason.',
    },
    {
      stage: 'APPROVE',
      agents: 'Approval Agent + a human reviewer',
      model: 'Deterministic — no LLM',
      summary: 'Nothing goes live without a person signing off.',
      detail: 'Packages the opportunity, the creative, and every governance note into one approval packet. A named reviewer records APPROVED, EDITED, or REJECTED on the Launch + Learn screen. This is a hard gate in the code, not a UI suggestion — activation literally cannot run before this record exists.',
    },
    {
      stage: 'ACTIVATE',
      agents: 'Activation Agent',
      model: 'Deterministic — no LLM',
      summary: 'Publishes to the approved channels.',
      detail: 'In this prototype, activation is simulated rather than calling live platform APIs — same interface, so Sprinklr/Meta/X calls can be dropped in later without touching the rest of the pipeline.',
    },
    {
      stage: 'LEARN',
      agents: 'Learning Agent',
      model: 'reasoning model',
      summary: 'Feeds real results back into the system.',
      detail: 'Once performance data comes in (engagement rate, sentiment shift, whether the recommendation was accepted), this agent summarizes what worked, closing the loop so the next Brand Fit and Opportunity scoring has real history to draw on.',
    },
  ];

  readonly tables: TableInfo[] = [
    { name: 'brands', purpose: 'One row per brand. Adding a brand is a data operation, not a code change.' },
    { name: 'brand_knowledge', purpose: 'Positioning, tone, claims, forbidden claims, audience, campaign history — the RAG source for Brand Fit and Brand Guardian.' },
    { name: 'signals', purpose: 'Every raw signal the Signal Agent has normalized.' },
    { name: 'opportunities', purpose: 'Scored opportunities, with the full evidence breakdown shown on the Opportunity Card screen.' },
    { name: 'campaigns / assets', purpose: 'The generated creative and its per-asset governance status.' },
    { name: 'approvals', purpose: 'The human decision record — reviewer, decision, notes, timestamp.' },
    { name: 'agent_activity_log', purpose: 'Every agent run, what it used, how long it took — the full audit trail.' },
    { name: 'learning_outcomes', purpose: 'Post-activation performance data feeding the Learning Agent.' },
    { name: 'documents', purpose: 'Uploaded company PDFs; extracted text is folded into brand_knowledge automatically.' },
    { name: 'ai_models', purpose: 'Registry of every model/plugin/tool in use; one active LLM per role, switchable with no restart.' },
  ];
}
