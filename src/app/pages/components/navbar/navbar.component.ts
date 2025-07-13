import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { UpdateService } from '../../../core/services/update-service.service';

@Component({
  selector: 'app-navbar',
  template: `
    <nav class="navbar navbar-light bg-light">
      <div class="navbar-nav">
        <a class="nav-link" [class.active]="currentStep === 1" (click)="navigateToStep(1)">Project Attributes</a>
        <a class="nav-link" [class.active]="currentStep === 2" (click)="navigateToStep(2)">Standard Attributes</a>
        <a class="nav-link" [class.active]="currentStep === 3" (click)="navigateToStep(3)">Building Hierarchy</a>
        <a class="nav-link" [class.active]="currentStep === 4" (click)="navigateToStep(4)">Document </a>
        <a class="nav-link" [class.active]="currentStep === 5" (click)="navigateToStep(5)">Project Report</a>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      display: flex !important;
      justify-content: center !important; /* Center horizontally */
      align-items: center !important; /* Center vertically */
      width: fit-content;
      height: 64px !important; /* Set height to 60px */
      padding: 0.5rem;
      margin-bottom: 24px; /* Add margin-bottom of 24px */
      border-radius: 20px;
      background-color: #ffffff !important; /* Ensure background is white */
    }
    .navbar-nav {
      display: flex;
      flex-direction: row;
      align-items: center; /* Center items vertically */
      gap: 0.5rem;
      position: relative;
    }
    .nav-link {
      cursor: pointer;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      position: relative;
      z-index: 1;
      color: #000000;
      background-color: #ffffff;
      transition: color 0.3s ease, background-color 0.3s ease;
      display: flex;
      align-items: center; /* Center text vertically within nav-link */
      height: 48px; /* Consistent height for all nav-links */
    }
    .nav-link.active {
      color: #ffffff !important;
      background-color: #000000 !important;
      border-radius: 20px !important;
    }
    .navbar-nav::before {
      content: '';
      position: absolute;
      top: 0;
      width: 0;
      height: 100%;
      background-color: #000000;
      border-radius: 4px;
      transition: all 0.3s ease;
      z-index: 0;
    }
    .nav-link.active ~ .nav-link::before {
      width: 0 !important;
    }
    .nav-link:nth-child(1).active ~ .navbar-nav::before {
      width: 64px;
      left: 0.5rem;
    }
    .nav-link:nth-child(2).active ~ .navbar-nav::before {
      width: 64px;
      left: calc(0.5rem + 64px + 0.5rem);
    }
    .nav-link:nth-child(3).active ~ .navbar-nav::before {
      width: 64px;
      left: calc(0.5rem + 2 * (64px + 0.5rem));
    }
    .nav-link:nth-child(4).active ~ .navbar-nav::before {
      width: 64px;
      left: calc(0.5rem + 3 * (64px + 0.5rem));
    }
    .nav-link:nth-child(5).active ~ .navbar-nav::before {
      width: 64px;
      left: calc(0.5rem + 4 * (64px + 0.5rem));
    }
    .nav-link:hover:not(.active) {
      background-color: rgb(255, 255, 255);
    }
  `]
})
export class NavbarComponent implements OnInit {
  projectId: string | null = null;
  currentStep: number = 1;

  constructor(
    private updateService: UpdateService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Get project ID from service or route
    this.updateService.projectId$.subscribe(id => {
      this.projectId = id;
    });

    // Determine current step based on route
    this.route.url.subscribe(urlSegments => {
      const path = urlSegments.join('/');
      if (path.includes('updateproject5')) {
        this.currentStep = 5;
      } else if (path.includes('updateproject4')) {
        this.currentStep = 4;
      } else if (path.includes('updateproject3')) {
        this.currentStep = 3;
      } else if (path.includes('updateproject2')) {
        this.currentStep = 2;
      } else {
        this.currentStep = 1;
      }
    });

    // Get project ID from route params if available
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.projectId = params['id'];
        this.updateService.setProjectId(params['id']);
      }
    });
  }

  navigateToStep(step: number) {
    if (!this.projectId) return;

    const routes = [
      `pages/updateproject/${this.projectId}`,
      `pages/updateproject2/${this.projectId}`,
      `pages/updateproject3/${this.projectId}`,
      `pages/updateproject4/${this.projectId}`,
      `pages/updateproject5/${this.projectId}`
    ];

    this.router.navigate([routes[step - 1]]);
    this.currentStep = step;
  }
}