import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DownloadProject } from '../models/download-project';

export interface ProjectDocument {
  _id: string;
  projectId: string;
  documentType: string;
  hierarchyLevel: string;
  files: Array<{
    documentName: string;
    documentUrl: string;
    version: number;
    _id: string;
    markers: Array<{
      position: { x: number; y: number };
      style: { textSize: number };
      createdBy: string;
      title: string;
      instanceId: string;
      createdAt: string;
      _id: string;
    }>;
  }>;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface ProjectReport {
  _id: string;
  projectId: string;
  instanceId: string | null;
  coverLetter: {
    inspectionOverview: {
      totalItems: string;
      passedItems: string;
      failedItems: string;
      tbcItems: string;
    };
    projectName: string;
    clientName: string;
    fileUrl: string;
    address: string;
    date: string;
    buildingName: string;
    reportTitle: string;
    additionalInfo: string;
  };
  createdAt: string;
  updatedAt: string;
  __v: number;
  reportPDF?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DownloadProjectService {
  getEmployeeName(employeeId: string) {
    throw new Error('Method not implemented.');
  }
  private apiUrl = 'https://vps.allpassiveservices.com.au/api/project';

  constructor(private http: HttpClient) {}

  getProjectDetails(projectId: string): Observable<DownloadProject> {
    const url = `${this.apiUrl}/download/${projectId}`;
    console.log('Making GET request to:', url);
    return this.http.get<DownloadProject>(url);
  }

  updateProject(projectId: string, project: DownloadProject): Observable<any> {
    const url = `${this.apiUrl}/details/${projectId}`;
    console.log('Making PUT request to:', url, 'with data:', project);
    return this.http.put(url, project);
  }

  getProjectDocuments(projectId: string): Observable<{ message: string; data: ProjectDocument[] }> {
    const url = `${this.apiUrl}/getProjectDocuments/${projectId}`;
    console.log('Making GET request to:', url);
    return this.http.get<{ message: string; data: ProjectDocument[] }>(url);
  }

  deleteProjectDocument(documentId: string): Observable<any> {
    const url = `${this.apiUrl}/project-documents/${documentId}`;
    console.log('Making DELETE request to:', url);
    return this.http.delete(url);
  }

  getProjectReports(projectId: string): Observable<{ message: string; data: ProjectReport[] }> {
    const url = `${this.apiUrl}/reports/${projectId}`;
    console.log('Making GET request to:', url);
    return this.http.get<{ message: string; data: ProjectReport[] }>(url);
  }
}