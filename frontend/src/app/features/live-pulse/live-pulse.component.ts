import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { OpportunityService } from '../../core/services/opportunity.service';
import { BrandService } from '../../core/services/brand.service';
import { Opportunity, Brand, Signal } from '../../core/models/domain.model';

interface SignalPreset {
  label: string;
  source: Signal['source'];
  entities: string[];
  headline: string;
  geography: string;
  velocityScore: number;
  confidence: number;
}

const PRESETS: SignalPreset[] = [
  { label: 'Sports win', source: 'sports', entities: ['Local Team', 'Championship'], headline: 'Local team wins championship in dramatic final', geography: 'India', velocityScore: 22, confidence: 0.91 },
  { label: 'Viral social moment', source: 'social', entities: ['#TrendingChallenge'], headline: 'A lighthearted challenge is trending across social platforms', geography: 'Global', velocityScore: 24, confidence: 0.85 },
  { label: 'News event', source: 'news', entities: ['Heatwave'], headline: 'Record heatwave breaks temperature records nationwide', geography: 'India', velocityScore: 18, confidence: 0.88 },
];

const SOURCES: Signal['source'][] = ['social', 'news', 'search', 'sports', 'consumer', 'competitor'];

/**
 * SCREEN 1 — LIVE PULSE. Radar view of live cultural signals; opportunities are
 * fetched from any connected brand's signal stream, not hardcoded to one brand.
 * Signals can be fired from a preset scenario OR entered manually field-by-field,
 * both running the same SENSE -> UNDERSTAND -> DECIDE pipeline.
 */
@Component({
  selector: 'next-live-pulse',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './live-pulse.component.html',
  styleUrl: './live-pulse.component.scss',
})
export class LivePulseComponent implements OnInit {
  readonly presets = PRESETS;
  readonly sources = SOURCES;

  opportunities: Opportunity[] = [];
  brands: Brand[] = [];
  loading = true;

  mode: 'preset' | 'manual' = 'preset';
  brandId = '';
  presetIndex = 0;
  simulating = false;
  errorMessage = '';

  manual = {
    source: 'social' as Signal['source'],
    headline: '',
    entities: '',
    geography: '',
    language: 'en',
    velocityScore: 15,
    confidence: 0.75,
  };

  constructor(
    private readonly opportunityService: OpportunityService,
    private readonly brandService: BrandService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.refresh();
    this.brandService.list().subscribe((brands) => {
      this.brands = brands;
      if (brands.length > 0) this.brandId = brands[0].brandId;
    });
  }

  refresh(): void {
    this.loading = true;
    this.opportunityService.list().subscribe({
      next: (data) => { this.opportunities = data; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  simulate(): void {
    if (!this.brandId) return;

    const payload =
      this.mode === 'preset'
        ? (() => {
            const preset = this.presets[this.presetIndex];
            return {
              source: preset.source,
              rawPayload: { headline: preset.headline },
              entities: preset.entities,
              geography: preset.geography,
              language: 'en',
              velocityScore: preset.velocityScore,
              confidence: preset.confidence,
            };
          })()
        : {
            source: this.manual.source,
            rawPayload: { headline: this.manual.headline },
            entities: this.manual.entities.split(',').map((e) => e.trim()).filter(Boolean),
            geography: this.manual.geography || 'Unspecified',
            language: this.manual.language || 'en',
            velocityScore: this.manual.velocityScore,
            confidence: this.manual.confidence,
          };

    if (this.mode === 'manual' && (!this.manual.headline || payload.entities.length === 0)) {
      this.errorMessage = 'Headline and at least one entity are required';
      return;
    }

    this.simulating = true;
    this.errorMessage = '';

    this.opportunityService.submitSignal(this.brandId, payload).subscribe({
      next: (res) => {
        this.simulating = false;
        this.router.navigate(['/opportunity', res.opportunity.opportunityId]);
      },
      error: (err) => {
        this.simulating = false;
        this.errorMessage = err?.error?.error || 'Signal ingestion failed';
      },
    });
  }

  levelClass(level: string): string {
    return level === 'GREEN' ? 'lvl-green' : level === 'RED' ? 'lvl-red' : 'lvl-amber';
  }
}
