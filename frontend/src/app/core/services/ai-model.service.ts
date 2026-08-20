import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AiModel, ModelCategory, ModelRole } from '../models/domain.model';

import { environment } from '../../../environments/environment';

const API_BASE = environment.apiBase;

export interface NewModelInput {
  name: string;
  provider?: string;
  modelRef: string;
  role?: ModelRole;
  category: ModelCategory;
  description?: string;
  link?: string;
  notes?: string;
}

@Injectable({ providedIn: 'root' })
export class AiModelService {
  constructor(private readonly http: HttpClient) {}

  list(): Observable<AiModel[]> {
    return this.http.get<AiModel[]>(`${API_BASE}/models`);
  }

  add(input: NewModelInput): Observable<AiModel> {
    return this.http.post<AiModel>(`${API_BASE}/models`, input);
  }

  activate(modelId: string): Observable<{ status: string }> {
    return this.http.post<{ status: string }>(`${API_BASE}/models/${modelId}/activate`, {});
  }

  deactivate(modelId: string): Observable<{ status: string }> {
    return this.http.post<{ status: string }>(`${API_BASE}/models/${modelId}/deactivate`, {});
  }

  remove(modelId: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/models/${modelId}`);
  }
}
