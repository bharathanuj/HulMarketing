import { Agent } from './Agent';
import { PipelineContext } from '../types';
import { OllamaService } from '../services/OllamaService';
import { modelConfig } from '../config/modelConfig';

interface BrandFitResult {
  score: number; // 0-30
  reason: string;
}

/**
 * BRAND FIT AGENT — retrieves brand DNA (via RAG over brand_knowledge) and scores
 * semantic + strategic relevance of the signal against THIS brand. Works for any
 * brand/category, since it never hardcodes brand logic — it reads from the
 * brand_knowledge table passed in on the context.
 */
export class BrandFitAgent extends Agent<BrandFitResult> {
  readonly name = 'BrandFitAgent';
  get model() { return modelConfig.reasoning; }

  constructor(ollama: OllamaService, private readonly brandKnowledge: string[]) {
    super(ollama);
  }

  protected async execute(context: PipelineContext): Promise<BrandFitResult> {
    const result = await this.ollama.generateJson<BrandFitResult>({
      model: this.model!,
      system:
        'You are the Brand Fit Agent. Score how well a cultural moment fits a brand, from 0 to 30, ' +
        'using ONLY the approved brand knowledge provided — never invent brand facts. ' +
        'Respond ONLY as JSON: {"score": number, "reason": "..."}',
      prompt: `Brand: ${context.brand.name} (${context.brand.category}). Approved brand knowledge: ${this.brandKnowledge.join(' | ')}. Moment context: ${JSON.stringify(context.evidencePack)}`,
    });
    return result;
  }
}
