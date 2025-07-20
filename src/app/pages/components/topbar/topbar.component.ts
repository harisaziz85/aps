import { Component, ViewChild, ElementRef, Input, AfterViewInit } from '@angular/core';
import { faRightLeft, faBell, faGear, faUser, faEnvelope, faSyncAlt } from '@fortawesome/free-solid-svg-icons';
import * as bootstrap from 'bootstrap';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { filter, map } from 'rxjs/operators';
import { AuthService, ProfileResponse } from '../../../core/services/auth.service';
import { ProjectService } from '../../../core/services/project.service';
import { HttpClient } from '@angular/common/http';
import { SvgIconsComponent } from '../../../shared/svg-icons/svg-icons.component';
import { ActivityService } from '../../../core/services/activity.service';
import { Activity } from '../../../core/models/activity';

export interface Instance {
  instanceId: string;
  instanceName: string;
  subProjectCategory: string;
}

export interface ProjectExport {
  projectId: string;
  projectName: string;
  instances?: Instance[];
  [key: string]: any;
}

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, FormsModule, SvgIconsComponent],
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.css']
})
export class TopbarComponent implements AfterViewInit {
  @Input() heading: string = '';
 
  faSyncAlt = faSyncAlt;
  isDropdownOpen = false;
  userName: string = '';
  email: string = '';
  currentPassword: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  imageUrl: string = 'images/pi1.png';
  showDropdown = false;
  activeTab: string = 'ongoingProjects'; // Set to 'ongoingProjects' to show the tab by default
  selectedOption: 'new' | 'existing' = 'existing';
  isModalOpen = false;
  pageTitle: string = 'Welcome';

  projects: ProjectExport[] = [];
  filteredProjects: ProjectExport[] = [];
  selectedProjects: string[] = [];
  searchQuery: string = '';
  selectedFile: File | null = null;
  selectedFileName: string = '';
  importApiUrl = 'https://aspbackend-production.up.railway.app/api/exchangeData/import';
  exportApiUrl = 'https://aspbackend-production.up.railway.app/api/exchangeData/export';
  isProjectDropdownOpen: boolean = false;
  selectedProjectId: string = '';
  selectedProjectName: string = 'Selected Project';
  activities: Activity[] = [];

  // Track dropdown state for each project
  projectDropdownStates: { [key: string]: boolean } = {};

  @ViewChild('fileInput') fileInput!: ElementRef;

  constructor(
    private sanitizer: DomSanitizer,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private authService: AuthService,
    private projectService: ProjectService,
    private http: HttpClient,
    private activityService: ActivityService
  ) {}

