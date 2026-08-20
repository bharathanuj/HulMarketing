import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LearningService } from '../../core/services/learning.service';
import { LearningOutcome } from '../../core/models/domain.model';

@Component({
  selector: 'next-learning-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './learning-list.component.html',
  styleUrl: './learning-list.component.scss',
})
export class LearningListComponent implements OnInit {
  outcomes: LearningOutcome[] = [];
  loading = true;

  constructor(private readonly learningService: LearningService) {}

  ngOnInit(): void {
    this.learningService.list().subscribe({
      next: (data) => { this.outcomes = data; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }
}
