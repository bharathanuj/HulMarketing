import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Opportunity, Signal } from '../models/domain.model';

import { environment } from '../../../environments/environment';

const API_BASE = environment.apiBase;

/**
 * Thin, single-responsibility service — this is the ONLY class in the frontend
 * that knows the opportunity endpoints exist. Components never call HttpClient
 * directly, so swapping REST for GraphQL later touches one file.
 */
@Injectable({ providedIn: 'root' })
export class OpportunityService {
  constructor(private readonly http: HttpClient) {}

  list(): Observable<Opportunity[]> {
    return this.http.get<Opportunity[]>(`${API_BASE}/opportunities`);
  }

  get(opportunityId: string): Observable<Opportunity> {
    return this.http.get<Opportunity>(`${API_BASE}/opportunities/${opportunityId}`);
  }

  submitSignal(brandId: string, signal: Omit<Signal, 'signalId' | 'detectedAt'>) {
    return this.http.post<{ opportunity: Opportunity }>(`${API_BASE}/signals`, { brandId, signal });
  }
}
