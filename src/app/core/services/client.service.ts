import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Client } from '../models/client';
import { Project } from '../models/project';

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private baseUrl = 'https://vps.allpassiveservices.com.au/api';

  constructor(private http: HttpClient) {}

  getClients(): Observable<{ totalClients: number; clients: Client[] }> {
    return this.http.get<{ totalClients: number; clients: Client[] }>(`${this.baseUrl}/client/get-clients`);
  }

  registerClient(clientData: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}/client/register-client`, clientData);
  }

  getClientProjects(clientId: string, status: string): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.baseUrl}/client/projects/${clientId}/${status}`);
  }

  updateProjectStatus(projectId: string, status: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/project/updateStatus`, { projectId, projectStatus: status });
  }
}