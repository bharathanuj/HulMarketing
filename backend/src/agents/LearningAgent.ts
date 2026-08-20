import { Agent } from './Agent';
import { modelConfig } from '../config/modelConfig';
import { PipelineContext } from '../types';

interface LearningSummary {
  whatWorked: string;
  recommendationForNextTime: string;
}

/**
 * LEARNING AGENT — measures performance, compares against benchmarks, and feeds
 * validated learnings back into future scoring. It NEVER changes brand policy
 * autonomously (per governance rules) — it only proposes updates to scoring
 * weights/benchmarks, which a human owner then reviews and applies.
 */
export class LearningAgent extends Agent<LearningSummary> {
  readonly name = 'LearningAgent';
  get model() { return modelConfig.reasoning; }

  protected async execute(context: PipelineContext): Promise<LearningSummary> {
    const summary = await this.ollama.generateJson<LearningSummary>({
      model: this.model!,
      system: 'You are the Learning Agent. Summarize what worked and one concrete recommendation. Respond ONLY as JSON: {"whatWorked": "...", "recommendationForNextTime": "..."}',
      prompt: `Opportunity: ${JSON.stringify(context.opportunity)}. Campaign: ${JSON.stringify(context.campaign)}.`,
    });
    return summary;
  }
}
