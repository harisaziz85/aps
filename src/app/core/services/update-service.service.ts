// update.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UpdateService {
  private projectIdSubject = new BehaviorSubject<string | null>(null);
  projectId$ = this.projectIdSubject.asObservable();

  setProjectId(id: string) {
    this.projectIdSubject.next(id);
    localStorage.setItem('projectId', id); // Save to local storage
  }

  getProjectId(): string | null {
    return this.projectIdSubject.value || localStorage.getItem('projectId');
  }

  saveProjectData(id: string, data: any) {
    localStorage.setItem(`projectData_${id}`, JSON.stringify(data));
  }

  getProjectData(id: string): any {
    const data = localStorage.getItem(`projectData_${id}`);
    return data ? JSON.parse(data) : null;
  }

  clearProjectData(id: string) {
    localStorage.removeItem('projectId');
    localStorage.removeItem(`projectData_${id}`);
  }
}