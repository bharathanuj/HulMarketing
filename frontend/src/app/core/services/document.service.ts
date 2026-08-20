import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CompanyDocument, CompanyDocumentDetail } from '../models/domain.model';

import { environment } from '../../../environments/environment';

const API_BASE = environment.apiBase;

@Injectable({ providedIn: 'root' })
export class DocumentService {
  constructor(private readonly http: HttpClient) {}

  list(): Observable<CompanyDocument[]> {
    return this.http.get<CompanyDocument[]>(`${API_BASE}/documents`);
  }

  get(documentId: string): Observable<CompanyDocumentDetail> {
    return this.http.get<CompanyDocumentDetail>(`${API_BASE}/documents/${documentId}`);
  }

  upload(file: File, title: string, brandId: string, docType: string): Observable<CompanyDocument> {
    const form = new FormData();
    form.append('file', file);
    form.append('title', title);
    form.append('brandId', brandId);
    form.append('docType', docType);
    return this.http.post<CompanyDocument>(`${API_BASE}/documents`, form);
  }

  fileUrl(documentId: string): string {
    return `${API_BASE}/documents/${documentId}/file`;
  }

  delete(documentId: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE}/documents/${documentId}`);
  }
}
