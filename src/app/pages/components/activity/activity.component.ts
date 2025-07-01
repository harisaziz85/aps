import { Component } from '@angular/core';

@Component({
  selector: 'app-activity',
  standalone: false,
  templateUrl: './activity.component.html',
  styleUrl: './activity.component.css'
})
export class ActivityComponent {
    projects = [
      {
        name: "Project Name (8)",
        building: "Building Name",
        status: "To Do",
        statusClass: "badge bg-danger",
        assignees: ["assets/user1.jpg", "assets/user2.jpg"],
        description: ["Penetrations 5", "Fire Dampers 4", "Joints 1"]
      },
      {
        name: "Project Name (8)",
        building: "Building Name",
        status: "To Do",
        statusClass: "badge bg-danger",
        assignees: ["assets/user1.jpg", "assets/user2.jpg"],
        description: ["Penetrations 5", "Fire Dampers 4"]
      },
      {
        name: "Project Name (8)",
        building: "Building Name",
        status: "In Progress",
        statusClass: "badge bg-warning text-dark",
        assignees: ["assets/user1.jpg", "assets/user2.jpg"],
        description: ["Penetrations 5", "Wire Windows 8"]
      },
      {
        name: "Project Name (8)",
        building: "Building Name",
        status: "Completed",
        statusClass: "badge bg-success",
        assignees: ["assets/user1.jpg", "assets/user2.jpg"],
        description: ["Penetrations 5"]
      },
      {
        name: "Project Name (8)",
        building: "Building Name",
        status: "In Progress",
        statusClass: "badge bg-warning text-dark",
        assignees: ["assets/user1.jpg", "assets/user2.jpg"],
        description: ["Joints 1"]
      }
    ];
  }
  
