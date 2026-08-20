import { Agent } from './Agent';
import { modelConfig } from '../config/modelConfig';
import { PipelineContext, Asset } from '../types';

/**
 * LOCALIZATION AGENT — adapts copy/visual direction to market, language and
 * cultural context WITHOUT changing core brand meaning. Takes a list of target
 * markets so the same pipeline scales from one market to twenty.
 */
export class LocalizationAgent extends Agent<Asset[]> {
  readonly name = 'LocalizationAgent';
  get model() { return modelConfig.reasoning; }

  constructor(ollama: any, private readonly targetMarkets: string[]) {
    super(ollama);
  }

  protected async execute(context: PipelineContext): Promise<Asset[]> {
    const baseAsset = context.campaign?.assets.find((a) => a.assetType === 'copy');
    if (!baseAsset) return [];

    const localized: Asset[] = [];
    for (const market of this.targetMarkets) {
      const content = await this.ollama.generate({
        model: this.model!,
        system: `You are the Localization Agent. Adapt copy for ${market} without changing the core brand meaning or claims. Output ONLY the adapted copy.`,
        prompt: baseAsset.content,
      });
      localized.push({
        assetId: '',
        campaignId: baseAsset.campaignId,
        platform: `${baseAsset.platform}_${market}`,
        assetType: 'copy',
        content: content.trim(),
        governanceStatus: 'PENDING',
      });
    }
    return localized;
  }
}
