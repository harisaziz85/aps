import { Component, ViewChild, ElementRef, Input, AfterViewInit } from '@angular/core';
import { faRightLeft, faBell, faGear, faUser, faEnvelope, faSyncAlt } from '@fortawesome/free-solid-svg-icons';
import * as bootstrap from 'bootstrap';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
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

export interface HierarchyLevel {
  levelId: string;
  levelName: string;
  instances: Instance[];
}

export interface ProjectExport {
  projectId: string;
  projectName: string;
  hierarchyLevels: HierarchyLevel[];
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
  activeTab: string = 'ongoingProjects';
  selectedOption: 'new' | 'existing' = 'existing';
  isModalOpen = false;
  pageTitle: string = 'Welcome';

  projects: ProjectExport[] = [];
  filteredProjects: ProjectExport[] = [];
  selectedProjects: string[] = [];
  searchQuery: string = '';
  selectedFile: File | null = null;
  selectedFileName: string = '';
  importApiUrl = 'https://vps.allpassiveservices.com.au/api/exchangeData/import';
  exportApiUrl = 'https://vps.allpassiveservices.com.au/api/exchangeData/export';
  isProjectDropdownOpen: boolean = false;
  selectedProjectId: string = '';
  selectedProjectName: string = 'Selected Project';
  activities: Activity[] = [];
  projectDropdownStates: { [key: string]: boolean } = {};

  @ViewChild('fileInput') fileInput!: ElementRef;
  @ViewChild('importFileInput') importFileInput!: ElementRef;

  constructor(
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
      this.pageTitle = title || 'Welcome';
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
    let currentRoute = route;
    while (currentRoute.firstChild) {
      currentRoute = currentRoute.firstChild;
    }
    return currentRoute.snapshot.data['title'] || 'Welcome';
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  toggleProjectDropdown(projectId: string): void {
    this.projectDropdownStates[projectId] = !this.projectDropdownStates[projectId];
    Object.keys(this.projectDropdownStates).forEach(key => {
      if (key !== projectId) {
        this.projectDropdownStates[key] = false;
      }
    });
  }

  toggleNotificationDropdown(): void {
    this.showDropdown = !this.showDropdown;
  }

  changeImage(newImage: string) {
    this.imageUrl = newImage;
  }

  openSettings(event: Event) {
    event.stopPropagation();
    const settingsModal = new bootstrap.Modal(document.getElementById('settingsModal')!, { backdrop: 'static' });
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
    this.projectDropdownStates = {};
  }

  closeModalIfOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.classList.contains('setting-modal-overlay')) {
      this.closeModal();
    }
  }

  saveSettings() {
    const formData = new FormData();
    formData.append('username', this.userName);
    formData.append('email', this.email);
    if (this.currentPassword && this.newPassword && this.confirmPassword) {
      formData.append('oldPassword', this.currentPassword);
      formData.append('newPassword', this.newPassword);
      formData.append('confirmPassword', this.confirmPassword);
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
          const settingsModal = bootstrap.Modal.getInstance(document.getElementById('settingsModal')!);
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
            projectId: p._id || p.projectId || '',
            projectName: p.projectName || 'Unnamed Project',
            hierarchyLevels: []
          }));
          this.filteredProjects = [...this.projects];

          this.projects.forEach(project => {
            if (!project.projectId) {
              console.error('Project ID is missing:', project);
              return;
            }
            const hierarchyUrl = `https://vps.allpassiveservices.com.au/api/project/hierarchy/${project.projectId}`;
            this.http.get(hierarchyUrl).subscribe({
              next: (hierarchyResponse: any) => {
                const levels = hierarchyResponse.hierarchyData?.levels || [];
                project.hierarchyLevels = levels.map((level: any) => ({
                  levelId: level._id || '',
                  levelName: level.name || 'Unnamed Level',
                  instances: []
                }));

                project.hierarchyLevels.forEach(level => {
                  if (!level.levelId) {
                    console.error('Level ID is missing:', level);
                    return;
                  }
                  const instancesUrl = `https://vps.allpassiveservices.com.au/api/project/instances/list/${level.levelId}`;
                  this.http.get(instancesUrl).subscribe({
                    next: (instancesResponse: any) => {
                      level.instances = (instancesResponse.instances || []).map((instance: any) => ({
                        instanceId: instance.instanceId || '',
                        instanceName: instance.instanceName || '',
                        subProjectCategory: instance.subProjectCategory || 'No Category'
                      }));
                      this.filteredProjects = [...this.projects];
                    },
                    error: (err) => {
                      console.error(`Error fetching instances for hierarchy level ${level.levelId}:`, err);
                      level.instances = [];
                      this.filteredProjects = [...this.projects];
                    }
                  });
                });
              },
              error: (err) => {
                console.error(`Error fetching hierarchy for project ${project.projectId}:`, err);
                project.hierarchyLevels = [];
                this.filteredProjects = [...this.projects];
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
    if (!this.searchQuery.trim()) {
      this.filteredProjects = [...this.projects];
      return;
    }
    const query = this.searchQuery.toLowerCase();
    this.filteredProjects = this.projects.filter(project => {
      const matchesProject = project.projectName.toLowerCase().includes(query);
      const matchesLevel = project.hierarchyLevels.some(level => 
        level.levelName.toLowerCase().includes(query) ||
        level.instances.some(instance => 
          instance.instanceName.toLowerCase().includes(query) ||
          instance.subProjectCategory.toLowerCase().includes(query)
        )
      );
      return matchesProject || matchesLevel;
    });
  }

  toggleProjectSelection(projectId: string) {
    if (!projectId) {
      console.error('Cannot select project: projectId is empty');
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
    if (!this.selectedProjects.length) {
      alert('Please select at least one project to export.');
      return;
    }

    let completedExports = 0;
    let failedExports = 0;
    const totalExports = this.selectedProjects.length;

    this.selectedProjects.forEach(projectId => {
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
          alert(completedExports > 0 
            ? `Completed ${completedExports} exports with ${failedExports} failures.` 
            : 'Failed to export any projects.');
        } else {
          alert('All projects exported successfully');
        }
        this.closeModal();
      }
    };
  }

  onImportFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      this.selectedFileName = input.files[0].name;
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
      next: () => {
        alert('Project imported successfully');
        this.closeModal();
      },
      error: (error) => {
        console.error('Import failed:', error);
        alert('Failed to import project: ' + (error.message || 'Unknown error'));
      }
    });
  }
}