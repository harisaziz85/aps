import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { Project } from '../models/createproject';

@Injectable({
  providedIn: 'root',
})
export class CreateprojectService {
  private apiUrl = 'https://vps.allpassiveservices.com.au/api/project/createProjectAttribute';
  private hierarchyApiUrl = 'https://vps.allpassiveservices.com.au/api/project/createBuildingHierarchy';
  private uploadDocumentsApiUrl = 'https://vps.allpassiveservices.com.au/api/project/upload-documents';
  private standardAttributeApiUrl = 'https://vps.allpassiveservices.com.au/api/project/createStandardAttribute';
  private employeesApiUrl = 'https://vps.allpassiveservices.com.au/api/employees';
  private productsApiUrl = 'https://vps.allpassiveservices.com.au/api/product/list';
  private approvalDocumentsApiUrl = 'https://vps.allpassiveservices.com.au/api/approval-docs/list';
  private reportsApiUrl = 'https://vps.allpassiveservices.com.au/api/project/reports';
  private documentsApiUrl = 'https://vps.allpassiveservices.com.au/api/project/documents';
  private attributesApiUrl = 'https://vps.allpassiveservices.com.au/api/project/attributes';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  createProject(projectData: Project, imageFile: File | null): Observable<any> {
    const formData = new FormData();
    formData.append('projectData', JSON.stringify(projectData));
    if (imageFile) {
      formData.append('image', imageFile, imageFile.name);
    }
    return this.http.post<any>(this.apiUrl, formData);
  }

  createProjectAttribute(projectData: Project, imageFile: File | null = null): Observable<any> {
    if (imageFile) {
      const formData = new FormData();
      formData.append('projectData', JSON.stringify(projectData));
      formData.append('image', imageFile, imageFile.name);
      return this.http.post<any>(this.apiUrl, formData).pipe(
        tap(response => {
          if (response?.project?._id) {
            localStorage.setItem('projectId', response.project._id);
            this.router.navigate(['/standardAttribute']);
          }
        })
      );
    } else {
      return this.http.post<any>(this.apiUrl, projectData).pipe(
        tap(response => {
          if (response?.project?._id) {
            localStorage.setItem('projectId', response.project._id);
            this.router.navigate(['/standardAttribute']);
          }
        })
      );
    }
  }

  submitFormData(formData: FormData): Observable<any> {
    return this.http.post<any>(this.apiUrl, formData);
  }

  createBuildingHierarchy(projectId: string, levels: { name: string }[]): Observable<any> {
    const payload = { projectId, levels };
    return this.http.post<any>(this.hierarchyApiUrl, payload);
  }

  getBuildingHierarchy(projectId: string): Observable<any> {
    return this.http.post<any>(this.hierarchyApiUrl, { projectId });
  }

  uploadDocuments(projectId: string, documentType: string, hierarchyLevel: string, files: File[], documentNames: string[]): Observable<any> {
    const formData = new FormData();
    formData.append('projectId', projectId);
    formData.append('documentType', documentType);
    formData.append('hierarchyLevel', hierarchyLevel);
    const filesMeta = files.map((file, index) => ({
      originalName: file.name,
      documentName: documentNames[index] || file.name,
      version: 1
    }));
    formData.append('filesMeta', JSON.stringify(filesMeta));
    files.forEach((file) => {
      formData.append('files', file);
    });
    return this.http.post<any>(this.uploadDocumentsApiUrl, formData);
  }

  uploadSingleDocument(projectId: string, documentType: string, hierarchyLevel: string, file: File, documentName: string): Observable<any> {
    const formData = new FormData();
    formData.append('projectId', projectId);
    formData.append('documentType', documentType);
    formData.append('hierarchyLevel', hierarchyLevel);
    const filesMeta = [{
      originalName: file.name,
      documentName: documentName,
      version: 1
    }];
    formData.append('filesMeta', JSON.stringify(filesMeta));
    formData.append('files', file);
    return this.http.post<any>(this.uploadDocumentsApiUrl, formData);
  }

  createStandardAttribute(payload: any): Observable<any> {
    return this.http.post<any>(this.standardAttributeApiUrl, payload);
  }

  getEmployees(): Observable<any> {
    return this.http.get<any>(this.employeesApiUrl);
  }

  getProducts(): Observable<any> {
    return this.http.get<any>(this.productsApiUrl);
  }

  getApprovalDocuments(): Observable<any> {
    return this.http.get<any>(this.approvalDocumentsApiUrl);
  }

  getProjectReports(projectId: string): Observable<any> {
    return this.http.get<any>(`${this.reportsApiUrl}/${projectId}`);
  }

  getDocuments(projectId: string, hierarchyId: string): Observable<any> {
    return this.http.get<any>(`${this.documentsApiUrl}/${projectId}/${hierarchyId}`);
  }

  getStandardAttributes(projectId: string): Observable<any> {
    return this.http.get<any>(`${this.attributesApiUrl}/${projectId}`);
  }
}