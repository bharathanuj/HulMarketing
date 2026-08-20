import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

export type PipelineStep = 'opportunity' | 'campaign' | 'governance' | 'launch';

interface Step {
  key: PipelineStep;
  label: string;
  path: string;
}

const STEPS: Step[] = [
  { key: 'opportunity', label: 'Opportunity', path: '/opportunity' },
  { key: 'campaign', label: 'Campaign', path: '/campaign' },
  { key: 'governance', label: 'Governance', path: '/guardian' },
  { key: 'launch', label: 'Launch + Learn', path: '/launch' },
];

/**
 * Shown at the top of every screen in a single opportunity's journey so a
 * reviewer can jump back to an earlier stage or ahead to one already reached,
 * instead of having no way to move except the browser's own back button.
 */
@Component({
  selector: 'next-pipeline-stepper',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './pipeline-stepper.component.html',
  styleUrl: './pipeline-stepper.component.scss',
})
export class PipelineStepperComponent {
  @Input({ required: true }) opportunityId!: string;
  @Input({ required: true }) current!: PipelineStep;

  readonly steps = STEPS;

  stateOf(step: Step): 'done' | 'current' | 'upcoming' {
    const currentIndex = this.steps.findIndex((s) => s.key === this.current);
    const stepIndex = this.steps.findIndex((s) => s.key === step.key);
    if (stepIndex < currentIndex) return 'done';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  }
}
