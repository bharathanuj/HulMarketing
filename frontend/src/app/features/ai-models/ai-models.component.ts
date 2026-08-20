import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiModelService } from '../../core/services/ai-model.service';
import { AiModel, ModelCategory, ModelRole } from '../../core/models/domain.model';

const ROLES: ModelRole[] = ['reasoning', 'copy', 'vision'];
const CATEGORIES: { value: ModelCategory; label: string }[] = [
  { value: 'llm', label: 'Language model (pipeline)' },
  { value: 'plugin', label: 'Plugin' },
  { value: 'wrapper', label: 'AI wrapper' },
  { value: 'tool', label: 'AI tool' },
];

/**
 * AI MODELS TAB — a registry of every AI capability in the company, not just
 * the LLMs this pipeline calls. category='llm' rows are live config: activating
 * one calls POST /api/models/:id/activate, which updates the in-memory
 * modelConfig every agent reads on its next run — no restart. Other categories
 * (plugins, internal wrappers, tools like Copilot) are a reference registry —
 * "in use" just tracks visibility, it doesn't touch the pipeline.
 */
@Component({
  selector: 'next-ai-models',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-models.component.html',
  styleUrl: './ai-models.component.scss',
})
export class AiModelsComponent implements OnInit {
  readonly roles = ROLES;
  readonly categories = CATEGORIES;

  models: AiModel[] = [];
  loading = true;

  name = '';
  provider = '';
  modelRef = '';
  role: ModelRole = 'reasoning';
  category: ModelCategory = 'llm';
  description = '';
  link = '';
  notes = '';
  saving = false;
  errorMessage = '';

  constructor(private readonly modelService: AiModelService) {}

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.loading = true;
    this.modelService.list().subscribe({
      next: (data) => { this.models = data; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  byRole(role: ModelRole): AiModel[] {
    return this.models.filter((m) => m.category === 'llm' && m.role === role);
  }

  get pluginsAndTools(): AiModel[] {
    return this.models.filter((m) => m.category !== 'llm');
  }

  add(): void {
    if (!this.name || !this.modelRef) return;
    if (this.category === 'llm' && !this.role) return;
    this.saving = true;
    this.errorMessage = '';

    this.modelService
      .add({
        name: this.name,
        provider: this.provider || undefined,
        modelRef: this.modelRef,
        role: this.category === 'llm' ? this.role : undefined,
        category: this.category,
        description: this.description || undefined,
        link: this.link || undefined,
        notes: this.notes || undefined,
      })
      .subscribe({
        next: () => {
          this.saving = false;
          this.name = '';
          this.provider = '';
          this.modelRef = '';
          this.description = '';
          this.link = '';
          this.notes = '';
          this.refresh();
        },
        error: (err) => {
          this.saving = false;
          this.errorMessage = err?.error?.error || 'Could not add entry';
        },
      });
  }

  activate(model: AiModel): void {
    this.modelService.activate(model.modelId).subscribe(() => this.refresh());
  }

  deactivate(model: AiModel): void {
    this.modelService.deactivate(model.modelId).subscribe(() => this.refresh());
  }

  remove(model: AiModel): void {
    this.modelService.remove(model.modelId).subscribe(() => this.refresh());
  }
}
