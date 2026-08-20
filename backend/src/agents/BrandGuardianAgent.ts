import { Agent } from './Agent';
import { modelConfig } from '../config/modelConfig';
import { PipelineContext, Asset } from '../types';

interface GuardianVerdict {
  status: 'CLEARED' | 'FLAGGED';
  notes: string;
  safeRevision?: string;
}

/**
 * BRAND GUARDIAN — checks brand voice, claims, rights, safety and cultural
 * sensitivity. Defense in depth: a deterministic forbidden-word check runs first
 * (cheap, reliable), then the LLM evaluator reasons about anything the rules
 * can't catch (tone, cultural nuance, implied claims).
 */
const FORBIDDEN_PATTERNS = [/\bclinically\s+proven\b/i, /\bguaranteed\s+cure\b/i];

export class BrandGuardianAgent extends Agent<Asset[]> {
  readonly name = 'BrandGuardian';
  get model() { return modelConfig.reasoning; }

  constructor(ollama: any, private readonly forbiddenClaims: string[]) {
    super(ollama);
  }

  protected async execute(context: PipelineContext): Promise<Asset[]> {
    const assets = context.campaign?.assets ?? [];
    const checked: Asset[] = [];

    for (const asset of assets) {
      const ruleHit = FORBIDDEN_PATTERNS.some((p) => p.test(asset.content));

      if (ruleHit) {
        checked.push({ ...asset, governanceStatus: 'FLAGGED', governanceNotes: 'Deterministic rule: forbidden claim pattern detected.' });
        continue;
      }

      const verdict = await this.ollama.generateJson<GuardianVerdict>({
        model: this.model!,
        system:
          'You are Brand Guardian. Check the copy against forbidden claims and cultural sensitivity. ' +
          'Respond ONLY as JSON: {"status": "CLEARED"|"FLAGGED", "notes": "...", "safeRevision": "... (only if FLAGGED)"}',
        prompt: `Forbidden claims list: ${this.forbiddenClaims.join(' | ')}. Copy to check: "${asset.content}"`,
      });

      checked.push({
        ...asset,
        governanceStatus: verdict.status,
        governanceNotes: verdict.notes,
        content: verdict.status === 'FLAGGED' && verdict.safeRevision ? verdict.safeRevision : asset.content,
      });
    }
    return checked;
  }
}
