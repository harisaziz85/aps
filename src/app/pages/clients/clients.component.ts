import { Component, ViewChild, ElementRef, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import * as bootstrap from 'bootstrap';
import { faSyncAlt, faPlus } from '@fortawesome/free-solid-svg-icons';
import { ClientService } from '../../core/services/client.service';
import { Client } from '../../core/models/client';
import { Project } from '../../core/models/project';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FootComponent } from '../components/foot/foot.component';
import { TopbarComponent } from '../components/topbar/topbar.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SvgIconsComponent } from "../../shared/svg-icons/svg-icons.component";

@Component({
  selector: 'app-clients',
  templateUrl: './clients.component.html',
  styleUrls: ['./clients.component.css'],
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, TopbarComponent, FootComponent, ReactiveFormsModule, FormsModule, SvgIconsComponent],
})
export class ClientsComponent implements OnInit {
  faSyncAlt = faSyncAlt;
  faPlus = faPlus;
  activeTab: string = 'clientInfo';
  clients: Client[] = [];
  filteredClients: Client[] = [];
  selectedClient: Client | null = null;
  selectedClients: Set<string> = new Set();
  isOpen = false;
  profileImage: string = 'assets/profile.jpg';
  totalClients: number = 0;
  clientForm: FormGroup;
  selectedFile: File | null = null;
  searchQuery: string = '';
  isLoading: boolean = false;
  ongoingProjects: Project[] = [];
  completedProjects: Project[] = [];
  isAddingNewClient: boolean = false;
  backendErrors: { [key: string]: string } = {};

  @ViewChild('fileInput') fileInput!: ElementRef;

  private apiUrl = 'https://vps.allpassiveservices.com.au/api/client/';

