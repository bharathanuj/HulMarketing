import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Brand } from '../models/domain.model';

import { environment } from '../../../environments/environment';

const API_BASE = environment.apiBase;

@Injectable({ providedIn: 'root' })
export class BrandService {
  constructor(private readonly http: HttpClient) {}

  list(): Observable<Brand[]> {
    return this.http.get<Brand[]>(`${API_BASE}/brands`);
  }
}
