import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { ProjectService } from '../../core/services/project.service';
import { ProjectResponse } from '../../core/models/project';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Router, RouterLink } from '@angular/router';
import { TopbarComponent } from '../components/topbar/topbar.component';
import { FootComponent } from '../components/foot/foot.component';
import { SvgIconsComponent } from '../../shared/svg-icons/svg-icons.component';
import { HttpClient } from '@angular/common/http';

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
  showStatusDropdownIndex: number | null = null;
  showNoteModal: boolean = false;
  selectedNote: string | null = null;
  selectedProject: any = null;
  statusOptions: string[] = ['Active', 'Waiting For Approval', 'Completed'];

  constructor(
    private projectService: ProjectService,
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.custom-dropdown') && !target.closest('.dropdown-content1')) {
      this.closeAllDropdowns();
      this.cdr.detectChanges();
    }
  }

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
          jobNotes: 'N/A',
          assignees: project.assignedEmployees
            ?.filter(emp => emp !== null && typeof emp === 'string')
            .map(emp => ({
              image: emp || 'assets/images/pi.png',
              name: 'Unknown'
            })) || [],
          hasValidAssignees: project.assignedEmployees?.filter(emp => emp !== null && typeof emp === 'string').length > 0,
          selected: false
        }));

        const jobNotesRequests = this.projects.map(project =>
          this.http.get(`https://vps.allpassiveservices.com.au/api/jobNotes/project/${project.id}`).toPromise()
            .then((response: any) => {
              const notes = response?.data?.map((note: any) => note.title).join(', ') || 'N/A';
              project.jobNotes = notes;
            })
            .catch(error => {
              console.error(`Error fetching job notes for project ${project.id}:`, error);
              project.jobNotes = 'N/A';
            })
        );

        Promise.all(jobNotesRequests).then(() => {
          this.applySearch();
          this.isLoading = false;
          console.log('API Response:', response);
          console.log('Processed projects:', this.projects);
          this.cdr.detectChanges();
        }).catch(error => {
          console.error('Error fetching job notes:', error);
          this.applySearch();
          this.isLoading = false;
          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        console.error('Error fetching projects:', error);
        this.isLoading = false;
        alert('Failed to load projects: ' + (error.message || 'Unknown error'));
        this.cdr.detectChanges();
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
        (project.client || '').toLowerCase().includes(query) ||
        (project.jobNotes || '').toLowerCase().includes(query)
      );
    } else {
      this.filteredProjects = [...this.projects];
    }
    
    // Update selectAll state based on current filtered projects
    this.updateSelectAllState();
    this.cdr.detectChanges();
  }

  // New method to properly manage selectAll state
  updateSelectAllState(): void {
    if (this.filteredProjects.length === 0) {
      this.selectAll = false;
      return;
    }
    
    // Check if all filtered projects are selected
    this.selectAll = this.filteredProjects.every(project => 
      this.selectedProjects.has(project.id) || project.selected
    );
    
    // Update individual project selected state based on selectedProjects Set
    this.filteredProjects.forEach(project => {
      project.selected = this.selectedProjects.has(project.id);
    });
  }

  getInstanceBadges(instances: string): string[] {
    return instances ? instances.split(',').map(item => item.trim()) : [];
  }

  getJobNotesBadges(jobNotes: string): string[] {
    return jobNotes && jobNotes !== 'N/A' ? jobNotes.split(',').map(note => note.trim()) : [];
  }

  normalizeStatus(status: string | undefined): string {
    if (!status) return 'Active';
    const normalized = status.trim().toLowerCase().replace(/\s+/g, ' ');
    if (['active', 'in progress', 'inprogress', 'to do', 'todo', 'to-do'].includes(normalized)) return 'Active';
    if (['completed', 'complete'].includes(normalized)) return 'Completed';
    if (['waiting for approval', 'pending approval', 'pending'].includes(normalized)) return 'Waiting For Approval';
    return 'Active';
  }

  changeStatus(project: any, newStatus: string, event: Event): void {
    event.stopPropagation();
    if (!project?.id) {
      console.error('Invalid project ID');
      return;
    }
    this.projectService.updateProjectStatus(project.id, newStatus).subscribe({
      next: () => {
        project.status = this.normalizeStatus(newStatus);
        this.applySearch();
        this.closeAllDropdowns();
        setTimeout(() => this.cdr.detectChanges(), 0);
      },
      error: (error) => {
        console.error('Error updating status:', error);
        alert('Failed to update status: ' + (error.message || 'Unknown error'));
        this.closeAllDropdowns();
        setTimeout(() => this.cdr.detectChanges(), 0);
      }
    });
  }

  toggleDropdown(index: number, event: Event): void {
    event.stopPropagation();
    this.showStatusDropdownIndex = null;
    this.showDropdownIndex = this.showDropdownIndex === index ? null : index;
    this.cdr.detectChanges();
  }

  toggleStatusDropdown(index: number, event: Event): void {
    event.stopPropagation();
    this.showDropdownIndex = null;
    this.showStatusDropdownIndex = this.showStatusDropdownIndex === index ? null : index;
    this.cdr.detectChanges();
  }

  openModal(action: string, project: any, event: Event): void {
    event.stopPropagation();
    if (project) {
      this.modalAction = action;
      this.modalProject = project;
      this.confirmInput = '';
      this.showBulkModal = false;
      this.closeAllDropdowns();
      this.cdr.detectChanges();
    }
  }

  openBulkModal(action: string): void {
    this.modalAction = action;
    this.showBulkModal = true;
    this.modalProject = null;
    this.confirmInput = '';
    this.closeAllDropdowns();
    this.cdr.detectChanges();
  }

  closeBulkModalAction(): void {
    this.showBulkModal = false;
    this.modalAction = '';
    this.confirmInput = '';
    this.closeAllDropdowns();
    this.cdr.detectChanges();
  }

  openNoteModal(note: string, project: any, event: Event): void {
    event.stopPropagation();
    this.selectedNote = note;
    this.selectedProject = project;
    this.showNoteModal = true;
    this.closeAllDropdowns();
    this.cdr.detectChanges();
  }

  closeNoteModal(): void {
    this.showNoteModal = false;
    this.selectedNote = null;
    this.selectedProject = null;
    this.closeAllDropdowns();
    this.cdr.detectChanges();
  }

  closeAllDropdowns(): void {
    this.showDropdownIndex = null;
    this.showStatusDropdownIndex = null;
  }

  confirmAction(): void {
    if (!this.modalProject?.id) {
      alert('No project selected.');
      return;
    }
    if (this.modalAction === 'Delete' && this.confirmInput.toLowerCase() !== 'delete') {
      alert('Please type "Delete" to confirm.');
      return;
    }

    const action$ = this.modalAction === 'Delete'
      ? this.projectService.deleteProject([this.modalProject.id])
      : this.projectService.archiveProject(this.modalProject.id);

    action$.subscribe({
      next: () => {
        // Remove from selectedProjects Set
        this.selectedProjects.delete(this.modalProject.id);
        
        // Remove from projects array
        this.projects = this.projects.filter(p => p.id !== this.modalProject.id);
        
        // Update filtered projects and selectAll state
        this.applySearch();
        
        // Clear modal
        this.modalProject = null;
        this.modalAction = '';
        this.closeAllDropdowns();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error(`Error ${this.modalAction.toLowerCase()} project:`, error);
        alert(`Failed to ${this.modalAction.toLowerCase()} project: ${error.message || 'Unknown error'}`);
        this.cdr.detectChanges();
      }
    });
  }

  confirmBulkAction(): void {
    const projectIds = Array.from(this.selectedProjects);
    if (projectIds.length === 0) {
      alert('No projects selected.');
      return;
    }
    if (this.modalAction === 'Delete' && this.confirmInput.toLowerCase() !== 'delete') {
      alert('Please type "Delete" to confirm.');
      return;
    }

    this.isLoading = true;
    if (this.modalAction === 'Delete') {
      this.projectService.deleteProject(projectIds).subscribe({
        next: () => {
          // Remove deleted projects from the arrays and Set
          this.projects = this.projects.filter(p => !projectIds.includes(p.id));
          projectIds.forEach(id => this.selectedProjects.delete(id));
          
          // Update UI state
          this.applySearch();
          this.selectAll = false;
          this.showBulkModal = false;
          this.modalAction = '';
          this.confirmInput = '';
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error deleting projects:', error);
          alert(`Failed to delete projects: ${error.message || 'Unknown error'}`);
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
    } else if (this.modalAction === 'Archive') {
      const archiveRequests = projectIds.map(id => this.projectService.archiveProject(id).toPromise());
      Promise.all(archiveRequests)
        .then(() => {
          // Remove archived projects from the arrays and Set
          this.projects = this.projects.filter(p => !projectIds.includes(p.id));
          projectIds.forEach(id => this.selectedProjects.delete(id));
          
          // Update UI state
          this.applySearch();
          this.selectAll = false;
          this.showBulkModal = false;
          this.modalAction = '';
          this.confirmInput = '';
          this.isLoading = false;
          this.cdr.detectChanges();
        })
        .catch(error => {
          console.error('Error archiving projects:', error);
          alert(`Failed to archive projects: ${error.message || 'Unknown error'}`);
          this.isLoading = false;
          this.cdr.detectChanges();
        });
    }
  }

  cancelSelection(): void {
    // Clear all selections
    this.selectedProjects.clear();
    this.selectAll = false;
    
    // Update all project selected states
    this.projects.forEach(p => p.selected = false);
    this.filteredProjects.forEach(p => p.selected = false);
    
    this.closeAllDropdowns();
    this.cdr.detectChanges();
  }

  toggleSelectAll(): void {
    // Toggle the selectAll state
    this.selectAll = !this.selectAll;
    
    if (this.selectAll) {
      // Select all filtered projects
      this.filteredProjects.forEach(project => {
        project.selected = true;
        this.selectedProjects.add(project.id);
      });
    } else {
      // Deselect all filtered projects
      this.filteredProjects.forEach(project => {
        project.selected = false;
        this.selectedProjects.delete(project.id);
      });
    }
    
    this.cdr.detectChanges();
  }

  toggleProjectSelection(project: any, event: Event): void {
    event.stopPropagation();
    
    // Toggle project selection
    project.selected = !project.selected;
    
    if (project.selected) {
      this.selectedProjects.add(project.id);
    } else {
      this.selectedProjects.delete(project.id);
    }
    
    // Update selectAll state
    this.updateSelectAllState();
    this.cdr.detectChanges();
  }

  navigateToPresentation(projectId: string, event: Event): void {
    event.stopPropagation();
    this.closeAllDropdowns();
    this.router.navigate(['/pages/presentation', projectId]);
    this.cdr.detectChanges();
  }

  navigateToUpdate(projectId: string, event: Event): void {
    event.stopPropagation();
    this.closeAllDropdowns();
    console.log('Navigating to update project with ID:', projectId);
    this.router.navigate(['/pages/updateproject', projectId]);
    this.cdr.detectChanges();
  }
}