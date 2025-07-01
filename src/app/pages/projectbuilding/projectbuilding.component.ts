
import { Component, OnInit } from '@angular/core';
import { ProjectService } from '../../core/services/project.service';
import { ProjectResponse } from '../../core/models/project';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Router, RouterLink } from '@angular/router';
import { TopbarComponent } from '../components/topbar/topbar.component';
import { FootComponent } from '../components/foot/foot.component';
import { SvgIconsComponent } from "../../shared/svg-icons/svg-icons.component";

@Component({
  selector: 'app-projectbuilding',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FontAwesomeModule,
    RouterLink,
    TopbarComponent,
    FootComponent,
    SvgIconsComponent
  ],
  templateUrl: './projectbuilding.component.html',
  styleUrls: ['./projectbuilding.component.css']
})
export class ProjectbuildingComponent implements OnInit {
  projects: any[] = [];
  filteredProjects: any[] = [];
  searchQuery: string = '';
  modalAction: string = '';
  modalProject: any = null;
  showBulkModal: boolean = false;
  confirmInput: string = '';
  isLoading: boolean = false;
  selectAll: boolean = false;
  selectedProjects: Set<string> = new Set();
  showDropdownIndex: number | null = null;

  constructor(private projectService: ProjectService, private router: Router) {}

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    this.isLoading = true;
    this.projectService.getAllProjects().subscribe({
      next: (response: ProjectResponse) => {
        this.projects = response.projects.map(project => ({
          id: project.projectId,
          name: project.projectName,
          building: project.buildingName,
          client: project.client?.clientName || 'N/A',
          status: this.normalizeStatus(project.status),
          instances: project.subProjects || 'No subprojects',
          assignees: project.assignedEmployees
            ?.filter(emp => emp !== null && typeof emp === 'string')
            .map(emp => ({
              image: emp || 'assets/images/pi.png',
              name: 'Unknown'
            })) || [],
          hasValidAssignees: project.assignedEmployees?.filter(emp => emp !== null && typeof emp === 'string').length > 0,
          selected: false
        }));
        this.applySearch();
        this.isLoading = false;
        console.log('API Response:', response);
        console.log('Processed projects:', this.projects);
      },
      error: (error) => {
        console.error('Error fetching projects:', error);
        this.isLoading = false;
        alert('Failed to load projects: ' + (error.message || 'Unknown error'));
      }
    });
  }

  searchProjects(): void {
    this.applySearch();
  }

  applySearch(): void {
    const query = this.searchQuery.trim().toLowerCase();
    if (query) {
      this.filteredProjects = this.projects.filter(project =>
        (project.name || '').toLowerCase().includes(query) ||
        (project.building || '').toLowerCase().includes(query) ||
        (project.client || '').toLowerCase().includes(query)
      );
    } else {
      this.filteredProjects = [...this.projects];
    }
  }

  getInstanceBadges(instances: string): string[] {
    return instances ? instances.split(',').map(item => item.trim()) : [];
  }

  normalizeStatus(status: string | undefined): string {
    if (!status) return 'Active';
    const normalized = status.trim().toLowerCase().replace(/\s+/g, ' ');
    if (['active', 'in progress', 'inprogress', 'to do', 'todo', 'to-do'].includes(normalized)) return 'Active';
    if (['completed', 'complete'].includes(normalized)) return 'Completed';
    return 'Active';
  }

  changeStatus(project: any, newStatus: string): void {
    if (!project?.id) {
      console.error('Invalid project ID');
      return;
    }
    const apiStatus = newStatus === 'Active' ? 'Active' : 'Completed';
    this.projectService.updateProjectStatus(project.id, apiStatus).subscribe({
      next: () => {
        project.status = this.normalizeStatus(apiStatus);
        this.applySearch();
      },
      error: (error) => {
        console.error('Error updating status:', error);
        alert('Failed to update status: ' + (error.message || 'Unknown error'));
      }
    });
  }

  toggleDropdown(index: number, event: Event): void {
    event.stopPropagation();
    this.showDropdownIndex = this.showDropdownIndex === index ? null : index;
  }

  openModal(action: string, project: any, event: Event): void {
    event.stopPropagation();
    if (project) {
      this.modalAction = action;
      this.modalProject = project;
      this.confirmInput = '';
      this.showBulkModal = false;
    }
  }

  openBulkModal(action: string): void {
    this.modalAction = action;
    this.showBulkModal = true;
    this.modalProject = null;
    this.confirmInput = '';
  }

  closeBulkModalAction(): void {
    this.showBulkModal = false;
    this.modalAction = '';
    this.confirmInput = '';
  }

  confirmAction(): void {
    if (!this.modalProject?.id || this.confirmInput.toLowerCase() !== this.modalAction.toLowerCase()) {
      alert(`Please type "${this.modalAction}" to confirm.`);
      return;
    }

    const action$ = this.modalAction === 'Delete'
      ? this.projectService.deleteProject([this.modalProject.id])
      : this.projectService.archiveProject(this.modalProject.id);

    action$.subscribe({
      next: () => {
        this.projects = this.projects.filter(p => p.id !== this.modalProject.id);
        this.applySearch();
        this.modalProject = null;
        this.modalAction = '';
        this.showDropdownIndex = null;
        this.selectedProjects.delete(this.modalProject.id);
        this.loadProjects();
      },
      error: (error) => {
        console.error(`Error ${this.modalAction.toLowerCase()} project:`, error);
        alert(`Failed to ${this.modalAction.toLowerCase()} project: ${error.message || 'Unknown error'}`);
      }
    });
  }

  confirmBulkAction(): void {
    if (this.confirmInput.toLowerCase() !== this.modalAction.toLowerCase()) {
      alert(`Please type "${this.modalAction}" to confirm.`);
      return;
    }

    const projectIds = Array.from(this.selectedProjects);
    if (projectIds.length === 0) {
      alert('No projects selected.');
      return;
    }

    this.isLoading = true;
    if (this.modalAction === 'Delete') {
      this.projectService.deleteProject(projectIds).subscribe({
        next: () => {
          this.projects = this.projects.filter(p => !projectIds.includes(p.id));
          this.applySearch();
          this.selectedProjects.clear();
          this.selectAll = false;
          this.filteredProjects.forEach(p => p.selected = false);
          this.showBulkModal = false;
          this.modalAction = '';
          this.confirmInput = '';
          this.isLoading = false;
          this.loadProjects();
        },
        error: (error) => {
          console.error('Error deleting projects:', error);
          alert(`Failed to delete projects: ${error.message || 'Unknown error'}`);
          this.isLoading = false;
        }
      });
    } else if (this.modalAction === 'Archive') {
      const archiveRequests = projectIds.map(id => this.projectService.archiveProject(id).toPromise());
      Promise.all(archiveRequests)
        .then(() => {
          this.projects = this.projects.filter(p => !projectIds.includes(p.id));
          this.applySearch();
          this.selectedProjects.clear();
          this.selectAll = false;
          this.filteredProjects.forEach(p => p.selected = false);
          this.showBulkModal = false;
          this.modalAction = '';
          this.confirmInput = '';
          this.isLoading = false;
          this.loadProjects();
        })
        .catch(error => {
          console.error('Error archiving projects:', error);
          alert(`Failed to archive projects: ${error.message || 'Unknown error'}`);
          this.isLoading = false;
        });
    }
  }

  cancelSelection(): void {
    this.selectedProjects.clear();
    this.selectAll = false;
    this.filteredProjects.forEach(p => p.selected = false);
  }

  toggleSelectAll(): void {
    this.selectAll = !this.selectAll;
    this.filteredProjects.forEach(project => {
      project.selected = this.selectAll;
      if (this.selectAll) {
        this.selectedProjects.add(project.id);
      } else {
        this.selectedProjects.delete(project.id);
      }
    });
  }

  toggleProjectSelection(project: any, event: Event): void {
    event.stopPropagation();
    project.selected = !project.selected;
    if (project.selected) {
      this.selectedProjects.add(project.id);
    } else {
      this.selectedProjects.delete(project.id);
    }
    this.selectAll = this.filteredProjects.every(p => p.selected);
  }

  navigateToPresentation(projectId: string): void {
    this.router.navigate(['/pages/presentation', projectId]);
  }
}