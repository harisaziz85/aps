import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivityService } from '../../../core/services/activity.service';
import { Activity } from '../../../core/models/activity';
import { SvgIconsComponent } from "../../../shared/svg-icons/svg-icons.component";

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, SvgIconsComponent],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  activeTab = 'admin';
  adminActivities: any[] = [];
  mobileActivities: any[] = [];

  constructor(private activityService: ActivityService) {}

  ngOnInit(): void {
    this.fetchActivities();
  }

  fetchActivities(): void {
    this.activityService.getActivities().subscribe({
      next: (response) => {
        const activities = response.activities.map(activity => ({
          ...activity,
          icon: this.getIcon(activity.type),
          time: activity.date ? this.formatDate(activity.date) : 'N/A',
          desc: activity.description ? activity.description.substring(0, 25) : '', // Truncate description to 25 characters
          title: activity.title ? activity.title.substring(0, 25) : '' // Truncate title to 25 characters
        }));

        // Categorize activities
        this.adminActivities = activities.filter(activity => activity.performerType === 'admin panel');
        this.mobileActivities = activities.filter(activity => activity.performerType !== 'admin panel');
      },
      error: (error) => {
        console.error('Error fetching activities:', error);
      }
    });
  }

  getIcon(type: string): string {
    switch (type) {
      case 'New User':
        return 'allur';
      case 'New Client':
        return 'allcl';
      case 'New Project':
        return 'allpr';
      case 'Project Completed':
        return 'procl';
      case 'New Approval Document':
      case 'Product':
        return 'com';
      default:
        return 'com'; // Default icon for other types
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }
}