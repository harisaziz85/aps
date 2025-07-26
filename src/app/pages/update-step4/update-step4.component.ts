import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UpdateService } from '../../core/services/update-service.service';
import { NavbarComponent } from '../components/navbar/navbar.component';
import { TopbarComponent } from '../components/topbar/topbar.component';
import { FootComponent } from '../components/foot/foot.component';
import { ToastrService } from 'ngx-toastr';

interface HierarchyLevel {
  _id: string;
  name: string;
  instanceCount: number;
}

interface UploadDocumentResponse {
  message: string;
  data: {
    _id: string;
    projectId: string;
    documentType: string;
    hierarchyLevel: string;
    files: { documentName: string; documentUrl: string; version: number; _id: string; markers: any[] }[];
    createdAt: string;
    updatedAt: string;
    __v: number;
  };
}

interface Document {
  _id: string;
  projectId: string;
  documentType: string;
  hierarchyLevel: string;
  files: { documentName: string; documentUrl: string; version: number; _id: string; markers: any[] }[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface GetDocumentsResponse {
  message: string;
  data: Document[];
}

interface FileMeta {
  documentName: string;
}

@Component({
  selector: 'app-update-step4',
  standalone: true,
  templateUrl: './update-step4.component.html',
  styleUrls: ['./update-step4.component.css'],
  imports: [CommonModule, FormsModule, NavbarComponent, TopbarComponent, FootComponent]
})
export class UpdateStep4Component implements OnInit {
  projectId: string | null = null;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  documentType: string = '';
  selectedHierarchyLevel: string = '';
  selectedFiles: File[] = [];
  fileMeta: FileMeta[] = [];
  hierarchyLevels: HierarchyLevel[] = [];
  isLoadingHierarchy: boolean = false;
  isHierarchyDropdownOpen: boolean = false;
  fileSelectionMode: { [key: string]: string } = {
    '2D Plan': 'Single File',
    'Technical Document': 'Single File',
    'Additional Document': 'Single File'
  };
  documentCounts: { [key: string]: number } = {
    '2D Plan': 0,
    'Technical Document': 0,
    'Additional Document': 0
  };
  documents: { [key: string]: { documentName: string; fileType: string; fileId: string; documentId: string; hierarchyLevel: string }[] } = {
    '2D Plan': [],
    'Technical Document': [],
    'Additional Document': []
  };
  showDropdown: { [key: string]: boolean } = {
    '2D Plan': false,
    'Technical Document': false,
    'Additional Document': false
  };
  isModalOpen: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router,
    private updateService: UpdateService,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.projectId = params['id'] || this.updateService.getProjectId();
      console.log('Project ID:', this.projectId);
      if (!this.projectId) {
        this.toastr.error('No project ID provided in route or service', 'Error');
      } else {
        this.fetchHierarchyLevels(this.projectId);
        this.fetchDocuments(this.projectId);
      }
    });
  }

  private fetchHierarchyLevels(projectId: string) {
    this.isLoadingHierarchy = true;
    this.http.get<any>(`https://vps.allpassiveservices.com.au/api/project/hierarchy/${projectId}`, {
      headers: { 'Accept': 'application/json' }
    }).subscribe({
      next: (response) => {
        console.log('Hierarchy response:', response);
        this.hierarchyLevels = response.hierarchyData?.levels || response.data?.levels || [];
        this.isLoadingHierarchy = false;
        this.toastr.success('Hierarchy levels loaded successfully', 'Success');
      },
      error: (error: HttpErrorResponse) => {
        console.error('Hierarchy fetch error:', error);
        this.toastr.error('Failed to load hierarchy levels', 'Error');
        this.isLoadingHierarchy = false;
      }
    });
  }

  private fetchDocuments(projectId: string) {
    this.http.get<GetDocumentsResponse>(`https://vps.allpassiveservices.com.au/api/project/getProjectDocuments/${projectId}`, {
      headers: { 'Accept': 'application/json' }
    }).subscribe({
      next: (response: GetDocumentsResponse) => {
        console.log('Documents response:', response);
        this.documentCounts = { '2D Plan': 0, 'Technical Document': 0, 'Additional Document': 0 };
        this.documents = { '2D Plan': [], 'Technical Document': [], 'Additional Document': [] };
        response.data.forEach(doc => {
          let normalizedDocType = doc.documentType;
          if (doc.documentType === 'Technical') normalizedDocType = 'Technical Document';
          else if (doc.documentType === 'Additional') normalizedDocType = 'Additional Document';
          if (this.documentCounts[normalizedDocType] !== undefined) {
            this.documentCounts[normalizedDocType] += doc.files.length;
            doc.files.forEach(file => {
              this.documents[normalizedDocType].push({
                documentName: file.documentName,
                fileType: file.documentUrl.split('.').pop() || 'pdf',
                fileId: file._id,
                documentId: doc._id,
                hierarchyLevel: doc.hierarchyLevel
              });
            });
          }
        });
        this.toastr.success('Documents loaded successfully', 'Success');
      },
      error: (error: HttpErrorResponse) => {
        console.error('Documents fetch error:', error);
        this.toastr.error('Failed to load documents', 'Error');
      }
    });
  }

  onFileSelected(event: any) {
    this.errorMessage = null;
    this.successMessage = null;
    const files: FileList = event.target.files;
    const allowedFormats = ['application/pdf', 'image/jpeg', 'image/png'];
    const maxFileSize = 10 * 1024 * 1024; // 10MB

    this.selectedFiles = Array.from(files).filter(file => {
      const isValidFormat = allowedFormats.includes(file.type);
      const isValidSize = file.size <= maxFileSize && file.size > 0;
      const isValidName = file.name && file.name.trim() !== '' && !file.name.includes('..');

      if (!isValidFormat) this.errorMessage = `Invalid file format for ${file.name}. Allowed formats: PDF, JPEG, PNG`;
      else if (!isValidSize) this.errorMessage = `File ${file.name} is too large (max 10MB) or empty`;
      else if (!isValidName) this.errorMessage = `File ${file.name} has an invalid name`;

      return isValidFormat && isValidSize && isValidName;
    });

    if (!this.isBulkMode() && this.selectedFiles.length > 1) {
      this.selectedFiles = [this.selectedFiles[0]];
    }

    this.fileMeta = this.selectedFiles.map(file => ({
      documentName: `${this.documentType} - ${file.name.split('.')[0]}`
    }));

    if (this.selectedFiles.length === 0 && files.length > 0) {
      this.errorMessage = this.errorMessage || 'No valid files selected. Allowed formats: PDF, JPEG, PNG; Max size: 10MB';
    }
  }

  isBulkMode(): boolean {
    return !!this.documentType && this.fileSelectionMode[this.documentType] === 'Multiple Files';
  }

  isValidMeta(): boolean {
    return this.fileMeta.every(meta => meta.documentName && meta.documentName.trim() !== '');
  }

  save() {
    if (!this.projectId || this.selectedFiles.length === 0 || !this.documentType || !this.selectedHierarchyLevel || !this.isValidMeta()) {
      this.errorMessage = 'Please select project ID, files, document type, hierarchy level, and provide a document name for each file';
      return;
    }

    const formData = new FormData();
    formData.append('projectId', this.projectId);
    const backendDocumentType = this.documentType === 'Technical Document' ? 'Technical' :
                                this.documentType === 'Additional Document' ? 'Additional' :
                                this.documentType;
    formData.append('documentType', backendDocumentType);
    formData.append('hierarchyLevel', this.selectedHierarchyLevel);

    const filesMeta = this.selectedFiles.map((file, index) => ({
      originalName: file.name,
      documentName: this.fileMeta[index].documentName,
      version: 1
    }));

    console.log('Sending formData:');
    for (const pair of formData.entries()) {
      console.log(pair[0], pair[1]);
    }
    formData.append('filesMeta', JSON.stringify(filesMeta));
    this.selectedFiles.forEach((file) => formData.append('files', file, file.name));

    this.http.post<UploadDocumentResponse>('https://vps.allpassiveservices.com.au/api/project/upload-documents', formData, {
      headers: { 'Accept': 'application/json' }
    }).subscribe({
      next: (response: UploadDocumentResponse) => {
        console.log('Upload response:', response);
        this.successMessage = response.message || 'Documents uploaded successfully';
        this.errorMessage = null;
        this.documentType = '';
        this.selectedHierarchyLevel = '';
        this.selectedFiles = [];
        this.fileMeta = [];
        this.isHierarchyDropdownOpen = false;
        if (this.projectId) this.fetchDocuments(this.projectId);
        this.closeModal();
      },
      error: (error: HttpErrorResponse) => {
        console.error('Upload error:', error);
        this.errorMessage = error.error?.message || `Upload failed (Status: ${error.status})`;
        this.successMessage = null;
      }
    });
  }

  deleteDocument(docType: string, index: number) {
    const doc = this.documents[docType][index];
    if (!doc || !doc.documentId) {
      this.errorMessage = 'Invalid document ID';
      this.successMessage = null;
      console.error('Delete failed: Invalid document ID', { doc });
      return;
    }

    const documentId = doc.documentId;
    console.log('Attempting to delete document:', { docType, index, documentId });

    this.http.delete(`https://vps.allpassiveservices.com.au/api/updateProject/project-documents/${documentId}`, {
      headers: { 'Accept': 'application/json' }
    }).subscribe({
      next: (response: any) => {
        console.log('Delete response:', response);
        this.documents[docType] = this.documents[docType].filter(d => d.documentId !== documentId);
        this.documentCounts[docType] = this.documents[docType].length;
        this.successMessage = response.message || 'Document deleted successfully';
        this.errorMessage = null;
        if (this.projectId) this.fetchDocuments(this.projectId);
      },
      error: (error: HttpErrorResponse) => {
        console.error('Delete error:', error);
        this.errorMessage = error.error?.message || `Failed to delete document (Status: ${error.status})`;
        this.successMessage = null;
      }
    });
  }

  goToStep5() {
    if (this.projectId) {
      this.router.navigate(['/pages/updateproject5', this.projectId]);
    } else {
      this.errorMessage = 'No project ID provided for navigation to Step 5';
      this.successMessage = null;
    }
  }

  toggleDropdown(docType: string) {
    this.showDropdown[docType] = !this.showDropdown[docType];
  }

  selectMode(docType: string, mode: string) {
    this.fileSelectionMode[docType] = mode;
    this.showDropdown[docType] = false;
    this.openModal(docType);
  }

  getHierarchyName(hierarchyId: string): string {
    const level = this.hierarchyLevels.find(h => h._id === hierarchyId);
    return level ? `${level.name} (${level.instanceCount} instances)` : 'Select a hierarchy level';
  }

  toggleHierarchyDropdown() {
    this.isHierarchyDropdownOpen = !this.isHierarchyDropdownOpen;
  }

  selectHierarchyLevel(levelId: string) {
    this.selectedHierarchyLevel = levelId;
    this.isHierarchyDropdownOpen = false;
  }

  openModal(docType: string) {
    this.documentType = docType;
    this.selectedFiles = [];
    this.fileMeta = [];
    this.selectedHierarchyLevel = '';
    this.isHierarchyDropdownOpen = false;
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.documentType = '';
    this.selectedFiles = [];
    this.fileMeta = [];
    this.selectedHierarchyLevel = '';
    this.isHierarchyDropdownOpen = false;
  }
}