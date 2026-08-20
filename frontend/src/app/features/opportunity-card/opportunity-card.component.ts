import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { OpportunityService } from '../../core/services/opportunity.service';
import { Opportunity } from '../../core/models/domain.model';
import { PipelineStepperComponent } from '../../shared/pipeline-stepper/pipeline-stepper.component';

import { environment } from '../../../environments/environment';

const API_BASE = environment.apiBase;

/**
 * SCREEN 2 — OPPORTUNITY CARD. Full evidence card with explainable component
 * scores, fetched live from GET /api/opportunities/:id. "Generate Campaign"
 * triggers CREATE -> GOVERN server-side and routes to the Campaign Builder.
 */
@Component({
  selector: 'next-opportunity-card',
  standalone: true,
  imports: [CommonModule, RouterLink, PipelineStepperComponent],
  templateUrl: './opportunity-card.component.html',
  styleUrl: './opportunity-card.component.scss',
})
export class OpportunityCardComponent implements OnInit {
  opportunityId: string;
  opportunity: Opportunity | null = null;
  loading = true;
  generating = false;
  errorMessage = '';

  constructor(
    route: ActivatedRoute,
    private readonly opportunityService: OpportunityService,
    private readonly http: HttpClient,
    private readonly router: Router
  ) {
    this.opportunityId = route.snapshot.paramMap.get('id') ?? '';
  }

  ngOnInit(): void {
    this.opportunityService.get(this.opportunityId).subscribe({
      next: (data) => { this.opportunity = data; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  get components() {
    if (!this.opportunity) return [];
    const e = this.opportunity.evidence;
    return [
      { label: 'Brand fit', ...e.brandFit },
      { label: 'Cultural momentum', ...e.momentum },
      { label: 'Audience relevance', ...e.audience },
      { label: 'Risk-adjusted', ...e.risk },
    ];
  }

  generateCampaign(): void {
    this.generating = true;
    this.errorMessage = '';
    this.http.post(`${API_BASE}/campaigns/generate`, { opportunityId: this.opportunityId }).subscribe({
      next: () => {
        this.generating = false;
        this.router.navigate(['/campaign', this.opportunityId]);
      },
      error: (err) => {
        this.generating = false;
        this.errorMessage = err?.error?.error || 'Campaign generation failed';
      },
    });
  }
}
