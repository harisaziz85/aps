import { Component, ViewChild, ElementRef, Input } from '@angular/core';
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
import { SvgIconsComponent } from "../../../shared/svg-icons/svg-icons.component";
import { ActivityService } from '../../../core/services/activity.service';
import { Activity } from '../../../core/models/activity';

export interface ProjectExport {
  projectId: string;
  projectName: string;
  subProjects?: string[];
  [key: string]: any;
}

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, FormsModule, SvgIconsComponent],
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.css']
})
export class TopbarComponent {
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
  activeTab: string = 'tab1';
  isOpen: boolean = false;
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

  activities: Activity[] = [];

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
    console.log('Component initialized with empty selectedProjects array:', this.selectedProjects);
    
    this.authService.getProfile().subscribe({
      next: (response: ProfileResponse) => {
        if (!response.error && response.profile) {
          console.log('TopbarComponent: Profile fetched successfully:', response.profile);
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
        console.log('TopbarComponent: Activities fetched:', this.activities);
      },
      error: (err) => {
        console.error('TopbarComponent: Error fetching activities:', err);
        this.activities = [];
      }
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

  toggleDropdown1(): void {
    this.isOpen = !this.isOpen;
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
    console.log('Active tab changed to:', tab);
    if (tab === 'ongoingProjects') {
      this.loadProjects();
    }
  }

  selectOption(option: 'new' | 'existing') {
    this.selectedOption = option;
  }

  openModal() {
    this.isModalOpen = true;
    document.body.classList.add('no-scroll');
    document.documentElement.classList.add('no-scroll');
    console.log('Opening modal, current selectedProjects:', this.selectedProjects);
    this.loadProjects();
  }

  closeModal() {
    this.isModalOpen = false;
    document.body.classList.remove('no-scroll');
    document.documentElement.classList.remove('no-scroll');
    this.selectedFile = null;
    this.selectedFileName = '';
    this.selectedOption = 'existing';
    console.log('Closing modal, preserving selectedProjects:', this.selectedProjects);
  }

  closeModalIfOutside(event: MouseEvent) {
    this.isModalOpen = false;
  }

  saveSettings() {
    const formData = new FormData();
    formData.append('username', this.userName);
    formData.append('email', this.email);
    if (this.currentPassword) {
      formData.append('currentPassword', this.currentPassword);
    }
    if (this.newPassword) {
      formData.append('newPassword', this.newPassword);
    }
    if (this.confirmPassword) {
      formData.append('confirmPassword', this.confirmPassword);
    }
    if (this.fileInput.nativeElement.files[0]) {
      formData.append('profilePic', this.fileInput.nativeElement.files[0]);
    }

    this.authService.updateProfile(formData).subscribe({
      next: (response: ProfileResponse) => {
        if (!response.error && response.profile) {
          console.log('TopbarComponent: Profile updated successfully:', response.profile);
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
    console.log('Loading projects...');
    this.projectService.getAllProjects().subscribe({
      next: (response: any) => {
        console.log('Raw API response:', response);
        if (Array.isArray(response.projects)) {
          this.projects = response.projects.map((p: any) => ({
            projectId: p._id,
            projectName: p.projectName,
            subProjects: p.subProjects || [],
            ...p
          }));
          this.filteredProjects = [...this.projects];
          console.log('Projects loaded:', this.projects);
          console.log('Project IDs available:', this.projects.map((p: any) => p.projectId));
          if (this.projects.some(p => !p.projectId)) {
            console.warn('Some projects are missing projectId:', this.projects.filter(p => !p.projectId));
          }
        } else {
          console.error('Unexpected response format:', response);
          this.projects = [];
          this.filteredProjects = [];
          alert('Failed to load projects: Invalid response format.');
        }
      },
      error: (err) => {
        console.error('Error loading projects:', err);
        this.projects = [];
        this.filteredProjects = [];
        alert('Failed to load projects for export.');
      }
    });
  }

  onSearchChange() {
    if (!this.searchQuery) {
      this.filteredProjects = [...this.projects];
    } else {
      this.filteredProjects = this.projects.filter(project =>
        project.projectName?.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    }
    console.log('Filtered projects:', this.filteredProjects);
  }

  toggleProjectSelection(projectId: string | undefined) {
    console.log('toggleProjectSelection called with projectId:', projectId);
    if (!projectId) {
      console.error('Cannot select project: projectId is null or undefined');
      return;
    }
    console.log('Before toggle - selectedProjects:', [...this.selectedProjects]);
    const index = this.selectedProjects.indexOf(projectId);
    if (index === -1) {
      this.selectedProjects = [...this.selectedProjects, projectId];
      console.log('Added project to selection:', projectId);
    } else {
      this.selectedProjects = this.selectedProjects.filter(id => id !== projectId);
      console.log('Removed project from selection:', projectId);
    }
    console.log('After toggle - selectedProjects:', [...this.selectedProjects]);
  }

  exportSelectedProjects() {
    if (!Array.isArray(this.selectedProjects) || this.selectedProjects.length === 0) {
      console.error('No projects selected for export:', this.selectedProjects);
      alert('Please select at least one project to export.');
      return;
    }

    console.log('Exporting projects:', this.selectedProjects);

    let completedExports = 0;
    let failedExports = 0;
    const totalExports = this.selectedProjects.length;

    this.selectedProjects.forEach(projectId => {
      if (!projectId) {
        console.error('Skipping invalid projectId:', projectId);
        failedExports++;
        checkAllCompleted();
        return;
      }

      const url = `${this.exportApiUrl}/${projectId}`;
      console.log('Exporting project with URL:', url);

      this.http.get(url, { responseType: 'blob' }).subscribe({
        next: (blob) => {
          console.log(`Successfully fetched blob for project ${projectId}`);
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `project_export_${projectId}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          
          completedExports++;
          console.log(`Export completed for project ${projectId}`);
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
        console.log(`Export summary: ${completedExports} succeeded, ${failedExports} failed`);
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

    const formData = new FormData();
    formData.append('file', this.selectedFile);

    const mode = this.selectedOption === 'new' ? 'new' : 'existing';
    const url = `${this.importApiUrl}?mode=${mode}`;

    this.http.post(url, formData).subscribe({
      next: (response: any) => {
        console.log('Import successful:', response);
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