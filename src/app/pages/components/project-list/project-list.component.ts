import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ProjectService } from '../../../core/services/project.service';
import { ProjectDisplay, Project, Employee } from '../../../core/models/project';
import { SvgIconsComponent } from '../../../shared/svg-icons/svg-icons.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule, SvgIconsComponent],
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.css']
})
export class ProjectListComponent implements OnInit {
  statusOptions: string[] = ['Active', 'Waiting For Approval', 'Completed'];
  projects: ProjectDisplay[] = [];
  filteredProjects: ProjectDisplay[] = [];
  searchQuery: string = '';
  loading = true;
  error = '';
  updatingProjects = new Set<string>();
  showDropdown = new Set<string>();
  showStatusDropdown = new Set<string>();
  showModal = false;
  modalAction: 'archive' | 'delete' = 'archive';
  selectedProject: ProjectDisplay | null = null;
  confirmationInput: string = '';
  isAllSelected = false;
  selectedProjects = new Set<string>();

  constructor(private projectService: ProjectService, private router: Router) {}

  ngOnInit(): void {
    this.fetchProjects();
  }

  fetchProjects(): void {
    this.loading = true;
    this.error = '';
    this.projectService.getAllProjects().subscribe({
      next: (response) => {
        this.projects = response.projects
          .map(project => ({
            id: project.projectId,
            name: project.projectName,
            building: project.buildingName,
            status: project.status,
            assignee: this.getAssigneeProfiles(project.assignedEmployees),
            description: project.subProjects || 'No subprojects'
          }))
          .sort((a, b) => parseInt(b.id, 16) - parseInt(a.id, 16))
          .slice(0, 4);
        this.filteredProjects = [...this.projects];
        this.loading = false;
        this.updateSelectAll();
        console.log('API Response:', response);
        console.log('Processed projects:', this.projects);
      },
      error: (error) => {
        console.error('Error fetching projects:', error);
        this.error = 'Failed to load projects. Please try again.';
        this.loading = false;
      }
    });
  }

  applySearch(): void {
    const query = this.searchQuery.trim().toLowerCase();
    if (query) {
      this.filteredProjects = this.projects.filter(project =>
        (project.name || '').toLowerCase().includes(query) ||
        (project.building || '').toLowerCase().includes(query)
      );
    } else {
      this.filteredProjects = [...this.projects];
    }
    this.updateSelectAll();
  }

  searchProjects(): void {
    this.applySearch();
  }

  getDescriptionBadges(description: string): string[] {
    return description ? description.split(',').map(item => item.trim()) : [];
  }

  getAssigneeProfiles(employees: (Employee | string | null)[]): string[] {
    if (!employees || employees.length === 0 || employees.every(emp => emp === null || emp === '')) {
      return ['/images/pf4.png'];
    }
    return employees
      .filter((emp): emp is Employee | string => emp !== null && emp !== '')
      .map(emp => {
        if (typeof emp === 'string') {
          return emp;
        } else {
          return emp.image || '/images/pf4.png';
        }
      });
  }

  getAssigneeImages(assignee: string | string[]): string[] {
    if (!assignee) {
      return ['/images/pf4.png'];
    }
    return Array.isArray(assignee) ? assignee : [assignee];
  }

  updateStatus(project: ProjectDisplay): void {
    if (this.updatingProjects.has(project.id)) return;

    this.updatingProjects.add(project.id);
    const originalStatus = project.status;

    this.projectService.updateProjectStatus(project.id, project.status).subscribe({
      next: () => {
        console.log(`Status updated for project ${project.id} to ${project.status}`);
        this.updatingProjects.delete(project.id);
      },
      error: (error) => {
        console.error('Error updating status:', error);
        this.error = error.status === 404
          ? 'Project not found or update endpoint unavailable.'
          : 'Failed to update project status. Please try again.';
        project.status = originalStatus;
        this.updatingProjects.delete(project.id);
        this.fetchProjects();
      }
    });
  }

  isUpdating(projectId: string): boolean {
    return this.updatingProjects.has(projectId);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Active':
        return 'select-active';
      case 'Waiting For Approval':
        return 'select-waiting';
      case 'Completed':
        return 'select-completed';
      default:
        return 'select-default';
    }
  }

  toggleDropdown(projectId: string, event: Event): void {
    event.stopPropagation();
    if (this.showDropdown.has(projectId)) {
      this.showDropdown.delete(projectId);
    } else {
      this.showDropdown.clear();
      this.showDropdown.add(projectId);
    }
  }

  toggleStatusDropdown(projectId: string, event: Event): void {
    event.stopPropagation();
    if (this.showStatusDropdown.has(projectId)) {
      this.showStatusDropdown.delete(projectId);
    } else {
      this.showStatusDropdown.clear();
      this.showStatusDropdown.add(projectId);
    }
  }

  selectStatus(project: ProjectDisplay, status: string, event: Event): void {
    event.stopPropagation();
    project.status = status;
    this.showStatusDropdown.delete(project.id); // Close dropdown immediately
    this.updateStatus(project);
  }

  openModal(project: ProjectDisplay, action: 'archive' | 'delete', event: Event): void {
    event.stopPropagation();
    this.selectedProject = project;
    this.modalAction = action;
    this.showModal = true;
    this.showDropdown.clear();
    this.confirmationInput = '';
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedProject = null;
    this.confirmationInput = '';
  }

  confirmAction(): void {
    if (!this.selectedProject) return;

    const projectId = this.selectedProject.id;
    this.updatingProjects.add(projectId);

    const actionObservable = this.modalAction === 'archive'
      ? this.projectService.archiveProject(projectId)
      : this.projectService.deleteProject([projectId]);

    actionObservable.subscribe({
      next: () => {
        console.log(`${this.modalAction} successful for project ${projectId}`);
        this.fetchProjects();
        this.closeModal();
        this.updatingProjects.delete(projectId);
      },
      error: (error) => {
        console.error(`Error ${this.modalAction} project:`, error);
        this.error = `Failed to ${this.modalAction} project. Please try again.`;
        this.updatingProjects.delete(projectId);
        this.closeModal();
      }
    });
  }

  toggleSelectAll(): void {
    this.isAllSelected = !this.isAllSelected;
    this.selectedProjects.clear();
    if (this.isAllSelected) {
      this.filteredProjects.forEach(project => this.selectedProjects.add(project.id));
    }
    this.updateSelectAll();
  }

  updateSelectAll(): void {
    this.isAllSelected = this.filteredProjects.length > 0 &&
      this.filteredProjects.every(project => this.selectedProjects.has(project.id));
  }

  toggleProjectSelection(projectId: string, event: Event): void {
    event.stopPropagation();
    if (this.selectedProjects.has(projectId)) {
      this.selectedProjects.delete(projectId);
    } else {
      this.selectedProjects.add(projectId);
    }
    this.updateSelectAll();
  }

  navigateToPresentation(projectId: string): void {
    this.router.navigate(['/pages/presentation', projectId]);
  }

  navigateToSubprojects(projectId: string): void {
    this.router.navigate(['/pages/subprojects', projectId]);
  }

  navigateToUpdateProject(projectId: string): void {
    this.router.navigate(['/pages/updateproject', projectId]);
  }
}