import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ProjectResponse, InstanceResponse, Marker, Document, AttributeTemplateResponse } from '../models/presentation';

@Injectable({
  providedIn: 'root'
})
export class PresentationService {
  private apiUrl = 'https://vps.allpassiveservices.com.au/api/project';

  constructor(private http: HttpClient) {}

  getProjectDetails(projectId: string): Observable<ProjectResponse> {
    return this.http.get<any>(`${this.apiUrl}/download/${projectId}`).pipe(
      map(response => ({
        projectId: response.project._id || '',
        projectName: response.project.projectName || '',
        buildingName: response.project.buildingName || '',
        address: `${response.project.address?.line1 || ''}, ${response.project.address?.line2 || ''}, ${response.project.address?.city || ''}, ${response.project.address?.state || ''}, ${response.project.address?.zip || ''}`,
        client: {
          clientId: response.project.clientInfo?.clientId?._id || '',
          clientName: response.project.clientInfo?.name || '',
          clientPhone: response.project.clientInfo?.phone || ''
        },
        clientName: response.project.clientInfo?.name || '',
        createdAt: response.project.createdAt || '',
        buildingType: response.project.buildingType || '',
        assignedEmployees: response.project.subcontractorInfo ? [{
          employeeId: '',
          name: response.project.subcontractorInfo.contactPerson || '',
          image: ''
        }] : [],
        reports: response.reports || [],
        subProjects: response.hierarchy?.levels?.map((level: any) => ({
          hierarchyLevelId: level._id || '',
          hierarchyName: level.name || '',
          totalInstances: response.instances?.filter((inst: any) => inst.hierarchyLevelId === level._id).length || 0,
          instances: response.instances?.filter((inst: any) => inst.hierarchyLevelId === level._id).map((inst: any) => ({
            instanceId: inst._id || '',
            instanceName: `Instance ${inst.instanceNumber}` || '',
            subProjectCategory: inst.subProjectCategory || ''
          })) || []
        })) || [],
        status: response.project.projectAdministration?.projectStatus || '',
        imageUrl: response.project.imageUrl || null,
        instances: response.instances?.map((inst: any) => ({
          _id: inst._id || '',
          projectId: inst.projectId || '',
          instanceNumber: inst.instanceNumber || 0,
          location: inst.attributes?.find((attr: any) => attr.name === 'Location')?.selectedValue || '',
          type: inst.subProjectCategory || '',
          status: inst.status || '',
          comments: inst.attributes?.find((attr: any) => attr.name === 'Comments')?.selectedValue || '',
          photos: inst.photos || [],
          hierarchyLevelId: inst.hierarchyLevelId || '',
          hierarchyName: response.hierarchy?.levels?.find((level: any) => level._id === inst.hierarchyLevelId)?.name || '',
          subProjectCategory: inst.subProjectCategory || '',
          attributes: inst.attributes || []
        })) || [],
        documents: response.documents?.map((doc: any) => ({
          _id: doc._id || '',
          projectId: doc.projectId || '',
          documentType: doc.documentType || '',
          hierarchyLevel: doc.hierarchyLevel || '',
          files: doc.files?.map((file: any) => ({
            documentName: file.documentName || '',
            documentUrl: file.documentUrl || '',
            version: file.version || 0,
            _id: file._id || '',
            markers: file.markers || []
          })) || [],
          createdAt: doc.createdAt || '',
          updatedAt: doc.updatedAt || '',
          __v: doc.__v || 0
        })) || [],
        hierarchyLevels: response.hierarchy?.levels?.map((level: any) => ({
          hierarchyLevelId: level._id || '',
          hierarchyName: level.name || ''
        })) || []
      }))
    );
  }

  getInstanceDetails(instanceId: string): Observable<InstanceResponse> {
    return this.http.get<{ instance: InstanceResponse }>(`${this.apiUrl}/instance/details/${instanceId}`)
      .pipe(
        map(response => response.instance)
      );
  }

  getInstancesByHierarchy(hierarchyLevelId: string): Observable<InstanceResponse[]> {
    return this.http.get<InstanceResponse[]>(`${this.apiUrl}/instances/hierarchy/${hierarchyLevelId}`);
  }

  getInstanceMarkers(projectId: string, hierarchyLevelId: string, instanceId: string, markers: Marker[]): Observable<{ message: string; data: Document[] }> {
    return this.http.get<{ message: string; data: Document[] }>(
      `${this.apiUrl}/getInstanceMarkers/${projectId}/${hierarchyLevelId}/${instanceId}`
    );
  }

  updateProjectStatus(projectId: string, status: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/updateStatus`, {
      projectId,
      projectStatus: status
    });
  }

  getProjectAttributes(projectId: string): Observable<AttributeTemplateResponse> {
    return this.http.get<AttributeTemplateResponse>(`${this.apiUrl}/attributes/${projectId}`);
  }

  getComplianceStats(projectId: string): Observable<{ total: number, passed: number, failed: number }> {
    return this.http.get<{ total: number, passed: number, failed: number }>(
      `${this.apiUrl}-instance/${projectId}/compliance-stats`
    );
  }

  getDocumentByHierarchy(projectId: string, hierarchyLevelId: string): Observable<{ message: string; data: Document[] }> {
    return this.http.get<{ message: string; data: Document[] }>(
      `${this.apiUrl}/documents/${projectId}/${hierarchyLevelId}`
    );
  }

  getReportsByInstance(projectId: string, instanceId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/reports/${projectId}?instanceId=${instanceId}`);
  }
}