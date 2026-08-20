import { OllamaService } from '../services/OllamaService';
import { SignalAgent } from '../agents/SignalAgent';
import { ContextAgent } from '../agents/ContextAgent';
import { BrandFitAgent } from '../agents/BrandFitAgent';
import { OpportunityAgent } from '../agents/OpportunityAgent';
import { CreativeStrategistAgent } from '../agents/CreativeStrategistAgent';
import { CopyAgent } from '../agents/CopyAgent';
import { VisualAgent } from '../agents/VisualAgent';
import { LocalizationAgent } from '../agents/LocalizationAgent';
import { BrandGuardianAgent } from '../agents/BrandGuardianAgent';
import { ApprovalAgent } from '../agents/ApprovalAgent';
import { ActivationAgent } from '../agents/ActivationAgent';
import { LearningAgent } from '../agents/LearningAgent';
import { Brand, PipelineContext, Signal } from '../types';

export interface OrchestratorDependencies {
  brandKnowledge: string[]; // approved brand knowledge snippets, pulled from SQL (RAG)
  forbiddenClaims: string[];
  targetMarkets: string[];
}

/**
 * Design pattern: Pipeline / Chain of Responsibility.
 * The orchestrator owns NO business logic itself — it only sequences agents and
 * short-circuits on the risk gates (RED autonomy or a GOVERN-stage flag stops
 * automatic progression and waits for a human). This mirrors "5.3 What happens
 * inside one signal" from the blueprint, generalized to any brand.
 */
export class AgentOrchestrator {
  private readonly ollama = new OllamaService();

  constructor(private readonly deps: OrchestratorDependencies) {}

  /** Runs SENSE -> UNDERSTAND -> DECIDE. Stops here if the opportunity doesn't clear the action threshold. */
  async senseUnderstandDecide(brand: Brand, rawSignal: Signal): Promise<PipelineContext> {
    const context: PipelineContext = { brand, signal: rawSignal, log: [] };

    await new SignalAgent(this.ollama).run(context);
    await new ContextAgent(this.ollama).run(context);
    const brandFit = await new BrandFitAgent(this.ollama, this.deps.brandKnowledge).run(context);
    await new OpportunityAgent(this.ollama).run(context);

    // Fold the LLM-derived brand-fit reasoning into the deterministic evidence record.
    if (context.opportunity) {
      context.opportunity.evidence.brandFit.reason = brandFit.data.reason;
    }
    return context;
  }

  /** Runs CREATE -> GOVERN. Only called for AMBER/GREEN opportunities (RED stops before this). */
  async createAndGovern(context: PipelineContext): Promise<PipelineContext> {
    if (context.opportunity?.autonomyLevel === 'RED') {
      throw new Error('RED autonomy level: creative generation blocked, routed to mandatory specialist review.');
    }

    await new CreativeStrategistAgent(this.ollama).run(context);
    const copyResult = await new CopyAgent(this.ollama).run(context);
    const visualResult = await new VisualAgent(this.ollama).run(context);

    context.campaign = {
      campaignId: '',
      opportunityId: context.opportunity!.opportunityId,
      bigIdea: context.creativeBrief!.bigIdea,
      headline: context.creativeBrief!.message,
      brief: context.creativeBrief!,
      assets: [...copyResult.data, visualResult.data],
    };

    if (this.deps.targetMarkets.length > 0) {
      const localized = await new LocalizationAgent(this.ollama, this.deps.targetMarkets).run(context);
      context.campaign.assets.push(...localized.data);
    }

    const guarded = await new BrandGuardianAgent(this.ollama, this.deps.forbiddenClaims).run(context);
    context.campaign.assets = guarded.data;

    return context;
  }

  /** Builds the human approval packet. Publishing only ever happens after a human decision (see routes/approvals.ts). */
  async prepareApproval(context: PipelineContext) {
    return new ApprovalAgent(this.ollama).run(context);
  }

  /** Called only after a human has approved via the API. */
  async activate(context: PipelineContext) {
    return new ActivationAgent(this.ollama).run(context);
  }

  /** Called after performance data comes back in, to close the loop. */
  async learn(context: PipelineContext) {
    return new LearningAgent(this.ollama).run(context);
  }
}
