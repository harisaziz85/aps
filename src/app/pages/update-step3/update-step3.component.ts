import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UpdateService } from '../../core/services/update-service.service';
import { DownloadProjectService } from '../../core/services/download-project.service';
import { DownloadProject } from '../../core/models/download-project';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NavbarComponent } from "../components/navbar/navbar.component";
import { TopbarComponent } from '../components/topbar/topbar.component';
import { FootComponent } from "../components/foot/foot.component";

@Component({
  selector: 'app-update-step3',
  standalone: true,
  templateUrl: './update-step3.component.html',
  styleUrl: './update-step3.component.css',
  imports: [CommonModule, FormsModule, NavbarComponent, TopbarComponent, FootComponent]
})
export class UpdateStep3Component implements OnInit {
  projectId: string | null = null;
  serviceProjectId: string | null = null;
  projectData: DownloadProject | null = null;
  errorMessage: string | null = null;
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
      console.log('Route Params:', params);
      this.projectId = params['id'] || null;
      this.serviceProjectId = this.updateService.getProjectId();
      console.log('Project ID from route:', this.projectId);
      console.log('Project ID from service:', this.serviceProjectId);

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
        console.log('Full Project Data:', data);
        console.log('Hierarchy Data:', data.hierarchy);
        this.projectData = data;
        // Ensure hierarchy exists
        if (!this.projectData.hierarchy) {
          this.projectData.hierarchy = {
            _id: `hierarchy-${Date.now()}-${Math.random().toString(36).substring(2)}`,
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
        this.errorMessage = 'Failed to load project data';
        this.isLoading = false;
      }
    });
  }

  addHierarchyLevel() {
    const newId = `level-${Date.now()}-${Math.random().toString(36).substring(2)}`;
    if (this.projectData?.hierarchy?.levels) {
      this.projectData.hierarchy.levels.push({
        name: '',
        _id: newId
      });
    } else if (this.projectData && this.projectId) {
      this.projectData.hierarchy = {
        _id: `hierarchy-${Date.now()}-${Math.random().toString(36).substring(2)}`,
        projectId: this.projectId,
        levels: [{ name: '', _id: newId }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        __v: 0
      };
    }
  }

  removeHierarchyLevel(index: number) {
    if (this.projectData?.hierarchy?.levels) {
      this.projectData.hierarchy.levels.splice(index, 1);
    }
  }

  goToStep3() {
    if (this.projectId) {
      this.router.navigate(['/pages/updateproject3', this.projectId]);
    }
  }

  saveAndNext() {
    if (this.projectId && this.projectData && this.projectData.hierarchy?._id) {
      const payload = {
        projectId: this.projectId,
        levels: this.getHierarchyLevels().map(level => ({
          name: level.name,
          _id: level._id || `level-${Date.now()}-${Math.random().toString(36).substring(2)}`
        }))
      };

      console.log('Sending payload:', payload);

      this.http.put(`${this.apiUrl}${this.projectData.hierarchy._id}`, payload).subscribe({
        next: (response: any) => {
          console.log('Hierarchy updated successfully:', response);
          // Update local data with response
          if (response.levels) {
            this.projectData!.hierarchy.levels = response.levels.map((level: any) => ({
              name: level.name,
              _id: level._id
            }));
          }
          this.router.navigate(['/pages/updateproject4', this.projectId]);
        },
        error: (error) => {
          console.error('Error updating hierarchy:', error);
          this.errorMessage = error.error?.message || 'Failed to update hierarchy levels';
        }
      });
    } else {
      this.errorMessage = 'Project ID, project data, or hierarchy ID is missing';
    }
  }

  getHierarchyLevels(): { name: string; _id: string }[] {
    return this.projectData?.hierarchy?.levels || [];
  }

  onLevelChange(index: number) {
    console.log('Hierarchy level changed:', this.getHierarchyLevels()[index]);
  }
}