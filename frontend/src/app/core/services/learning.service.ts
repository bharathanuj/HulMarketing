import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LearningOutcome } from '../models/domain.model';

import { environment } from '../../../environments/environment';

const API_BASE = environment.apiBase;

@Injectable({ providedIn: 'root' })
export class LearningService {
  constructor(private readonly http: HttpClient) {}

  list(): Observable<LearningOutcome[]> {
    return this.http.get<LearningOutcome[]>(`${API_BASE}/learning`);
  }
}
