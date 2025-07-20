import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { PresentationService } from '../../core/services/presentation.service';
import jsPDF from 'jspdf';
import { SvgIconsComponent } from '../../shared/svg-icons/svg-icons.component';
import { FootComponent } from '../components/foot/foot.component';
import { ProjectResponse, InstanceResponse, Marker, Document, AttributeTemplateResponse } from '../../core/models/presentation';

interface AttributeTemplate {
  _id: string;
  projectId: string;
  templateName: string;
  approvalDocumentId: string;
  productId: string;
  assignedEmployees: string[];
  attributes: Array<{
    conditionalAttribute: { isEnabled: boolean };
    name: string;
    type: string;
    value: string | string[];
    editableBackOffice: boolean;
    hideForMobileUser: boolean;
    _id: string;
  }>;
  createdAt: string;
  updatedAt: string;
  __v: number;
  subProjects: string[];
}

interface Instance {
  instanceId: string;
  name: string;
}

interface Report {
  _id: string;
  projectId: string;
  instanceId: string;
  fileUrl: string;
  createdAt: string;
}

@Component({
  selector: 'app-presentation',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SvgIconsComponent, FootComponent],
  templateUrl: './presentation.component.html',
  styleUrls: ['./presentation.component.css']
})
export class PresentationComponent implements OnInit {
  isModalOpen = localStorage.getItem('isModalOpen') === 'true';
  isReportModalOpen = localStorage.getItem('isReportModalOpen') === 'true';
  isImageModalOpen = false;
  isMarkerModalOpen = false;
  isLoadingInstance: boolean = false;
  selectedImage: string = '';
  activeTab: string = 'attributes';
  expandedSection: string | null = null;
  project: ProjectResponse | null = null;
  selectedHierarchy: any = null;
  selectedInstance: InstanceResponse | null = null;
  instances: Instance[] = [];
  preInstallPhotos: { url: string; category: string; _id: string }[] = [];
  postInstallPhotos: { url: string; category: string; _id: string }[] = [];
  markers: Marker[] = [];
  floorPlanImage: string = '';
  dropdown1 = { isOpen: false, selected: 'Select an option', options: ['In progress', 'Completed', 'To-do'] };
  isDropdownOpen: boolean = false;
  selectedOption: string = 'Excel Reports';
  options: string[] = ['Excel Reports', '2D Reports', 'Standard Reports'];
  attributeTemplate: AttributeTemplate | null = null;
  dynamicFields: { [key: string]: boolean } = {};
  fields = {
    productName: false,
    approval: false,
    building: false,
    level: false,
    itemNumber: false,
    testReference: false,
    location: false,
    frl: false,
    barrier: false,
    description: false,
    date: false,
    installer: false,
    inspector: false,
    safetyMeasures: false,
    relevanceToBuildingCode: false,
    compliance: false,
    comments: false,
    notes: false,
    time: false,
    priceExcludingGST: false
  };
  isLoadingAttributes: boolean = false;
  standardAttributes: AttributeTemplate | null = null;
  selectedFields: { [key: string]: boolean } = {};
  reportTypes: string[] = ['Standard Reports', '2D Reports', 'Excel Reports'];
  Array = Array;
  projectId: string = '';
  reportId: string | null = null;
  hierarchyLevelId: string = '';
  instanceId: string = localStorage.getItem('instanceId') || '';
  dropdown2: any = { selected: '' };
  selectedReportType: string = 'Standard Reports';
  selectedReport: string = 'Standard Reports';
  reportChoices: string[] = ['Standard Reports', 'Excel Reports', '2D Plans'];
  isReportDropdownOpen: boolean = false;
  reports: Report[] = [];
  isLoadingReports: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private presentationService: PresentationService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    window.scrollTo(0, 0);
    this.route.queryParams.subscribe(params => {
      this.projectId = params['projectId'] || this.route.snapshot.paramMap.get('projectId') || '';
      this.instanceId = params['instanceId'] || localStorage.getItem('instanceId') || this.instanceId;
      this.reportId = params['reportId'] || null;
      this.hierarchyLevelId = params['hierarchyLevelId'] || '';
      const from: string | undefined = params['from'];

      console.log('ngOnInit - Query Params:', { projectId: this.projectId, instanceId: this.instanceId, reportId: this.reportId, hierarchyLevelId: this.hierarchyLevelId, from });

      if (this.instanceId) {
        localStorage.setItem('instanceId', this.instanceId);
      }
      if (this.isModalOpen) {
        localStorage.setItem('isModalOpen', 'true');
      }
      if (this.isReportModalOpen) {
        localStorage.setItem('isReportModalOpen', 'true');
      }

      if (this.projectId) {
        this.fetchProjectDetails(this.projectId);
        this.fetchProjectAttributes(this.projectId);
      }
      if (this.instanceId && this.projectId && this.hierarchyLevelId) {
        this.selectInstance(this.instanceId);
        this.fetchMarkers(this.projectId, this.hierarchyLevelId, this.instanceId);
        this.fetchReports();
      }

      if ((from === 'coverletter' && this.instanceId) || this.isReportModalOpen) {
        localStorage.setItem('isReportModalOpen', 'true');
        this.openReportModal();
        if (this.instanceId) {
          this.selectInstance(this.instanceId);
        }
      }
    });
  }

  fetchProjectDetails(projectId: string): void {
    this.presentationService.getProjectDetails(projectId).subscribe({
      next: (data: ProjectResponse) => {
        this.project = data;
        console.log('Project Details:', data);
        this.dropdown1.selected = data.status || 'Select an option';
        if (data.subProjects && data.subProjects.length > 0) {
          const queryHierarchyLevelId = this.hierarchyLevelId;
          this.selectedHierarchy = data.subProjects.find(sp => sp.hierarchyLevelId === queryHierarchyLevelId) || data.subProjects[0];
          this.hierarchyLevelId = this.selectedHierarchy.hierarchyLevelId;
          console.log('Selected Hierarchy:', this.selectedHierarchy, 'hierarchyLevelId:', this.hierarchyLevelId);

          if (this.projectId && this.hierarchyLevelId) {
            this.fetchHierarchyDocuments(this.projectId, this.hierarchyLevelId);
          }

          this.fetchInstances(this.projectId, this.hierarchyLevelId);
        }
      },
      error: (err: any) => {
        console.error('Error fetching project details:', err);
        this.project = null;
      }
    });
  }

  fetchHierarchyDocuments(projectId: string, hierarchyLevelId: string): void {
    this.presentationService.getDocumentByHierarchy(projectId, hierarchyLevelId).subscribe({
      next: (response: { message: string; data: Document[] }) => {
        console.log('Hierarchy Documents:', response.data);
        const documentWithImage = response.data.find(doc => doc.documentUrl && doc.documentType === '2D Plan');
        if (documentWithImage && this.selectedHierarchy) {
          this.selectedHierarchy.imageUrl = documentWithImage.documentUrl;
          console.log('Assigned imageUrl to selectedHierarchy:', this.selectedHierarchy.imageUrl);
        } else {
          console.warn('No valid document with imageUrl found for hierarchy:', hierarchyLevelId);
          this.selectedHierarchy.imageUrl = 'https://via.placeholder.com/600x400?text=No+Image';
        }
      },
      error: (err: any) => {
        console.error('Error fetching hierarchy documents:', err);
        if (this.selectedHierarchy) {
          this.selectedHierarchy.imageUrl = 'https://via.placeholder.com/600x400?text=No+Image';
        }
      }
    });
  }

  fetchProjectAttributes(projectId: string): void {
    this.isLoadingAttributes = true;
    this.presentationService.getProjectAttributes(projectId).subscribe({
      next: (response: AttributeTemplateResponse) => {
        this.standardAttributes = response.data;
        console.log('Attributes:', response.data);
        this.initializeSelectedFields();
      },
      error: (err: any) => {
        console.error('Error fetching project attributes:', err);
        this.standardAttributes = null;
      },
      complete: () => {
        this.isLoadingAttributes = false;
      }
    });
  }

  initializeSelectedFields(): void {
    this.selectedFields = {};
    if (this.standardAttributes?.attributes) {
      this.standardAttributes.attributes.forEach(attr => {
        this.selectedFields[attr.name] = false;
      });
    }
  }

  isSelectAllIndeterminate(): boolean {
    if (!this.standardAttributes?.attributes) return false;
    const checkedCount = this.standardAttributes.attributes.filter(attr => this.selectedFields[attr.name]).length;
    return checkedCount > 0 && checkedCount < this.standardAttributes.attributes.length;
  }

  selectInstance(instanceId: string): void {
    if (!instanceId) {
      console.error('No instanceId provided for fetching instance details');
      this.selectedInstance = null;
      this.preInstallPhotos = [];
      this.postInstallPhotos = [];
      this.isLoadingInstance = false;
      this.cdr.detectChanges();
      return;
    }
    this.instanceId = instanceId;
    localStorage.setItem('instanceId', this.instanceId);
    console.log('selectInstance - instanceId set:', this.instanceId);
    this.isLoadingInstance = true;
    this.presentationService.getInstanceDetails(instanceId).subscribe({
      next: (instance: InstanceResponse) => {
        this.selectedInstance = instance || null;
        console.log('Instance Details:', this.selectedInstance);
        if (instance?.projectId) {
          this.projectId = instance.projectId;
        }
        this.preInstallPhotos = [];
        this.postInstallPhotos = [];
        if (this.selectedInstance?.photos && Array.isArray(this.selectedInstance.photos)) {
          this.preInstallPhotos = this.selectedInstance.photos.filter(
            photo => photo.category.toLowerCase() === 'pre-installation'
          );
          this.postInstallPhotos = this.selectedInstance.photos.filter(
            photo => photo.category.toLowerCase() === 'post-installation'
          );
          console.log('Pre-Install Photos:', this.preInstallPhotos);
          console.log('Post-Install Photos:', this.postInstallPhotos);
        }
        if (this.projectId && this.hierarchyLevelId) {
          this.fetchMarkers(this.projectId, this.hierarchyLevelId, instanceId);
        }
        this.isLoadingInstance = false;
        this.cdr.detectChanges();
        this.fetchReports();
      },
      error: (err: any) => {
        console.error('Error fetching instance details:', err);
        this.selectedInstance = null;
        this.preInstallPhotos = [];
        this.postInstallPhotos = [];
        this.isLoadingInstance = false;
        this.cdr.detectChanges();
      }
    });
  }

  fetchInstances(projectId: string, hierarchyLevelId: string): void {
    this.presentationService.getInstancesByHierarchy(hierarchyLevelId).subscribe({
      next: (instances: InstanceResponse[]) => {
        this.instances = instances.map(inst => ({
          instanceId: inst._id || '',
          name: inst.instanceName || `Instance ${inst.instanceNumber}`
        }));
        console.log('Instances:', this.instances, 'for hierarchyLevelId:', hierarchyLevelId);
      },
      error: (err: any) => {
        console.error('Error fetching instances:', err);
        this.instances = [];
      }
    });
  }

  fetchMarkers(projectId: string, hierarchyLevelId: string, instanceId: string): void {
    if (!projectId || !hierarchyLevelId || !instanceId) {
      console.error('Missing required IDs for fetching markers:', { projectId, hierarchyLevelId, instanceId });
      this.floorPlanImage = 'https://via.placeholder.com/600x400?text=No+Image';
      this.markers = [];
      return;
    }
    this.presentationService.getInstanceMarkers(projectId, hierarchyLevelId, instanceId, []).subscribe({
      next: (response: { message: string; data: Document[] }) => {
        this.markers = response.data
          .filter(doc => doc.markers && Array.isArray(doc.markers) && doc.markers.length > 0)
          .flatMap(doc => doc.markers.map(marker => ({
            ...marker,
            position: {
              x: parseFloat(marker.position?.x?.toString()) || 0,
              y: parseFloat(marker.position?.y?.toString()) || 0
            },
            style: {
              textSize: parseInt(marker.style?.textSize?.toString(), 10) || 14
            }
          })));
        const documentWithMarkers: Document | undefined = response.data.find(doc => doc.markers && doc.markers.length > 0);
        this.floorPlanImage = documentWithMarkers?.documentUrl || 'https://via.placeholder.com/600x400?text=No+Image';
        console.log('fetchMarkers - Response:', response);
        console.log('Markers:', this.markers, 'Floor Plan Image:', this.floorPlanImage);
      },
      error: (err: any) => {
        console.error('Error fetching markers:', err);
        this.markers = [];
        this.floorPlanImage = 'https://via.placeholder.com/600x400?text=No+Image';
      }
    });
  }

  updateProjectStatus(status: string): void {
    if (this.projectId) {
      this.presentationService.updateProjectStatus(this.projectId, status).subscribe({
        next: (response: any) => {
          this.dropdown1.selected = status;
          if (this.project) {
            this.project.status = status;
          }
        },
        error: (err: any) => {
          console.error('Error updating project status:', err);
        }
      });
    }
  }

  openCarparkModal(hierarchy: any, instanceId?: string): void {
    this.selectedHierarchy = hierarchy;
    this.hierarchyLevelId = hierarchy.hierarchyLevelId || '';
    console.log('openCarparkModal - selectedHierarchy:', this.selectedHierarchy, 'hierarchyLevelId:', this.hierarchyLevelId);
    this.floorPlanImage = 'https://via.placeholder.com/600x400?text=Loading+Image';
    this.markers = [];
    this.preInstallPhotos = [];
    this.postInstallPhotos = [];
    this.instances = [];

    if (instanceId) {
      this.selectInstance(instanceId);
    }

    if (this.projectId && this.hierarchyLevelId) {
      this.fetchInstances(this.projectId, this.hierarchyLevelId);
      this.fetchHierarchyDocuments(this.projectId, this.hierarchyLevelId);
    }

    this.isModalOpen = true;
    localStorage.setItem('isModalOpen', 'true');
    document.body.style.overflow = 'hidden';
  }

  closeCarparkModal(): void {
    this.isModalOpen = false;
    localStorage.setItem('isModalOpen', 'false');
    this.selectedHierarchy = null;
    this.selectedInstance = null;
    this.instanceId = '';
    this.instances = [];
    this.preInstallPhotos = [];
    this.postInstallPhotos = [];
    this.markers = [];
    this.floorPlanImage = '';
    this.hierarchyLevelId = '';
    console.log('closeCarparkModal - instanceId reset:', this.instanceId);
    document.body.style.overflow = 'auto';
  }

  openReportModal(): void {
    console.log('openReportModal - Current instanceId:', this.instanceId, 'selectedInstance:', this.selectedInstance, 'selectedHierarchy:', this.selectedHierarchy);
    this.isReportModalOpen = true;
    localStorage.setItem('isReportModalOpen', 'true');
    document.body.style.overflow = 'hidden';
    if (this.instanceId && !this.selectedInstance) {
      this.selectInstance(this.instanceId);
    }
    this.fetchReports();
  }

  closeReportModal(): void {
    this.isReportModalOpen = false;
    localStorage.setItem('isReportModalOpen', 'false');
    document.body.style.overflow = 'auto';
  }

  openImageModal(imageUrl: string): void {
    this.selectedImage = imageUrl;
    this.isImageModalOpen = true;
    document.body.style.overflow = 'hidden';
  }

  closeImageModal(): void {
    this.isImageModalOpen = false;
    document.body.style.overflow = 'auto';
  }

  openMarkerModal(): void {
    this.isMarkerModalOpen = true;
    document.body.style.overflow = 'hidden';
  }

  closeMarkerModal(): void {
    this.isMarkerModalOpen = false;
    document.body.style.overflow = 'auto';
  }

  toggleExpand(section: string): void {
    this.expandedSection = this.expandedSection === section ? null : section;
  }

  toggle(dropdown: { isOpen: boolean }): void {
    dropdown.isOpen = !dropdown.isOpen;
  }

  selectOption(dropdown: { isOpen: boolean; selected: string } | null, option: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (dropdown) {
      dropdown.selected = option;
      dropdown.isOpen = false;
      this.updateProjectStatus(option);
    } else {
      this.selectedReport = option;
      this.isReportDropdownOpen = false;
    }
  }

  toggleDropdown1(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  selectOption1(option: string, event: Event): void {
    event.stopPropagation();
    this.selectedOption = option;
    this.isDropdownOpen = false;
  }

  toggleSelectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (this.standardAttributes?.attributes) {
      this.standardAttributes.attributes.forEach(attr => {
        this.selectedFields[attr.name] = checked;
      });
    }
    this.updateSelectAll();
  }

  updateSelectAll(): void {
    const selectAllCheckbox = document.getElementById('selectAll') as HTMLInputElement | null;
    if (selectAllCheckbox && this.standardAttributes?.attributes) {
      const allChecked = this.standardAttributes.attributes.every(attr => this.selectedFields[attr.name]);
      const someChecked = this.standardAttributes.attributes.some(attr => this.selectedFields[attr.name]);
      selectAllCheckbox.checked = allChecked;
      selectAllCheckbox.indeterminate = someChecked && !allChecked;
    }
  }

  async generateReport(): Promise<void> {
    const doc = new jsPDF();
    doc.save(`Empty_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
    alert('Empty report generated successfully!');
    this.closeReportModal();
  }

  getAttributeDisplayValue(attr: { value: string | string[] }): string {
    if (Array.isArray(attr.value) && attr.value.length > 0) {
      return attr.value.join(', ');
    }
    return attr.value?.toString() || 'N/A';
  }

  getAttributeFieldKey(attrName: string): string {
    return attrName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
  }

  private loadImage(url: string): Promise<HTMLImageElement | null> {
    return new Promise((resolve) => {
      const img = new Image();
      const proxiedUrl = `/api/images${new URL(url).pathname}${new URL(url).search}`;
      img.src = proxiedUrl;
      console.log('Loading image:', proxiedUrl);
      img.onload = () => {
        console.log('Image loaded successfully:', proxiedUrl);
        resolve(img);
      };
      img.onerror = () => {
        console.error('Failed to load image:', proxiedUrl);
        resolve(null);
      };
    });
  }

  fetchReports(): void {
    if (this.projectId && this.instanceId) {
      this.isLoadingReports = true;
      this.presentationService.getReportsByInstance(this.projectId, this.instanceId).subscribe({
        next: (response: any) => {
          this.reports = response.data || [];
          console.log('Fetched Reports:', this.reports);
          this.isLoadingReports = false;
        },
        error: (err: any) => {
          console.error('Error fetching reports:', err);
          this.reports = [];
          this.isLoadingReports = false;
        }
      });
    } else {
      console.warn('projectId or instanceId is missing, cannot fetch reports');
      this.reports = [];
    }
  }

  toggleReportDropdown(): void {
    this.isReportDropdownOpen = !this.isReportDropdownOpen;
  }

  getReportCount(projectId: string): number {
    return this.reports.filter(r => r.projectId === projectId).length;
  }

  getReportIndex(report: Report): number {
    return this.reports.filter(r => r.projectId === report.projectId).indexOf(report);
  }

  downloadReport(fileUrl: string): void {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileUrl.substring(fileUrl.lastIndexOf('/') + 1);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}