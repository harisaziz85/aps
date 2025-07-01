import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ArchiveProject } from '../models/archiveprojects';

@Injectable({
  providedIn: 'root',
})
export class ArchiveProjectService {
  private apiUrl = 'https://vps.allpassiveservices.com.au/api/project/getAllProjects?isArchive=true';
  private statusApiUrl = 'https://vps.allpassiveservices.com.au/api/project/updateStatus';
  private deleteApiUrl = 'https://vps.allpassiveservices.com.au/api/project/delete';
  private restoreApiUrl = 'https://vps.allpassiveservices.com.au/api/project/updateArchiveStatus';

  constructor(private http: HttpClient) {}

  getAllProjects(page: number = 1): Observable<ArchiveProject[]> {
    return this.http.get<any>(`${this.apiUrl}&page=${page}`).pipe(
      map(response => {
        let projects: ArchiveProject[] = [];
        if (response && Array.isArray(response.projects)) {
          projects = response.projects;
        } else if (Array.isArray(response)) {
          projects = response;
        } else if (response && typeof response === 'object') {
          projects = [response];
        }

        return projects.map(project => ({
          ...project,
          assignedEmployees: (project.assignedEmployees || []).map((employee: any) => {
            if (typeof employee === 'string' && employee !== '') {
              return employee; // Direct URL
            }
            if (employee && typeof employee === 'object' && employee._id && employee.name) {
              return {
                imageUrl: employee.imageUrl || '/images/pf4.png',
                _id: employee._id,
                name: employee.name
              };
            }
            return null;
          }).filter((employee: any) => employee !== null),
          subProjects: project.subProjects || 'None'
        }));
      })
    );
  }

  updateStatus(projectId: string, status: string): Observable<any> {
    const body = {
      projectId,
      projectStatus: status
    };
    return this.http.put(this.statusApiUrl, body);
  }

  deleteProject(projectId: string): Observable<any> {
    return this.http.delete(this.deleteApiUrl, { body: { projectIds: [projectId] } });
  }

  restoreProject(projectId: string): Observable<any> {
    const body = { projectIds: [projectId], isArchive: false };
    return this.http.put(this.restoreApiUrl, body);
  }
}