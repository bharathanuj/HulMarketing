import { Routes } from '@angular/router';
import { LivePulseComponent } from './features/live-pulse/live-pulse.component';
import { OpportunityCardComponent } from './features/opportunity-card/opportunity-card.component';
import { CampaignBuilderComponent } from './features/campaign-builder/campaign-builder.component';
import { BrandGuardianComponent } from './features/brand-guardian/brand-guardian.component';
import { LaunchLearnComponent } from './features/launch-learn/launch-learn.component';
import { OpportunitiesListComponent } from './features/opportunities-list/opportunities-list.component';
import { CampaignsListComponent } from './features/campaigns-list/campaigns-list.component';
import { GovernanceListComponent } from './features/governance-list/governance-list.component';
import { LearningListComponent } from './features/learning-list/learning-list.component';
import { DocumentsComponent } from './features/documents/documents.component';
import { AiModelsComponent } from './features/ai-models/ai-models.component';

// One route per prototype screen from the blueprint (section 14):
// Live Pulse -> Opportunity Card -> Campaign Builder -> Brand Guardian -> Launch + Learn
// Each detail screen also has a list/index screen so the nav rail links go somewhere real.
export const routes: Routes = [
  { path: '', redirectTo: 'live-pulse', pathMatch: 'full' },
  { path: 'live-pulse', component: LivePulseComponent },
  { path: 'opportunities', component: OpportunitiesListComponent },
  { path: 'opportunity/:id', component: OpportunityCardComponent },
  { path: 'campaigns', component: CampaignsListComponent },
  { path: 'campaign/:id', component: CampaignBuilderComponent },
  { path: 'governance', component: GovernanceListComponent },
  { path: 'guardian/:id', component: BrandGuardianComponent },
  { path: 'learning', component: LearningListComponent },
  { path: 'launch/:id', component: LaunchLearnComponent },
  { path: 'documents', component: DocumentsComponent },
  { path: 'models', component: AiModelsComponent },
];
