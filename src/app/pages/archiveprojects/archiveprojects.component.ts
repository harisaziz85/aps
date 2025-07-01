import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { ArchiveProjectService } from '../../core/services/archiveprojects.service';
import { ArchiveProject } from '../../core/models/archiveprojects';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Router, RouterModule } from '@angular/router';
import { FootComponent } from '../components/foot/foot.component';
import { TopbarComponent } from '../components/topbar/topbar.component';
import { FormsModule } from '@angular/forms';
import { SvgIconsComponent } from '../../shared/svg-icons/svg-icons.component';

@Component({
  selector: 'app-archiveprojects',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, RouterModule, FootComponent, TopbarComponent, FormsModule, SvgIconsComponent],
  templateUrl: './archiveprojects.component.html',
  styleUrls: ['./archiveprojects.component.css'],
})
export class ArchiveProjectComponent implements OnInit {
  faTimes = faTimes;
  projects: ArchiveProject[] = [];
  filteredProjects: ArchiveProject[] = [];
  searchQuery: string = '';
  showDropdownIndex: number | null = null;
  modalAction: string = '';
  modalProject: ArchiveProject | null = null;
  showBulkModal: boolean = false;
  actionInput: string = '';
  isLoading: boolean = true;
  errorMessage: string | null = null;
  currentPage: number = 1;
  totalPages: number = 1;
  projectsPerPage: number = 10;
  selectedProjectIds: string[] = [];
  allProjects: ArchiveProject[] = [];

