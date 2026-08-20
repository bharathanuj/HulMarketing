import { Agent } from './Agent';
import { modelConfig } from '../config/modelConfig';
import { PipelineContext, Asset } from '../types';

/**
 * VISUAL AGENT — assembles visual concept briefs from approved product/brand assets.
 * The prototype does not call an image-generation model directly (kept out of scope
 * per the blueprint's "hybrid" recommendation); it produces a structured visual
 * direction that a designer or an image-gen service (e.g. Adobe Firefly) consumes.
 */
export class VisualAgent extends Agent<Asset> {
  readonly name = 'VisualAgent';
  get model() { return modelConfig.vision; } // used only if a reference image is attached

  protected async execute(context: PipelineContext): Promise<Asset> {
    const brief = context.creativeBrief!;
    const direction = await this.ollama.generate({
      model: modelConfig.reasoning,
      system: 'You are the Visual Agent. Describe a visual direction in 2-3 sentences: composition, mood, approved asset references.',
      prompt: `Brand: ${context.brand.name}. Big idea: ${brief.bigIdea}. Tension: ${brief.tension}.`,
    });

    return {
      assetId: '',
      campaignId: '',
      platform: 'visual-direction',
      assetType: 'image',
      content: direction.trim(),
      governanceStatus: 'PENDING',
    };
  }
}
