import { Agent } from './Agent';
import { modelConfig } from '../config/modelConfig';
import { PipelineContext, Asset } from '../types';

/**
 * COPY AGENT — generates platform-specific copy variants within approved tone/claims.
 * Reads the same creative brief and fans it out across platforms; each platform's
 * character limits and tone rules live in PLATFORM_RULES rather than in the prompt
 * itself, so adding a new platform doesn't require touching the agent's core logic.
 */
const PLATFORM_RULES: Record<string, string> = {
  instagram: 'Caption, max 2200 characters, can include line breaks and light emoji use.',
  x: 'Max 280 characters, punchy, no more than one hashtag.',
  story: 'Single short line, under 12 words, designed for a full-screen overlay.',
};

export class CopyAgent extends Agent<Asset[]> {
  readonly name = 'CopyAgent';
  get model() { return modelConfig.copy; }

  protected async execute(context: PipelineContext): Promise<Asset[]> {
    const brief = context.creativeBrief!;
    const assets: Asset[] = [];

    for (const [platform, rule] of Object.entries(PLATFORM_RULES)) {
      const content = await this.ollama.generate({
        model: this.model!,
        system: `You are the Copy Agent. Write ONLY the copy text, nothing else. Platform rule: ${rule}`,
        prompt: `Brand: ${context.brand.name}. Big idea: ${brief.bigIdea}. Message: ${brief.message}. CTA: ${brief.cta}.`,
      });

      assets.push({
        assetId: '',
        campaignId: '',
        platform,
        assetType: 'copy',
        content: content.trim(),
        governanceStatus: 'PENDING',
      });
    }
    return assets;
  }
}