  ngOnInit(): void {
    this.selectedProjects = [];
    
    this.authService.getProfile().subscribe({
      next: (response: ProfileResponse) => {
        if (!response.error && response.profile) {
          this.userName = response.profile.username || '';
          this.email = response.profile.email || '';
          this.imageUrl = response.profile.profilePic || 'images/pi1.png';
        } else {
          console.error('TopbarComponent: Profile fetch failed:', response.message);
        }
      },
      error: (err) => {
        console.error('TopbarComponent: Error fetching profile:', err);
        this.userName = '';
        this.email = '';
        this.imageUrl = 'images/pi1.png';
      }
    });

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => this.getDeepestChild(this.activatedRoute))
    ).subscribe(title => {
      this.pageTitle = title;
    });

    this.loadProjects();

    this.activityService.getActivities().subscribe({
      next: (response: { activities: Activity[] }) => {
        this.activities = response.activities || [];
      },
      error: (err) => {
        console.error('TopbarComponent: Error fetching activities:', err);
        this.activities = [];
      }
    });
  }

  ngAfterViewInit(): void {
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltipTriggerList.forEach(tooltipTriggerEl => {
      new bootstrap.Tooltip(tooltipTriggerEl);
    });
  }

  getDeepestChild(route: ActivatedRoute): string {
    while (route.firstChild) {
      route = route.firstChild;
    }
    return route.snapshot.data['title'] || 'Welcome';
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  toggleProjectDropdown(projectId: string): void {
    // Close all dropdowns
    Object.keys(this.projectDropdownStates).forEach(key => {
      this.projectDropdownStates[key] = false;
    });
    // Toggle the clicked project's dropdown
    this.projectDropdownStates[projectId] = !this.projectDropdownStates[projectId];
  }

  toggleNotificationDropdown(): void {
    this.showDropdown = !this.showDropdown;
  }

  changeImage(newImage: string) {
    this.imageUrl = newImage;
  }

  openSettings(event: Event) {
    event.stopPropagation();
    let settingsModal = new bootstrap.Modal(document.getElementById('settingsModal')!);
    settingsModal.show();
  }

  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imageUrl = e.target.result;
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
    if (tab === 'ongoingProjects') {
      this.loadProjects();
    }
  }

  selectOption(option: 'new' | 'existing') {
    this.selectedOption = option;
    if (option === 'existing') {
      this.loadProjects();
    }
  }

  openModal() {
    this.isModalOpen = true;
    document.body.classList.add('no-scroll');
    document.documentElement.classList.add('no-scroll');
    this.loadProjects();
  }

  closeModal() {
    this.isModalOpen = false;
    document.body.classList.remove('no-scroll');
    document.documentElement.classList.remove('no-scroll');
    this.selectedFile = null;
    this.selectedFileName = '';
    this.selectedOption = 'existing';
    this.selectedProjectId = '';
    this.selectedProjectName = 'Selected Project';
    this.isProjectDropdownOpen = false;
  }

  closeModalIfOutside(event: MouseEvent) {
    this.isModalOpen = false;
  }

  saveSettings() {
    const formData = new FormData();
    formData.append('username', this.userName);
    formData.append('email', this.email);
    if (this.currentPassword && this.newPassword) {
      formData.append('oldPassword', this.currentPassword);
      formData.append('newPassword', this.newPassword);
      if (this.confirmPassword) {
        formData.append('confirmPassword', this.confirmPassword);
      }
    }
    if (this.fileInput.nativeElement.files[0]) {
      formData.append('profilePic', this.fileInput.nativeElement.files[0]);
    }

    this.authService.updateProfile(formData).subscribe({
      next: (response: ProfileResponse) => {
        if (!response.error && response.profile) {
          this.userName = response.profile.username || '';
          this.email = response.profile.email || '';
          this.imageUrl = response.profile.profilePic || 'images/pi1.png';
          let settingsModal = bootstrap.Modal.getInstance(document.getElementById('settingsModal')!);
          settingsModal?.hide();
        } else {
          console.error('TopbarComponent: Profile update failed:', response.message);
          alert('Failed to update profile: ' + response.message);
        }
      },
      error: (err) => {
        console.error('TopbarComponent: Error updating profile:', err);
        alert('Error updating profile. Please try again.');
      }
    });
  }

  loadProjects() {
    this.projectService.getAllProjects().subscribe({
      next: (response: any) => {
        if (Array.isArray(response.projects)) {
          this.projects = response.projects.map((p: any) => ({
            projectId: p._id,
            projectName: p.projectName,
            instances: [] // Initialize empty instances array
          }));
          this.filteredProjects = [...this.projects];
          
          // Fetch details for each project using the provided API
          this.projects.forEach(project => {
            const projectDetailsUrl = `https://vps.allpassiveservices.com.au/api/project/details/${project.projectId}`;
            this.http.get(projectDetailsUrl).subscribe({
              next: (details: any) => {
                // Extract instances from all subProjects
                const instances = details.subProjects?.flatMap((sub: any) => sub.instances || []) || [];
                project.instances = instances;
                this.filteredProjects = [...this.projects]; // Update filtered projects
              },
              error: (err) => {
                console.error(`Error fetching details for project ${project.projectId}:`, err);
                project.instances = [];
                this.filteredProjects = [...this.projects]; // Update filtered projects even on error
              }
            });
          });
        } else {
          console.error('Unexpected response format from getAllProjects:', response);
          this.projects = [];
          this.filteredProjects = [];
          alert('Failed to load projects: Invalid response format.');
        }
      },
      error: (err) => {
        console.error('Error loading projects:', err);
        this.projects = [];
        this.filteredProjects = [];
        alert('Failed to load projects from API.');
      }
    });
  }

  onSearchChange() {
    if (!this.searchQuery) {
      this.filteredProjects = [...this.projects];
    } else {
      this.filteredProjects = this.projects.map(project => ({
        ...project,
        instances: project.instances?.filter(instance =>
          instance.instanceName?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          instance.subProjectCategory?.toLowerCase().includes(this.searchQuery.toLowerCase())
        ) || []
      })).filter(project => project.instances && project.instances.length > 0);
    }
  }

  toggleProjectSelection(projectId: string | undefined) {
    if (!projectId) {
      console.error('Cannot select project: projectId is null or undefined');
      return;
    }
    const index = this.selectedProjects.indexOf(projectId);
    if (index === -1) {
      this.selectedProjects = [...this.selectedProjects, projectId];
    } else {
      this.selectedProjects = this.selectedProjects.filter(id => id !== projectId);
    }
  }

  toggleProjectDropdownMenu(): void {
    this.isProjectDropdownOpen = !this.isProjectDropdownOpen;
  }

  selectProject(projectId: string, projectName: string): void {
    this.selectedProjectId = projectId;
    this.selectedProjectName = projectName || 'Unnamed Project';
    this.isProjectDropdownOpen = false;
  }

  exportSelectedProjects() {
    if (!Array.isArray(this.selectedProjects) || this.selectedProjects.length === 0) {
      alert('Please select at least one project to export.');
      return;
    }

    let completedExports = 0;
    let failedExports = 0;
    const totalExports = this.selectedProjects.length;

    this.selectedProjects.forEach(projectId => {
      if (!projectId) {
        failedExports++;
        checkAllCompleted();
        return;
      }

      const url = `${this.exportApiUrl}/${projectId}`;
      this.http.get(url, { responseType: 'blob' }).subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `project_export_${projectId}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          
          completedExports++;
          checkAllCompleted();
        },
        error: (error) => {
          console.error(`Error exporting project ${projectId}:`, error);
          failedExports++;
          checkAllCompleted();
        }
      });
    });

    const checkAllCompleted = () => {
      if (completedExports + failedExports === totalExports) {
        if (failedExports > 0) {
          if (completedExports > 0) {
            alert(`Completed ${completedExports} exports with ${failedExports} failures.`);
          } else {
            alert('Failed to export any projects.');
          }
        } else {
          alert('All projects exported successfully');
        }
        this.closeModal();
      }
    };
  }

  onImportFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.selectedFileName = file.name;
    }
  }

  importProject() {
    if (!this.selectedFile) {
      alert('Please select a file to import');
      return;
    }

    if (this.selectedOption === 'existing' && !this.selectedProjectId) {
      alert('Please select a project to import into');
      return;
    }

    const formData = new FormData();
    formData.append('file', this.selectedFile);
    if (this.selectedOption === 'existing') {
      formData.append('projectId', this.selectedProjectId);
    }

    const mode = this.selectedOption === 'new' ? 'new' : 'existing';
    const url = `${this.importApiUrl}?mode=${mode}`;

    this.http.post(url, formData).subscribe({
      next: (response: any) => {
        alert('Project imported successfully');
        this.closeModal();
        this.selectedFile = null;
        this.selectedFileName = '';
      },
      error: (error) => {
        console.error('Import failed:', error);
        alert('Failed to import project: ' + (error.message || 'Unknown error'));
      }
    });
  }
}