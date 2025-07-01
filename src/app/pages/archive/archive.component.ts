import { Component } from '@angular/core';

@Component({
  selector: 'app-archive',
  standalone: false,
  templateUrl: './archive.component.html',
  styleUrl: './archive.component.css'
})
export class ArchiveComponent {
  projects = [
    {
      name: 'Project Name (8)',
      building: 'Building Name',
      status: 'Completed',
      assignees: [
        { image: 'assets/user1.jpg' },
        { image: 'assets/user2.jpg' }
      ],
      instances: ['Penetrations 5', 'Fire Dampers 4']
    },
    {
      name: 'Project Name (8)',
      building: 'Building Name',
      status: 'To Do',
      assignees: [
        { image: 'assets/user1.jpg' },
        { image: 'assets/user3.jpg' }
      ],
      instances: ['Penetrations 5', 'Fire Dampers 4', 'Joints 1']
    },
    {
      name: 'Project Name (8)',
      building: 'Building Name',
      status: 'In Progress',
      assignees: [
        { image: 'assets/user2.jpg' },
        { image: 'assets/user3.jpg' }
      ],
      instances: ['Penetrations 5', 'Fire Dampers 4']
    },
    {
      name: 'Project Name (8)',
      building: 'Building Name',
      status: 'Completed',
      assignees: [
        { image: 'assets/user1.jpg' },
        { image: 'assets/user4.jpg' }
      ],
      instances: ['Penetrations 5', 'Fire Dampers 4']
    },
    {
      name: 'Project Name (8)',
      building: 'Building Name',
      status: 'In Progress',
      assignees: [
        { image: 'assets/user2.jpg' },
        { image: 'assets/user3.jpg' }
      ],
      instances: ['Penetrations 5', 'Fire Dampers 4']
    }
  ];
}
