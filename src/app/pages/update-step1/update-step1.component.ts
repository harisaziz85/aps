import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UpdateprojectService } from '../../core/services/updateproject.service';
import { DownloadProjectService } from '../../core/services/download-project.service';
import { ClientService } from '../../core/services/client.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from "../components/navbar/navbar.component";
import { TopbarComponent } from '../components/topbar/topbar.component';
import { FootComponent } from "../components/foot/foot.component";

@Component({
  selector: 'app-update-step1',
  standalone: true,
  templateUrl: './update-step1.component.html',
  styleUrls: ['./update-step1.component.css'],
  imports: [FormsModule, CommonModule, NavbarComponent, TopbarComponent, FootComponent]
})
export class UpdateStep1Component implements OnInit {
  projectId: string | null = null;
  projectData: any | null = null;
  errorMessage: string | null = null;
  clientNames: string[] = [];
  hierarchyLevelsChangeValue: string = 'No';
  selectedSubProject: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private updateService: UpdateprojectService,
    private downloadProjectService: DownloadProjectService,
    private clientService: ClientService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      console.log('Route Params:', params);
      this.projectId = params['id'] || null;
      if (this.projectId) {
        this.updateService.setProjectId(this.projectId);
        this.fetchProjectData(this.projectId);
        this.fetchClientNames();
      } else {
        this.errorMessage = 'No project ID provided';
      }
    });
  }

  private fetchProjectData(projectId: string) {
    this.downloadProjectService.getProjectDetails(projectId).subscribe({
      next: (data: any) => {
        console.log('Project Data:', data);
        this.projectData = data.project;
        this.hierarchyLevelsChangeValue = this.projectData.projectAdministration.hierarchyLevelsChange ? 'Yes' : 'No';
        this.selectedSubProject = this.projectData.subProjects[0] || '';
        console.log('Mapped Project Data:', this.projectData);
      },
      error: (error) => {
        console.error('Error fetching project data:', error);
        this.errorMessage = 'Failed to load project data';
      }
    });
  }

  private fetchClientNames() {
    this.clientService.getClients().subscribe({
      next: (data: any) => {
        console.log('Client Data:', data);
        this.clientNames = data.clients.map((client: any) => client.name);
        console.log('Client Names:', this.clientNames);
      },
      error: (error) => {
        console.error('Error fetching client data:', error);
        this.errorMessage = 'Failed to load client data';
      }
    });
  }

  saveAndNext() {
    if (this.projectId && this.projectData) {
      // Ensure subProjects is an array with the selected value
      this.projectData.subProjects = this.selectedSubProject ? [this.selectedSubProject] : this.projectData.subProjects;
      this.projectData.projectAdministration.hierarchyLevelsChange = this.hierarchyLevelsChangeValue === 'Yes';
      this.updateService.saveProjectData(this.projectId, this.projectData).subscribe({
        next: (response) => {
          console.log('Project updated successfully:', response);
          this.router.navigate(['/pages/updateproject2', this.projectId]);
        },
        error: (error) => {
          console.error('Error updating project:', error);
          this.errorMessage = error.message;
        }
      });
    } else {
      this.errorMessage = 'Project ID or data is missing';
    }
  }

  checkId() {
    const currentId = this.updateService.getProjectId();
    alert(`Current Project ID: ${currentId || 'No ID set'}`);
  }
}