import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CampaignListItem } from '../models/domain.model';

import { environment } from '../../../environments/environment';

const API_BASE = environment.apiBase;

@Injectable({ providedIn: 'root' })
export class CampaignService {
  constructor(private readonly http: HttpClient) {}

  list(): Observable<CampaignListItem[]> {
    return this.http.get<CampaignListItem[]>(`${API_BASE}/campaigns`);
  }
}
