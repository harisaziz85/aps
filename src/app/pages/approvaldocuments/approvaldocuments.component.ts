import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApprovalDocumentsService } from '../../core/services/document.service';
import { Document } from '../../core/models/document';
import { TopbarComponent } from '../components/topbar/topbar.component';
import { SliderComponent } from '../components/slider/slider.component';
import { FootComponent } from '../components/foot/foot.component';
import { HttpErrorResponse } from '@angular/common/http';
import { SvgIconsComponent } from "../../shared/svg-icons/svg-icons.component";

@Component({
  selector: 'app-approvaldocuments',
  standalone: true,
  imports: [CommonModule, FormsModule, SliderComponent, TopbarComponent, FootComponent, SvgIconsComponent],
  templateUrl: './approvaldocuments.component.html',
  styleUrls: ['./approvaldocuments.component.css']
})
export class ApprovaldocumentsComponent implements OnInit {
  documents: Document[] = [];
  filteredDocuments: Document[] = [];
  isModalOpen = false;
  selectedFile: File | null = null;
  isUploading = false;
  documentName: string = '';
  uploadedDocument: Document | null = null;
  searchQuery: string = '';
  filterType: 'All' | 'New' = 'All';
  isLoading: boolean = true;
  selectedDocumentIds: string[] = [];
  isConfirmationModalOpen: boolean = false;

  constructor(
    private sanitizer: DomSanitizer,
    private approvalDocumentsService: ApprovalDocumentsService
  ) {}

  ngOnInit(): void {
    this.fetchDocuments();
  }

  fetchDocuments(): void {
    this.isLoading = true;
    this.approvalDocumentsService.getDocuments().subscribe({
      next: (documents) => {
        this.documents = documents;
        this.applyFilters();
        console.log('Documents fetched:', documents);
        this.isLoading = false;
      },
      error: () => {
        console.error('Error fetching documents');
        alert('Failed to fetch documents. Please try again.');
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.documents];

    if (this.searchQuery.trim()) {
      filtered = filtered.filter(doc =>
        doc.name.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    }

    if (this.filterType === 'New') {
      filtered = filtered.filter(doc => this.isDocumentNew(doc));
    }

    this.filteredDocuments = filtered;
  }

  isDocumentNew(doc: Document): boolean {
    const today = new Date();
    const docDate = new Date(doc.createdAt);
    return (
      docDate.getDate() === today.getDate() &&
      docDate.getMonth() === today.getMonth() &&
      docDate.getFullYear() === today.getFullYear()
    );
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  setFilter(filter: 'All' | 'New'): void {
    this.filterType = filter;
    this.applyFilters();
  }

  toggleDocumentSelection(docId: string, event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    if (isChecked) {
      if (!this.selectedDocumentIds.includes(docId)) {
        this.selectedDocumentIds.push(docId);
      }
    } else {
      this.selectedDocumentIds = this.selectedDocumentIds.filter(id => id !== docId);
    }
    console.log('Selected document IDs:', this.selectedDocumentIds);
  }

  clearSelection(): void {
    this.selectedDocumentIds = [];
    console.log('Selected document IDs cleared:', this.selectedDocumentIds);
  }

  openConfirmationModal(): void {
    this.isConfirmationModalOpen = true;
    console.log('Confirmation modal opened');
  }

  closeConfirmationModal(): void {
    this.isConfirmationModalOpen = false;
    console.log('Confirmation modal closed');
  }

  deleteDocuments(): void {
    if (this.selectedDocumentIds.length === 0) {
      alert('No documents selected for deletion');
      console.log('No documents selected for deletion');
      return;
    }

    const deleteData = { ids: this.selectedDocumentIds };
    console.log('Deleting documents with data:', deleteData);

    this.approvalDocumentsService.deleteDocuments(deleteData).subscribe({
      next: () => {
        this.documents = this.documents.filter(d => !this.selectedDocumentIds.includes(d._id));
        this.applyFilters();
        this.selectedDocumentIds = [];
        this.closeConfirmationModal();
        alert('Document(s) deleted successfully');
        console.log('Documents deleted successfully');
        window.location.reload();
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error deleting documents:', error);
        alert(error.error?.message || 'Failed to delete document(s). Please try again.');
        this.closeConfirmationModal();
      }
    });
  }

  openModal(): void {
    this.isModalOpen = true;
    document.body.classList.add('modal-open');
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedFile = null;
    this.documentName = '';
    this.uploadedDocument = null;
    this.isUploading = false;
    document.body.classList.remove('modal-open');
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.documentName = this.selectedFile.name;
      console.log('Selected file:', this.selectedFile.name, 'Size:', this.selectedFile.size);
    }
  }

  uploadDocument(): void {
    if (!this.selectedFile) {
      alert('Please select a file to upload.');
      return;
    }
    if (!this.documentName.trim()) {
      alert('Please enter a document name.');
      return;
    }

    this.isUploading = true;

    this.approvalDocumentsService.uploadDocument(this.selectedFile, this.documentName).subscribe({
      next: (response) => {
        console.log('Document uploaded successfully:', response);
        this.isUploading = false;
        this.uploadedDocument = {
          name: this.documentName,
          fileUrl: response.document?.fileUrl || '',
          _id: response.document?._id || '',
          createdAt: response.document?.createdAt || new Date().toISOString(),
          __v: response.document?.__v || 0
        };
        this.closeModal();
        alert('Document uploaded successfully');
        window.location.reload();
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error uploading document:', error);
        console.error('Server error details:', error.error);
        console.error('Status:', error.status, 'Status Text:', error.statusText);
        this.isUploading = false;
        let errorMessage = 'Failed to upload document. Please try again.';
        if (error.status === 500 && error.error?.message) {
          errorMessage = `Server error: ${error.error.message}`;
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }
        alert(errorMessage);
      }
    });
  }

  clearSelectedFile(): void {
    this.selectedFile = null;
    this.documentName = '';
    this.uploadedDocument = null;
    this.isUploading = false;
    console.log('Selected file cleared locally');
  }

  deleteUploadedDocument(): void {
    this.clearSelectedFile();
    console.log('Document removed from modal');
  }

  openDocument(doc: Document): void {
    if (!doc.fileUrl) {
      alert('No file URL available for this document.');
      return;
    }

    window.open(doc.fileUrl, '_blank');
    console.log(`Opened document in new tab: ${doc.name}, URL: ${doc.fileUrl}`);
  }
}

// 