import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProjectResponse, Project } from '../models/project';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private apiUrl = 'https://vps.allpassiveservices.com.au/api';

  constructor(private http: HttpClient) {}

getAllProjects(): Observable<ProjectResponse> {
  return this.http.get<ProjectResponse>(`${this.apiUrl}/project/getAllProjects?isArchive=false`);
}

  getProjectDetails(projectId: string): Observable<Project> {
    if (!projectId) {
      throw new Error('Invalid project ID');
    }
    return this.http.get<Project>(`${this.apiUrl}/project/details/${projectId}`);
  }

  updateProjectStatus(projectId: string, status: string): Observable<any> {
    if (!projectId) {
      throw new Error('Invalid project ID');
    }
    return this.http.put(`${this.apiUrl}/project/updateStatus`, {
      projectId: projectId,
      projectStatus: status
    });
  }

  archiveProject(projectId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/project/updateArchiveStatus`, {
      projectIds: [projectId],
      isArchive: true
    });
  }

  deleteProject(projectIds: string[]): Observable<any> {
    return this.http.delete(`${this.apiUrl}/project/delete`, { body: { projectIds } });
  }
}