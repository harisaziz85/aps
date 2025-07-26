import { Component, OnInit, HostListener, ElementRef, ViewChildren, QueryList } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UpdateprojectService } from '../../core/services/updateproject.service';
import { DownloadProjectService } from '../../core/services/download-project.service';
import { ClientService } from '../../core/services/client.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from "../components/navbar/navbar.component";
import { TopbarComponent } from '../components/topbar/topbar.component';
import { FootComponent } from "../components/foot/foot.component";
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-update-step1',
  standalone: true,
  templateUrl: './update-step1.component.html',
  styleUrls: ['./update-step1.component.css'],
  imports: [FormsModule, CommonModule, NavbarComponent, FootComponent, TopbarComponent]
})
export class UpdateStep1Component implements OnInit {
  projectId: string | null = null;
  projectData: any | null = null;
  clientNames: string[] = [];
  hierarchyLevelsChangeValue: string = 'No';
  selectedSubProject: string = '';
  dropdownOpen: { [key: string]: boolean } = {};

  @ViewChildren('dropdownContainer') dropdownContainers!: QueryList<ElementRef>;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private updateService: UpdateprojectService,
    private downloadProjectService: DownloadProjectService,
    private clientService: ClientService,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      console.log('Route Params:', params);
      this.projectId = params['id'] || null;
      if (this.projectId && this.projectId !== 'undefined') {
        this.updateService.setProjectId(this.projectId);
        this.fetchProjectData(this.projectId);
        this.fetchClientNames();
      } else {
        console.error('Project ID is missing or undefined');
      }
    });
  }

  private fetchProjectData(projectId: string) {
    this.downloadProjectService.getProjectDetails(projectId).subscribe({
      next: (data: any) => {
        console.log('Project Data:', data);
        this.projectData = data.project;
        this.hierarchyLevelsChangeValue = this.projectData.projectAdministration.hierarchyLevelsChange ? 'Yes' : 'No';
        // subProjects is an array of strings
        this.selectedSubProject = this.projectData.subProjects && this.projectData.subProjects.length > 0 
          ? this.projectData.subProjects[0] 
          : '';
        console.log('subProjects format:', this.projectData.subProjects);
        console.log('Mapped Project Data:', this.projectData);
        this.toastr.success('Project data loaded successfully', 'Success');
      },
      error: (error) => {
        console.error('Error fetching project data:', error);
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
      }
    });
  }

  saveAndNext() {
    if (this.projectId && this.projectData) {
      // Keep subProjects as an array of strings
      this.projectData.subProjects = this.selectedSubProject 
        ? [this.selectedSubProject] 
        : this.projectData.subProjects || [];
      this.projectData.projectAdministration.hierarchyLevelsChange = this.hierarchyLevelsChangeValue === 'Yes';
      console.log('Payload being sent:', JSON.stringify(this.projectData, null, 2));
      this.updateService.saveProjectData(this.projectId, this.projectData).subscribe({
        next: (response) => {
          console.log('Project updated successfully:', response);
          this.router.navigate(['/pages/updateproject2', this.projectId]);
        },
        error: (error) => {
          console.error('Error updating project:', error);
        }
      });
    } else {
      console.error('Project ID or data is missing');
    }
  }

  checkId() {
    const currentId = this.updateService.getProjectId();
    alert(`Current Project ID: ${currentId || 'No ID set'}`);
  }

  toggleDropdown(field: string, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.dropdownOpen = { ...this.dropdownOpen, [field]: !this.dropdownOpen[field] };
  }

  selectOption(field: string, value: string, event: MouseEvent) {
    event.stopPropagation();
    if (field === 'subProjects') {
      this.selectedSubProject = value;
    } else if (field === 'projectStatus') {
      this.projectData.projectAdministration.projectStatus = value;
    } else if (field === 'hierarchyLevelsChange') {
      this.hierarchyLevelsChangeValue = value;
    } else if (field === 'clientName') {
      this.projectData.clientInfo.name = value;
    }
    this.dropdownOpen[field] = false;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    if (this.dropdownContainers) {
      let clickedInside = false;
      this.dropdownContainers.forEach(container => {
        if (container.nativeElement.contains(event.target as Node)) {
          clickedInside = true;
        }
      });
      if (!clickedInside) {
        this.dropdownOpen = {};
      }
    }
  }
}