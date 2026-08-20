import { Agent } from './Agent';
import { PipelineContext } from '../types';

interface ActivationResult {
  status: 'PUBLISHED' | 'SIMULATED';
  channels: string[];
  publishedAt: string;
}

/**
 * ACTIVATION AGENT — packages approved assets for selected channels and invokes
 * controlled publishing workflows. In the prototype this is mocked (per the
 * blueprint's hybrid-demo recommendation) — swap simulate() for real channel
 * API calls (Sprinklr, Meta, X) in production, behind the same interface.
 */
export class ActivationAgent extends Agent<ActivationResult> {
  readonly name = 'ActivationAgent';
  readonly model = undefined;

  protected async execute(context: PipelineContext): Promise<ActivationResult> {
    const clearedAssets = (context.campaign?.assets ?? []).filter((a) => a.governanceStatus === 'CLEARED');
    return {
      status: 'SIMULATED',
      channels: clearedAssets.map((a) => a.platform),
      publishedAt: new Date().toISOString(),
    };
  }
}
