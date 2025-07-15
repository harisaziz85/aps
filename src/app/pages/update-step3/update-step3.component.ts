import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UpdateService } from '../../core/services/update-service.service';
import { DownloadProjectService } from '../../core/services/download-project.service';
import { DownloadProject } from '../../core/models/download-project';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NavbarComponent } from '../components/navbar/navbar.component';
import { TopbarComponent } from '../components/topbar/topbar.component';
import { FootComponent } from '../components/foot/foot.component';

@Component({
  selector: 'app-update-step3',
  standalone: true,
  templateUrl: './update-step3.component.html',
  styleUrls: ['./update-step3.component.css'],
  imports: [CommonModule, FormsModule, NavbarComponent, TopbarComponent, FootComponent]
})
export class UpdateStep3Component implements OnInit {
  projectId: string | null = null;
  serviceProjectId: string | null = null;
  projectData: DownloadProject | null = null;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  isLoading: boolean = true;
  private apiUrl = 'https://vps.allpassiveservices.com.au/api/updateProject/building-hierarchy/';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private updateService: UpdateService,
    private downloadProjectService: DownloadProjectService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.projectId = params['id'] || null;
      this.serviceProjectId = this.updateService.getProjectId();
      console.log('Project ID from route:', this.projectId, 'Service:', this.serviceProjectId);

      if (this.projectId) {
        this.fetchProjectData(this.projectId);
      } else {
        this.errorMessage = 'No project ID provided in route';
        this.isLoading = false;
      }
    });
  }

  private fetchProjectData(projectId: string) {
    this.isLoading = true;
    this.downloadProjectService.getProjectDetails(projectId).subscribe({
      next: (data: DownloadProject) => {
        console.log('Project Data:', data);
        this.projectData = data;
        if (!this.projectData.hierarchy) {
          this.projectData.hierarchy = {
            _id: `temp-hierarchy-${Date.now()}`,
            projectId: projectId,
            levels: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            __v: 0
          };
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching project data:', error);
        this.errorMessage = `Failed to load project data: ${error.error?.message || error.message}`;
        this.isLoading = false;
      }
    });
  }

  addHierarchyLevel() {
    const newId = `temp-level-${Date.now()}-${Math.random().toString(36).substring(2)}`;
    if (this.projectData) {
      this.projectData.hierarchy = this.projectData.hierarchy || {
        _id: `temp-hierarchy-${Date.now()}`,
        projectId: this.projectId!,
        levels: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        __v: 0
      };
      this.projectData.hierarchy.levels.push({ name: '', _id: newId });
      this.successMessage = 'New hierarchy level added. Save to update on server.';
      this.errorMessage = null;
    }
  }

  removeHierarchyLevel(index: number) {
    if (this.projectData?.hierarchy?.levels?.[index]) {
      const levelId = this.projectData.hierarchy.levels[index]._id;
      if (levelId.startsWith('temp-')) {
        // Local removal for unsaved levels
        this.projectData.hierarchy.levels.splice(index, 1);
        this.successMessage = 'Hierarchy level removed locally. Save to update on server.';
        this.errorMessage = null;
      } else {
        // API call to delete saved level
        this.http.delete(`${this.apiUrl}${this.projectData.hierarchy._id}/level/${levelId}`).subscribe({
          next: (response: any) => {
            console.log('Level deleted:', response);
            this.projectData!.hierarchy!.levels.splice(index, 1);
            this.successMessage = 'Hierarchy level deleted successfully.';
            this.errorMessage = null;
          },
          error: (error) => {
            console.error('Error deleting level:', error);
            this.errorMessage = `Failed to delete level: ${error.error?.message || error.message}`;
            this.successMessage = null;
          }
        });
      }
    }
  }

  saveAndNext() {
    if (!this.projectId || !this.projectData?.hierarchy) {
      this.errorMessage = 'Project ID or hierarchy data missing';
      this.successMessage = null;
      return;
    }

    const payload = {
      projectId: this.projectId,
      levels: this.getHierarchyLevels().map(level => ({
        name: level.name || '',
        _id: level._id.startsWith('temp-') ? undefined : level._id
      }))
    };

    console.log('Payload:', payload);

    const isNewHierarchy = this.projectData.hierarchy._id.startsWith('temp-');
    const url = isNewHierarchy ? this.apiUrl : `${this.apiUrl}${this.projectData.hierarchy._id}`;
    const request = isNewHierarchy ? this.http.post(url, payload) : this.http.put(url, payload);

    request.subscribe({
      next: (response: any) => {
        console.log('Hierarchy saved:', response);
        this.projectData!.hierarchy = response.data;
        this.successMessage = 'Hierarchy saved successfully!';
        this.errorMessage = null;
        this.router.navigate(['/pages/updateproject4', this.projectId]);
      },
      error: (error) => {
        console.error('Error saving hierarchy:', error);
        this.errorMessage = `Failed to save hierarchy: ${error.error?.message || error.message}`;
        this.successMessage = null;
      }
    });
  }

  getHierarchyLevels(): { name: string; _id: string }[] {
    return this.projectData?.hierarchy?.levels || [];
  }

  onLevelChange(index: number) {
    console.log('Level changed:', this.getHierarchyLevels()[index]);
    this.successMessage = 'Level updated locally. Save to update on server.';
    this.errorMessage = null;
  }
}