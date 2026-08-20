import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocumentService } from '../../core/services/document.service';
import { BrandService } from '../../core/services/brand.service';
import { CompanyDocument, Brand } from '../../core/models/domain.model';

const DOC_TYPES = ['company_doc', 'positioning', 'tone', 'claims', 'forbidden_claims', 'audience', 'campaign_history', 'legal'];

/**
 * DOCUMENTS TAB — company PDF library. Each upload is text-extracted server-side,
 * summarized into key learnings, and stored as a brand_knowledge row too, so the
 * pipeline's RAG agents (Brand Fit, Brand Guardian) can ground on it. Everything
 * is persisted in Postgres — the summary is saved once and shown every time this
 * tab is opened, not regenerated per visit.
 */
@Component({
  selector: 'next-documents',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './documents.component.html',
  styleUrl: './documents.component.scss',
})
export class DocumentsComponent implements OnInit {
  readonly docTypes = DOC_TYPES;

  documents: CompanyDocument[] = [];
  brands: Brand[] = [];
  loading = true;

  selectedFile: File | null = null;
  title = '';
  brandId = '';
  docType = 'company_doc';
  uploading = false;
  errorMessage = '';

  expandedId: string | null = null;
  extractedText: Record<string, string> = {};
  loadingExtract = false;

  constructor(
    private readonly documentService: DocumentService,
    private readonly brandService: BrandService
  ) {}

  ngOnInit(): void {
    this.refresh();
    this.brandService.list().subscribe((brands) => {
      this.brands = brands;
      if (brands.length > 0) this.brandId = brands[0].brandId;
    });
  }

  refresh(): void {
    this.loading = true;
    this.documentService.list().subscribe({
      next: (data) => { this.documents = data; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
    if (this.selectedFile && !this.title) {
      this.title = this.selectedFile.name.replace(/\.pdf$/i, '');
    }
  }

  upload(): void {
    if (!this.selectedFile || !this.brandId) return;
    this.uploading = true;
    this.errorMessage = '';

    this.documentService.upload(this.selectedFile, this.title, this.brandId, this.docType).subscribe({
      next: () => {
        this.uploading = false;
        this.selectedFile = null;
        this.title = '';
        this.refresh();
      },
      error: (err) => {
        this.uploading = false;
        this.errorMessage = err?.error?.error || 'Upload failed';
      },
    });
  }

  view(doc: CompanyDocument): void {
    window.open(this.documentService.fileUrl(doc.documentId), '_blank');
  }

  toggleExtract(doc: CompanyDocument): void {
    if (this.expandedId === doc.documentId) {
      this.expandedId = null;
      return;
    }
    this.expandedId = doc.documentId;
    if (!this.extractedText[doc.documentId]) {
      this.loadingExtract = true;
      this.documentService.get(doc.documentId).subscribe({
        next: (detail) => {
          this.extractedText[doc.documentId] = detail.extractedText || '(no extractable text found in this PDF)';
          this.loadingExtract = false;
        },
        error: () => { this.loadingExtract = false; },
      });
    }
  }

  remove(doc: CompanyDocument): void {
    this.documentService.delete(doc.documentId).subscribe(() => this.refresh());
  }

  formatSize(bytes: number): string {
    return bytes > 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
  }
}
