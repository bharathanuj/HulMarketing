import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OpportunityService } from '../../core/services/opportunity.service';
import { Opportunity } from '../../core/models/domain.model';

@Component({
  selector: 'next-opportunities-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './opportunities-list.component.html',
  styleUrl: './opportunities-list.component.scss',
})
export class OpportunitiesListComponent implements OnInit {
  opportunities: Opportunity[] = [];
  loading = true;

  constructor(private readonly opportunityService: OpportunityService) {}

  ngOnInit(): void {
    this.opportunityService.list().subscribe({
      next: (data) => { this.opportunities = data; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  levelClass(level: string): string {
    return level === 'GREEN' ? 'lvl-green' : level === 'RED' ? 'lvl-red' : 'lvl-amber';
  }
}
