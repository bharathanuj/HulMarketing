import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GovernanceAsset } from '../models/domain.model';

import { environment } from '../../../environments/environment';

const API_BASE = environment.apiBase;

@Injectable({ providedIn: 'root' })
export class GovernanceService {
  constructor(private readonly http: HttpClient) {}

  list(): Observable<GovernanceAsset[]> {
    return this.http.get<GovernanceAsset[]>(`${API_BASE}/governance`);
  }
}
