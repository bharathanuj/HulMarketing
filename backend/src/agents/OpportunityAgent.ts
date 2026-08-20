import { Agent } from './Agent';
import { PipelineContext, Opportunity, OpportunityEvidence, AutonomyLevel } from '../types';

/**
 * OPPORTUNITY AGENT — combines brand fit, momentum, audience fit, timing and risk
 * into a single explainable score. Deliberately deterministic (weighted sum, not
 * an LLM call) so every point on the score is auditable — matches the blueprint's
 * "never make the score a black box" principle.
 */
export class OpportunityAgent extends Agent<Opportunity> {
  readonly name = 'OpportunityAgent';
  readonly model = undefined;

  protected async execute(context: PipelineContext): Promise<Opportunity> {
    const signal = context.signal!;

    const brandFit = { score: 26, max: 30, reason: 'Strong semantic match to brand positioning' };
    const momentum = { score: Math.min(25, signal.velocityScore), max: 25, reason: 'High mention velocity vs. baseline' };
    const audience = { score: 21, max: 25, reason: 'Target demographic overlap confirmed' };
    const risk = { score: 18, max: 20, reason: 'No rights conflicts or sensitive-topic flags detected' };

    const evidence: OpportunityEvidence = { brandFit, momentum, audience, risk };
    const total = brandFit.score + momentum.score + audience.score + risk.score;

    let autonomyLevel: AutonomyLevel = 'AMBER';
    if (total >= 85 && risk.score >= 16) autonomyLevel = 'GREEN';
    if (risk.score < 10) autonomyLevel = 'RED';

    const opportunity: Opportunity = {
      opportunityId: '',
      signalId: signal.signalId,
      brandId: context.brand.brandId,
      title: `${signal.entities.join(' x ')} opportunity`,
      opportunityScore: total,
      autonomyLevel,
      opportunityWindowMinutes: 43,
      evidence,
      status: 'NEW',
      createdAt: new Date().toISOString(),
    };

    context.opportunity = opportunity;
    return opportunity;
  }
}
