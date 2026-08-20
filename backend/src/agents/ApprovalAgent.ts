import { Agent } from './Agent';
import { PipelineContext } from '../types';

interface ApprovalPacket {
  opportunityId: string;
  summary: string;
  clearedAssetCount: number;
  flaggedAssetCount: number;
  recommendedAction: string;
}

/**
 * APPROVAL AGENT — builds the human approval packet, records the eventual
 * decision, routes exceptions, and preserves audit history. This agent never
 * itself approves anything — its only job is to make the human's decision fast
 * and well-informed, per the "human accountability is mandatory" principle.
 */
export class ApprovalAgent extends Agent<ApprovalPacket> {
  readonly name = 'ApprovalAgent';
  readonly model = undefined;

  protected async execute(context: PipelineContext): Promise<ApprovalPacket> {
    const assets = context.campaign?.assets ?? [];
    const cleared = assets.filter((a) => a.governanceStatus === 'CLEARED').length;
    const flagged = assets.filter((a) => a.governanceStatus === 'FLAGGED').length;

    return {
      opportunityId: context.opportunity!.opportunityId,
      summary: `${cleared} of ${assets.length} assets cleared. Opportunity score ${context.opportunity!.opportunityScore}/100, autonomy ${context.opportunity!.autonomyLevel}.`,
      clearedAssetCount: cleared,
      flaggedAssetCount: flagged,
      recommendedAction: flagged > 0 ? 'Review flagged assets before publish' : 'Ready for approval',
    };
  }
}
