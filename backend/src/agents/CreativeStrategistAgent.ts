import { Agent } from './Agent';
import { modelConfig } from '../config/modelConfig';
import { PipelineContext, CreativeBrief } from '../types';

/**
 * CREATIVE STRATEGIST AGENT — converts a scored opportunity into a creative brief:
 * insight, tension, big idea, message, CTA. This is brand-agnostic — the same
 * prompt template works whether the brand is a deodorant or a data-centre SaaS.
 */
export class CreativeStrategistAgent extends Agent<CreativeBrief> {
  readonly name = 'CreativeStrategistAgent';
  get model() { return modelConfig.reasoning; }

  protected async execute(context: PipelineContext): Promise<CreativeBrief> {
    const brief = await this.ollama.generateJson<CreativeBrief>({
      model: this.model!,
      system:
        'You are the Creative Strategist Agent. Turn a brand opportunity into a tight creative brief. ' +
        'Respond ONLY as JSON: {"insight": "...", "tension": "...", "bigIdea": "...", "message": "...", "cta": "..."}',
      prompt: `Brand: ${context.brand.name}. Opportunity: ${JSON.stringify(context.opportunity)}. Evidence: ${JSON.stringify(context.evidencePack)}`,
    });
    context.creativeBrief = brief;
    return brief;
  }
}
