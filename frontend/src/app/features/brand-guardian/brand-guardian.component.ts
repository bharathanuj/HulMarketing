import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Campaign } from '../../core/models/domain.model';
import { PipelineStepperComponent } from '../../shared/pipeline-stepper/pipeline-stepper.component';

import { environment } from '../../../environments/environment';

const API_BASE = environment.apiBase;

/**
 * SCREEN 4 — BRAND GUARDIAN. Shows cleared vs flagged assets with reasoning,
 * fetched from the same campaign the Brand Guardian agent already ran on
 * during generation (GET /api/campaigns/by-opportunity/:id).
 */
@Component({
  selector: 'next-brand-guardian',
  standalone: true,
  imports: [CommonModule, RouterLink, PipelineStepperComponent],
  templateUrl: './brand-guardian.component.html',
  styleUrl: './brand-guardian.component.scss',
})
export class BrandGuardianComponent implements OnInit {
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
