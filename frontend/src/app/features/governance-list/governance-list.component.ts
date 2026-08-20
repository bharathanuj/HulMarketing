import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { GovernanceService } from '../../core/services/governance.service';
import { GovernanceAsset } from '../../core/models/domain.model';

@Component({
  selector: 'next-governance-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './governance-list.component.html',
  styleUrl: './governance-list.component.scss',
})
export class GovernanceListComponent implements OnInit {
  assets: GovernanceAsset[] = [];
  loading = true;

  constructor(private readonly governanceService: GovernanceService) {}

  ngOnInit(): void {
    this.governanceService.list().subscribe({
      next: (data) => { this.assets = data; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  statusClass(status: string): string {
    return status === 'CLEARED' ? 'st-cleared' : status === 'FLAGGED' ? 'st-flagged' : 'st-pending';
  }
}