  constructor(
    private clientService: ClientService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private http: HttpClient
  ) {
    this.clientForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]],
      address: ['', [Validators.required]],
    });

    this.clientForm.valueChanges.subscribe(() => {
      this.backendErrors = {};
      this.cdr.detectChanges();
    });
  }

  ngOnInit(): void {
    this.fetchClients();
  }

  fetchClients(): void {
    this.isLoading = true;
    this.clientService.getClients().subscribe({
      next: (response) => {
        this.clients = response.clients.map(client => ({
          ...client,
          ongoing: 0,
          completed: 0,
          projects: []
        }));
        this.filteredClients = [...this.clients];
        this.totalClients = response.totalClients;

        this.clients.forEach(client => {
          this.fetchClientProjectCounts(client._id);
        });

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error fetching clients:', error);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  fetchClientProjectCounts(clientId: string): void {
    this.clientService.getClientProjects(clientId, 'Active').subscribe({
      next: (activeProjects) => {
        this.updateClientProjectCounts(clientId, activeProjects.length, 'ongoing');
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error fetching Active projects:', error);
        this.cdr.detectChanges();
      }
    });

    this.clientService.getClientProjects(clientId, 'Completed').subscribe({
      next: (completedProjects) => {
        this.updateClientProjectCounts(clientId, completedProjects.length, 'completed');
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error fetching Completed projects:', error);
        this.cdr.detectChanges();
      }
    });
  }

  fetchClientProjects(clientId: string): void {
    this.ongoingProjects = [];
    this.completedProjects = [];
    this.clientService.getClientProjects(clientId, 'Active').subscribe({
      next: (activeProjects) => {
        this.ongoingProjects = [...activeProjects];
        this.updateClientProjectCounts(clientId, activeProjects.length, 'ongoing');
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error fetching Active projects:', error);
        this.cdr.detectChanges();
      }
    });

    this.clientService.getClientProjects(clientId, 'Completed').subscribe({
      next: (completedProjects) => {
        this.completedProjects = completedProjects;
        this.updateClientProjectCounts(clientId, completedProjects.length, 'completed');
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error fetching Completed projects:', error);
        this.cdr.detectChanges();
      }
    });
  }

  updateClientProjectCounts(clientId: string, count: number, type: 'ongoing' | 'completed'): void {
    const clientIndex = this.clients.findIndex(c => c._id === clientId);
    if (clientIndex !== -1) {
      this.clients[clientIndex][type] = count;
      this.filteredClients = [...this.clients];
      this.cdr.detectChanges();
    }
  }

  get activeTabPosition(): string {
    switch (this.activeTab) {
      case 'clientInfo':
        return '0%';
      case 'ongoingProjects':
        return '33.3%';
      case 'completedProjects':
        return '66.6%';
      default:
        return '0%';
    }
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
    this.cdr.detectChanges();
  }

  toggleClientSelection(clientId: string, event: Event): void {
    event.stopPropagation();
    if (this.selectedClients.has(clientId)) {
      this.selectedClients.delete(clientId);
    } else {
      this.selectedClients.add(clientId);
    }
    this.cdr.detectChanges();
  }

  get allSelected(): boolean {
    return this.filteredClients.length > 0 && this.filteredClients.every(client => this.selectedClients.has(client._id));
  }

  toggleSelectAll(event: Event): void {
    event.stopPropagation();
    if (this.allSelected) {
      this.selectedClients.clear();
    } else {
      this.filteredClients.forEach(client => this.selectedClients.add(client._id));
    }
    this.cdr.detectChanges();
  }

  cancelSelection(): void {
    this.selectedClients.clear();
    this.cdr.detectChanges();
  }

  deleteSelectedClients(): void {
    const clientIds = Array.from(this.selectedClients);
    if (clientIds.length === 0) return;

    this.isLoading = true;
    const deleteRequests = clientIds.map(clientId =>
      this.http.delete(`${this.apiUrl}${clientId}`, {
        headers: new HttpHeaders({
          'Content-Type': 'application/json'
        })
      }).subscribe({
        next: () => {
          this.clients = this.clients.filter(client => !this.selectedClients.has(client._id));
          this.filteredClients = [...this.clients];
          this.totalClients = this.clients.length;
          this.selectedClients.delete(clientId);
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error deleting client:', error);
          this.backendErrors['delete'] = error.error?.message || 'Failed to delete client';
          this.cdr.detectChanges();
        },
        complete: () => {
          if (this.selectedClients.size === 0) {
            this.isLoading = false;
            this.cdr.detectChanges();
          }
        }
      })
    );

    Promise.all(deleteRequests).then(() => {
      this.isLoading = false;
     this.cdr.detectChanges();
    });
  }

  openClientDetails(client: Client): void {
    if (this.selectedClients.size > 0) return;
    this.selectedClient = client;
    this.isOpen = true;
    this.isAddingNewClient = false;
    this.clientForm.patchValue({
      name: client.name,
      email: client.email,
      phone: client.phone,
      address: client.address || ''
    });
    this.profileImage = client.clientProfile || 'assets/profile.jpg';
    this.fetchClientProjects(client._id);
    const modal = new bootstrap.Modal(document.getElementById('userModal')!);
    modal.show();
  }

  openAddClientModal(): void {
    if (this.selectedClients.size > 0) return;
    this.isOpen = true;
    this.isAddingNewClient = true;
    this.selectedClient = null;
    this.clientForm.reset();
    this.profileImage = 'assets/profile.jpg';
    this.selectedFile = null;
    this.ongoingProjects = [];
    this.completedProjects = [];
    this.backendErrors = {};
    const modal = new bootstrap.Modal(document.getElementById('userModal')!);
    modal.show();
  }

  closeModal(): void {
    this.isOpen = false;
    this.selectedClient = null;
    this.isAddingNewClient = false;
    this.clientForm.reset();
    this.profileImage = 'assets/profile.jpg';
    this.selectedFile = null;
    this.ongoingProjects = [];
    this.completedProjects = [];
    this.backendErrors = {};
    const modal = document.getElementById('userModal');
    if (modal) {
      const modalInstance = bootstrap.Modal.getInstance(modal);
      modalInstance?.hide();
    }
    this.cdr.detectChanges();
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.profileImage = e.target.result;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  onSearch(): void {
    const query = this.searchQuery.toLowerCase().trim();
    this.filteredClients = this.clients.filter(client =>
      client.name.toLowerCase().includes(query) ||
      client.email.toLowerCase().includes(query) ||
      client.phone.toLowerCase().includes(query)
    );
    this.cdr.detectChanges();
  }

  onSubmit(): void {
    if (this.clientForm.valid) {
      const formData = new FormData();
      formData.append('name', this.clientForm.get('name')!.value);
      formData.append('email', this.clientForm.get('email')!.value);
      formData.append('phone', this.clientForm.get('phone')!.value);
      formData.append('address', this.clientForm.get('address')!.value);
      if (this.selectedFile) {
        formData.append('clientProfile', this.selectedFile);
      }

      if (this.isAddingNewClient) {
        // Add new client
        this.clientService.registerClient(formData).subscribe({
          next: (response) => {
            console.log('Client registered:', response);
            this.fetchClients();
            this.closeModal();
          },
          error: (error) => {
            console.error('Error registering client:', error);
            if (error.error && error.error.errors) {
              this.backendErrors = error.error.errors;
              this.cdr.detectChanges();
            }
          }
        });
      } else if (this.selectedClient) {
        // Update existing client
        this.http.put(`${this.apiUrl}${this.selectedClient._id}`, formData).subscribe({
          next: (response: any) => {
            console.log('Client updated:', response);
            this.fetchClients();
            this.closeModal();
          },
          error: (error) => {
            console.error('Error updating client:', error);
            if (error.error && error.error.errors) {
              this.backendErrors = error.error.errors;
              this.cdr.detectChanges();
            }
          }
        });
      }
    }
  }

  updateProjectStatus(projectId: string, status: string): void {
    this.clientService.updateProjectStatus(projectId, status).subscribe({
      next: (response) => {
        console.log('Project status updated:', response);
        if (this.selectedClient) {
          this.fetchClientProjects(this.selectedClient._id);
        }
      },
      error: (error) => {
        console.error('Error updating project status:', error);
      }
    });
  }

  getStatusClass(status: string): string {
    const normalizedStatus = status.toLowerCase().replace(/\s/g, '').replace(/-/g, '');
    switch (normalizedStatus) {
      case 'active':
        return 'yellow-bg';
      case 'completed':
        return 'green-bg';
      default:
        return '';
    }
  }

  trackByClientId(index: number, client: Client): string {
    return client._id;
  }

  trackByProjectId(index: number, project: Project): string {
    return project._id;
  }

  stopPropagation(event: Event): void {
    event.stopPropagation();
  }
}