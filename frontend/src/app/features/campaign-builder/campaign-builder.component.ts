import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Campaign } from '../../core/models/domain.model';
import { PipelineStepperComponent } from '../../shared/pipeline-stepper/pipeline-stepper.component';

import { environment } from '../../../environments/environment';

const API_BASE = environment.apiBase;

/**
 * SCREEN 3 — CAMPAIGN BUILDER. Shows Copy/Visual Agent output per platform,
 * fetched live from GET /api/campaigns/by-opportunity/:id (populated by the
 * "Generate campaign" action on the Opportunity Card).
 */
@Component({
  selector: 'next-campaign-builder',
  standalone: true,
  imports: [CommonModule, RouterLink, PipelineStepperComponent],
  templateUrl: './campaign-builder.component.html',
  styleUrl: './campaign-builder.component.scss',
})
export class CampaignBuilderComponent implements OnInit {
  opportunityId: string;
  campaign: Campaign | null = null;
  loading = true;

  constructor(route: ActivatedRoute, private readonly http: HttpClient) {
    this.opportunityId = route.snapshot.paramMap.get('id') ?? '';
  }

  ngOnInit(): void {
    this.http.get<Campaign>(`${API_BASE}/campaigns/by-opportunity/${this.opportunityId}`).subscribe({
      next: (data) => { this.campaign = data; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }
}