  constructor(
    private archiveProjectService: ArchiveProjectService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(page: number = 1): void {
    this.isLoading = true;
    this.currentPage = page;
    this.archiveProjectService.getAllProjects(page).subscribe({
      next: (data: ArchiveProject[]) => {
        console.log('API Response:', data);
        this.allProjects = data.map(project => ({
          ...project,
          status: this.normalizeStatus(project.status)
        }));
        this.filteredProjects = this.allProjects.slice(
          (this.currentPage - 1) * this.projectsPerPage,
          this.currentPage * this.projectsPerPage
        );
        this.totalPages = Math.ceil(this.allProjects.length / this.projectsPerPage) || 1;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error fetching projects:', err);
        this.errorMessage = 'Failed to load projects. Please try again.';
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  searchProjects(): void {
    const query = this.searchQuery.trim().toLowerCase();
    if (query) {
      this.filteredProjects = this.allProjects.filter(project =>
        (project.projectName || '').toLowerCase().includes(query) ||
        (project.buildingName || '').toLowerCase().includes(query)
      );
    } else {
      this.filteredProjects = this.allProjects.slice(
        (this.currentPage - 1) * this.projectsPerPage,
        this.currentPage * this.projectsPerPage
      );
    }
    this.totalPages = Math.ceil(this.filteredProjects.length / this.projectsPerPage) || 1;
    this.currentPage = 1;
    this.cdr.detectChanges();
  }

  normalizeStatus(status: string): string {
    if (!status) return 'Active';
    const lowerStatus = status.toLowerCase();
    if (['to-do', 'todo', 'in progress', 'inprogress', 'active'].includes(lowerStatus)) return 'Active';
    if (['completed', 'complete'].includes(lowerStatus)) return 'Completed';
    return 'Active';
  }

  getAssigneeImages(employees: (string | { imageUrl: string; _id: string; name: string } | null)[]): string[] {
    if (!employees || employees.length === 0 || employees.every(emp => emp === null || emp === '')) {
      return ['/images/pf4.png'];
    }
    return employees
      .filter((emp): emp is string | { imageUrl: string; _id: string; name: string } => emp !== null && emp !== '')
      .map(emp => {
        if (typeof emp === 'string') {
          return emp;
        }
        return emp.imageUrl || '/images/pf4.png';
      });
  }

  getInstanceBadges(subProjects: string): string[] {
    if (subProjects === 'None') return [];
    return subProjects ? subProjects.split(',').map(item => item.trim()) : [];
  }

  toggleSelectAll(): void {
    if (this.selectedProjectIds.length === this.filteredProjects.length) {
      this.selectedProjectIds = [];
    } else {
      this.selectedProjectIds = this.filteredProjects.map(project => project.projectId);
    }
    this.cdr.detectChanges();
  }

  isAllSelected(): boolean {
    return this.filteredProjects.length > 0 && this.selectedProjectIds.length === this.filteredProjects.length;
  }

  toggleProjectSelection(projectId: string, event: Event): void {
    event.stopPropagation();
    if (this.selectedProjectIds.includes(projectId)) {
      this.selectedProjectIds = this.selectedProjectIds.filter(id => id !== projectId);
    } else {
      this.selectedProjectIds.push(projectId);
    }
    this.cdr.detectChanges();
  }

  isProjectSelected(projectId: string): boolean {
    return this.selectedProjectIds.includes(projectId);
  }

  changeStatus(project: ArchiveProject, newStatus: string, event: Event): void {
    event.stopPropagation();
    console.log('Changing status to:', newStatus, 'for project:', project);
    this.isLoading = true;
    this.archiveProjectService.updateStatus(project.projectId, newStatus).subscribe({
      next: () => {
        project.status = newStatus;
        console.log('Updated status:', project.status);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error updating status:', err);
        this.errorMessage = 'Failed to update status. Please try again.';
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  getStatusStyle(status: string): { class: string; style: string } {
    switch (status) {
      case 'Completed':
        return {
          class: 'custom-bg-success',
          style: 'background-color:rgba(115, 242, 181, 1); color: black; border-radius: 10px; padding: 10px 15px;'
        };
      case 'Active':
        return {
          class: 'custom-bg-yellow',
          style: 'background-color: rgba(255, 224, 102, 1); color: black; border-radius: 10px; padding: 10px 15px;'
        };
      default:
        return {
          class: 'custom-bg-yellow',
          style: 'background-color:rgba(255, 224, 102, 1); color: black; border-radius: 10px; padding: 10px 15px;'
        };
    }
  }

  toggleDropdown(index: number, event: Event): void {
    event.stopPropagation();
    this.showDropdownIndex = this.showDropdownIndex === index ? null : index;
    this.cdr.detectChanges();
  }

  openModal(action: string, project: ArchiveProject, event: Event): void {
    event.stopPropagation();
    this.modalAction = action;
    this.modalProject = project;
    this.actionInput = '';
    this.showDropdownIndex = null;
    this.showBulkModal = false;
    this.cdr.detectChanges();
  }

  openBulkModal(action: string): void {
    this.modalAction = action;
    this.showBulkModal = true;
    this.modalProject = null;
    this.actionInput = '';
    this.cdr.detectChanges();
  }

  confirmAction(): void {
    if (!this.modalProject || this.actionInput.toLowerCase() !== this.modalAction.toLowerCase()) {
      alert(`Please type "${this.modalAction}" to confirm.`);
      return;
    }

    if (this.modalAction.toLowerCase() === 'delete') {
      this.archiveProjectService.deleteProject(this.modalProject.projectId).subscribe({
        next: () => {
          this.allProjects = this.allProjects.filter((p) => p.projectId !== this.modalProject!.projectId);
          this.searchProjects();
          this.selectedProjectIds = this.selectedProjectIds.filter(id => id !== this.modalProject!.projectId);
          this.closeModal();
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          console.error('Error deleting project:', err);
          this.errorMessage = 'Failed to delete project. Please try again.';
          this.cdr.detectChanges();
        },
      });
    } else if (this.modalAction.toLowerCase() === 'restore') {
      this.archiveProjectService.restoreProject(this.modalProject.projectId).subscribe({
        next: () => {
          this.allProjects = this.allProjects.filter((p) => p.projectId !== this.modalProject!.projectId);
          this.searchProjects();
          this.selectedProjectIds = this.selectedProjectIds.filter(id => id !== this.modalProject!.projectId);
          this.closeModal();
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          console.error('Error restoring project:', err);
          this.errorMessage = 'Failed to restore project. Please try again.';
          this.cdr.detectChanges();
        },
      });
    }
  }

  confirmBulkAction(): void {
    if (this.actionInput.toLowerCase() !== this.modalAction.toLowerCase()) {
      alert(`Please type "${this.modalAction}" to confirm.`);
      return;
    }

    this.isLoading = true;
    const action = this.modalAction.toLowerCase() === 'delete' ? this.archiveProjectService.deleteProject : this.archiveProjectService.restoreProject;
    const requests = this.selectedProjectIds.map(projectId =>
      action.call(this.archiveProjectService, projectId).toPromise()
    );

    Promise.all(requests)
      .then(() => {
        this.allProjects = this.allProjects.filter(p => !this.selectedProjectIds.includes(p.projectId));
        this.searchProjects();
        this.selectedProjectIds = [];
        this.closeBulkModal();
        this.isLoading = false;
        this.cdr.detectChanges();
      })
      .catch((err: any) => {
        console.error(`Error ${this.modalAction.toLowerCase()} projects:`, err);
        this.errorMessage = `Failed to ${this.modalAction.toLowerCase()} projects. Please try again.`;
        this.isLoading = false;
        this.cdr.detectChanges();
      });
  }

  closeModal(): void {
    this.modalProject = null;
    this.modalAction = '';
    this.actionInput = '';
    this.showDropdownIndex = null;
    this.cdr.detectChanges();
  }

  closeBulkModal(): void {
    this.showBulkModal = false;
    this.modalAction = '';
    this.actionInput = '';
    this.cdr.detectChanges();
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.loadProjects(page);
      this.selectedProjectIds = [];
    }
  }

  cancelSelection(): void {
    this.selectedProjectIds = [];
    this.cdr.detectChanges();
  }

  navigateToPresentation(projectId: string): void {
    this.router.navigate(['/pages/presentation', projectId]);
  }
}