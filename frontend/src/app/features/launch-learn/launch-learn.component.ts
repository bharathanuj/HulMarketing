import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { PipelineStepperComponent } from '../../shared/pipeline-stepper/pipeline-stepper.component';

import { environment } from '../../../environments/environment';

const API_BASE = environment.apiBase;

interface ActivationResult {
  status: string;
  channels: string[];
  publishedAt: string;
}

/**
 * SCREEN 5 — LAUNCH + LEARN. "Approve" POSTs to /api/approvals with decision
 * APPROVED, which triggers ActivationAgent server-side — the one hard
 * governance gate, publishing never happens without this human action.
 * "Record outcome" closes the loop via POST /api/learning.
 */
@Component({
  selector: 'next-launch-learn',
  standalone: true,
  imports: [CommonModule, FormsModule, PipelineStepperComponent],
  templateUrl: './launch-learn.component.html',
  styleUrl: './launch-learn.component.scss',
})
export class LaunchLearnComponent {
  opportunityId: string;
  reviewerName = '';
  approving = false;
  approved = false;
  activation: ActivationResult | null = null;
  approveError = '';

  engagementRate: number | null = null;
  sentimentDelta: number | null = null;
  recommendationAccepted = true;
  outcomeNotes = '';
  recordingOutcome = false;
  outcomeRecorded = false;
  learningSummary = '';

  constructor(route: ActivatedRoute, private readonly http: HttpClient) {
    this.opportunityId = route.snapshot.paramMap.get('id') ?? '';
  }

  approve(): void {
    if (!this.reviewerName) return;
    this.approving = true;
    this.approveError = '';
    this.http
      .post<{ status: string; activation?: ActivationResult }>(`${API_BASE}/approvals`, {
        opportunityId: this.opportunityId,
        reviewerName: this.reviewerName,
        decision: 'APPROVED',
      })
      .subscribe({
        next: (res) => {
          this.approving = false;
          this.approved = true;
          this.activation = res.activation ?? null;
        },
        error: (err) => {
          this.approving = false;
          this.approveError = err?.error?.error || 'Approval failed';
        },
      });
  }

  recordOutcome(): void {
    this.recordingOutcome = true;
    this.http
      .post<{ notes: string }>(`${API_BASE}/learning`, {
        opportunityId: this.opportunityId,
        engagementRate: this.engagementRate,
        sentimentDelta: this.sentimentDelta,
        recommendationAccepted: this.recommendationAccepted,
        notes: this.outcomeNotes || undefined,
      })
      .subscribe({
        next: (res) => {
          this.recordingOutcome = false;
          this.outcomeRecorded = true;
          this.learningSummary = res.notes;
        },
        error: () => { this.recordingOutcome = false; },
      });
  }
}
