import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CampaignService } from '../../core/services/campaign.service';
import { CampaignListItem } from '../../core/models/domain.model';

@Component({
  selector: 'next-campaigns-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './campaigns-list.component.html',
  styleUrl: './campaigns-list.component.scss',
})
export class CampaignsListComponent implements OnInit {
  campaigns: CampaignListItem[] = [];
  loading = true;

  constructor(private readonly campaignService: CampaignService) {}

  ngOnInit(): void {
    this.campaignService.list().subscribe({
      next: (data) => { this.campaigns = data; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }
}
