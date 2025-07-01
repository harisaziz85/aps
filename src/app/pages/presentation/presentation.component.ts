import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ProjectResponse, InstanceResponse, Marker, Document, AttributeTemplateResponse } from '../../core/models/presentation';
import { PresentationService } from '../../core/services/presentation.service';
import jsPDF from 'jspdf';
import { SvgIconsComponent } from '../../shared/svg-icons/svg-icons.component';
import { FootComponent } from '../components/foot/foot.component';
import { Observable } from 'rxjs';

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

interface CoverLetterData {
  inspectionOverview: {
    totalItems: string;
    passedItems: string;
    failedItems: string;
    tbcItems: string;
  };
  address: string;
  date: string;
  buildingName: string;
  reportTitle: string;
  additionalInfo: string;
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
  isFullProjReportModalOpen = localStorage.getItem('isFullProjReportModalOpen') === 'true';
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
  coverLetterData: CoverLetterData | null = null;

  constructor(
    private route: ActivatedRoute,
    private presentationService: PresentationService,
    private http: HttpClient,
    private router: Router
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
      if (this.isFullProjReportModalOpen) {
        localStorage.setItem('isFullProjReportModalOpen', 'true');
        this.fetchProjectAttributes(this.projectId);
      }

      if (this.projectId) {
        this.fetchProjectDetails(this.projectId);
        this.fetchProjectAttributes(this.projectId);
      }
      if (this.instanceId && this.projectId && this.hierarchyLevelId) {
        this.fetchInstanceDetails(this.instanceId);
        this.fetchMarkers(this.projectId, this.hierarchyLevelId, this.instanceId);
        this.fetchReports();
      }

      if ((from === 'coverletter' && this.instanceId) || this.isReportModalOpen) {
        localStorage.setItem('isReportModalOpen', 'true');
        this.openReportModal();
        if (this.instanceId) {
          this.fetchInstanceDetails(this.instanceId);
        }
      }
    });
  }

  openFullProjReportModal(): void {
    this.isFullProjReportModalOpen = true;
    localStorage.setItem('isFullProjReportModalOpen', 'true');
    document.body.style.overflow = 'hidden';
    if (this.projectId && !this.standardAttributes) {
      this.fetchProjectAttributes(this.projectId);
    }
  }

  closeFullProjReportModal(): void {
    this.isFullProjReportModalOpen = false;
    localStorage.setItem('isFullProjReportModalOpen', 'false');
    document.body.style.overflow = 'auto';
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

  fetchInstanceDetails(instanceId: string): void {
    console.log('Fetching instance details for instanceId:', instanceId);
    this.http.get<{ instance: InstanceResponse }>(`https://aspbackend-production.up.railway.app/api/project/instance/details/${instanceId}`)
      .subscribe({
        next: (response: { instance: InstanceResponse }) => {
          this.selectedInstance = response.instance || null;
          this.instanceId = response.instance?._id || this.instanceId;
          localStorage.setItem('instanceId', this.instanceId);
          console.log('Instance Details:', this.selectedInstance, 'instanceId:', this.instanceId);
          if (response.instance?.projectId) {
            this.projectId = response.instance.projectId;
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
          this.fetchReports();
        },
        error: (err: any) => {
          console.error('Error fetching instance details:', err);
          this.selectedInstance = null;
          this.preInstallPhotos = [];
          this.postInstallPhotos = [];
        }
      });
  }

  fetchInstances(projectId: string, hierarchyLevelId: string): void {
    this.http.get<{ instances: Instance[] }>(`https://aspbackend-production.up.railway.app/api/project/instances/${projectId}/${hierarchyLevelId}`)
      .subscribe({
        next: (response: { instances: Instance[] }) => {
          this.instances = response.instances || [];
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
      this.instanceId = instanceId;
      localStorage.setItem('instanceId', this.instanceId);
      console.log('openCarparkModal - instanceId set:', this.instanceId);
    }

    if (this.projectId && this.hierarchyLevelId) {
      this.fetchInstances(this.projectId, this.hierarchyLevelId);
      this.fetchHierarchyDocuments(this.projectId, this.hierarchyLevelId);
    }

    if (instanceId && this.projectId && this.hierarchyLevelId) {
      this.fetchInstanceDetails(instanceId);
      this.fetchMarkers(this.projectId, this.hierarchyLevelId, instanceId);
    } else {
      this.selectedInstance = null;
      this.instanceId = '';
      console.log('openCarparkModal - instanceId reset:', this.instanceId);
    }
    this.isModalOpen = true;
    localStorage.setItem('isModalOpen', 'true');
    document.body.style.overflow = 'hidden';
  }

  selectInstance(instanceId: string): void {
    this.instanceId = instanceId;
    localStorage.setItem('instanceId', this.instanceId);
    console.log('selectInstance - instanceId set:', this.instanceId);
    if (this.projectId && this.hierarchyLevelId) {
      this.fetchInstanceDetails(instanceId);
      this.fetchMarkers(this.projectId, this.hierarchyLevelId, instanceId);
    }
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
      this.fetchInstanceDetails(this.instanceId);
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













async generateFullProjectReport(): Promise<void> {
  if (!this.project || !this.projectId) {
    alert('Project details not loaded. Please try again.');
    return;
  }

  if (!this.standardAttributes || !this.standardAttributes.attributes) {
    alert('No attributes available to include in the report.');
    return;
  }

  const selectedAttributes = this.standardAttributes.attributes.filter(attr => this.selectedFields[attr.name]);
  if (selectedAttributes.length === 0) {
    alert('Please select at least one attribute to include in the report.');
    return;
  }

  const doc = new jsPDF();
  let yOffset = 25;
  const margin = 10;
  const lineHeight = 10;

  // Add logo
  try {
    doc.addImage('/images/logo.png', 'PNG', 160, 10, 30.17, 15.58);
  } catch (error) {
    console.error('Error adding logo image to PDF:', error);
  }

  // Project details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(this.project.projectName || 'N/A', margin, yOffset);
  yOffset += lineHeight;
  doc.text(this.project.client?.clientName || this.project.clientName || 'N/A', margin, yOffset);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  yOffset += lineHeight;

  // Additional project details
  doc.setFont('helvetica', 'bold');
  doc.text('Project Details', margin, yOffset);
  const detailsXOffset = margin + doc.getTextWidth('Project Details') + 60;
  let detailsYOffset = yOffset;

  doc.setFont('helvetica', 'normal');
  doc.text(`Address: ${this.project.address || 'N/A'}`, detailsXOffset, detailsYOffset);
  detailsYOffset += lineHeight;
  doc.text(`Building: ${this.project.buildingName || 'N/A'}`, detailsXOffset, detailsYOffset);
  detailsYOffset += lineHeight;
  doc.text(`Date: ${this.project.date ? new Date(this.project.date).toLocaleString('en-PK', { timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A'}`, detailsXOffset, detailsYOffset);
  detailsYOffset += lineHeight;
  doc.text(`Building Type: ${this.project.buildingType || 'N/A'}`, detailsXOffset, detailsYOffset);

  // Project image
  yOffset += lineHeight;
  if (this.project.imageUrl) {
    const projectImg = await this.loadImage(this.project.imageUrl);
    if (projectImg) {
      try {
        doc.addImage(projectImg, 'JPEG', margin, yOffset, 50, 50);
        yOffset += 50;
      } catch (error) {
        console.error('Error adding project image:', error);
        doc.rect(margin, yOffset, 50, 50);
        doc.text('Image not available.', margin, yOffset + 25);
        yOffset += 50;
      }
    } else {
      doc.rect(margin, yOffset, 50, 50);
      doc.text('Image not available.', margin, yOffset + 25);
      yOffset += 50;
    }
  } else {
    doc.rect(margin, yOffset, 50, 50);
    doc.text('Image not available.', margin, yOffset + 25);
    yOffset += 50;
  }

  // Hierarchy Levels Section
  yOffset += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Hierarchy Levels', margin, yOffset);
  yOffset += lineHeight;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  if (this.project.subProjects && this.project.subProjects.length > 0) {
    for (const hierarchy of this.project.subProjects) {
      if (yOffset + lineHeight > 270) {
        doc.addPage();
        yOffset = 20;
      }
      const hierarchyName = hierarchy.hierarchyName || `Hierarchy ${this.project.subProjects.indexOf(hierarchy) + 1}`;
      doc.text(`- ${hierarchyName}`, margin + 5, yOffset);
      yOffset += lineHeight;

      // List instances for this hierarchy level from subProjects
      const instances = hierarchy.instances || [];
      console.log(`Instances for hierarchy ${hierarchy.hierarchyLevelId}:`, instances);
      if (instances.length > 0) {
        for (const instance of instances) {
          if (yOffset + lineHeight > 270) {
            doc.addPage();
            yOffset = 20;
          }
          const instanceName = instance.instanceName || `Instance ${instance.instanceId || 'Unnamed'}`;
          doc.text(`  * ${instanceName}`, margin + 10, yOffset);
          yOffset += lineHeight;
        }
      } else {
        if (yOffset + lineHeight > 270) {
          doc.addPage();
          yOffset = 20;
        }
        doc.text(`  * No instances available`, margin + 10, yOffset);
        yOffset += lineHeight;
      }
    }
  } else {
    if (yOffset + lineHeight > 270) {
      doc.addPage();
      yOffset = 20;
    }
    doc.text('No hierarchy levels available.', margin + 5, yOffset);
    yOffset += lineHeight;
  }

  // Selected attributes table
  yOffset += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Selected Standard Attributes', margin, yOffset);
  yOffset += lineHeight;

  doc.setFont('helvetica', 'normal');
  const tableX = margin;
  const columnWidths = [80, 100];
  const headerHeight = 10;
  const rowHeight = 12;

  // Table headers
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  const headers = ['Attribute Name', 'Value'];
  let xOffset = tableX;
  headers.forEach((header, i) => {
    doc.text(header, xOffset + 2, yOffset + 7);
    xOffset += columnWidths[i];
  });
  doc.rect(tableX, yOffset, columnWidths.reduce((a, b) => a + b, 0), headerHeight);
  xOffset = tableX;
  headers.forEach((_, i) => {
    doc.line(xOffset, yOffset, xOffset, yOffset + headerHeight);
    xOffset += columnWidths[i];
  });
  doc.line(tableX, yOffset + headerHeight, xOffset, yOffset + headerHeight);
  yOffset += headerHeight;

  // Table rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  for (const attr of selectedAttributes) {
    if (yOffset + rowHeight > 270) {
      doc.addPage();
      yOffset = 20;
    }
    doc.rect(tableX, yOffset, columnWidths.reduce((a, b) => a + b, 0), rowHeight);
    xOffset = tableX;
    columnWidths.forEach((_, i) => {
      doc.line(xOffset, yOffset, xOffset, yOffset + rowHeight);
      xOffset += columnWidths[i];
    });
    doc.line(tableX, yOffset + rowHeight, xOffset, yOffset + rowHeight);

    const attrNameLines = doc.splitTextToSize(attr.name, columnWidths[0] - 4);
    doc.text(attrNameLines.slice(0, 2), tableX + 2, yOffset + 7);

    const attrValue = Array.isArray(attr.value) && attr.value.length > 0 ? attr.value.join(', ') : attr.value?.toString() || 'N/A';
    const valueLines = doc.splitTextToSize(attrValue, columnWidths[1] - 4);
    doc.text(valueLines.slice(0, 2), tableX + columnWidths[0] + 2, yOffset + 7);

    yOffset += rowHeight;
  }

  // Upload report
  try {
    const formData: FormData = new FormData();
    formData.append('projectId', this.projectId);
    const tempBlob: Blob = doc.output('blob');
    const pdfFile: File = new File([tempBlob], `Full_Project_Report_${new Date().toISOString().slice(0, 10)}.pdf`, { type: 'application/pdf' });
    formData.append('reportPDF', pdfFile);

    await this.http.post('https://aspbackend-production.up.railway.app/api/project/uploadReportPDF', formData).toPromise();
    console.log('Report uploaded successfully');
  } catch (error) {
    console.error('Failed to upload report:', error);
    alert('Failed to upload report. Downloading local PDF.');
  }

  // Save PDF locally
  doc.save(`Full_Project_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
  alert('Full Project Report generated successfully!');
  this.closeFullProjReportModal();
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

  async generateReport(): Promise<void> {
    console.log('generateReport - Starting with:', {
      instanceId: this.instanceId,
      selectedInstance: this.selectedInstance,
      selectedHierarchy: this.selectedHierarchy,
      hierarchyLevelId: this.hierarchyLevelId,
      floorPlanImage: this.floorPlanImage,
      preInstallPhotos: this.preInstallPhotos.length,
      postInstallPhotos: this.postInstallPhotos.length
    });

    if (!this.selectedInstance || !this.instanceId) {
      alert('Instance details are not loaded. Please select an instance and try again.');
      return;
    }

    if (!this.selectedHierarchy) {
      alert('Hierarchy details are not loaded. Please select a hierarchy and try again.');
      return;
    }

    const tempDoc = new jsPDF();
    const margin = 10;
    const lineHeight = 10;
    const tempBlob: Blob = tempDoc.output('blob');
    const pdfFile: File = new File([tempBlob], `${this.selectedOption || 'Report'}_Report_${new Date().toISOString().slice(0, 10)}.pdf`, { type: 'application/pdf' });

    const formData: FormData = new FormData();
    formData.append('projectId', this.projectId || '');
    if (this.reportId) {
      formData.append('reportId', this.reportId);
    }
    if (this.instanceId) {
      formData.append('instanceId', this.instanceId);
    } else if (this.selectedInstance?._id) {
      this.instanceId = this.selectedInstance._id;
      formData.append('instanceId', this.instanceId);
      localStorage.setItem('instanceId', this.instanceId);
      console.log('generateReport - Fallback to selectedInstance._id:', this.instanceId);
    }
    formData.append('reportPDF', pdfFile);

    console.log('generateReport - FormData:', {
      projectId: this.projectId,
      reportId: this.reportId,
      instanceId: this.instanceId,
      reportPDF: pdfFile.name
    });

    try {
      const response: any = await this.http.post('https://aspbackend-production.up.railway.app/api/project/uploadReportPDF', formData).toPromise();
      console.log('Report uploaded successfully:', response);

      if (response.data?.coverLetter) {
        this.coverLetterData = {
          inspectionOverview: {
            totalItems: response.data.coverLetter.inspectionOverview.totalItems || 'N/A',
            passedItems: response.data.coverLetter.inspectionOverview.passedItems || 'N/A',
            failedItems: response.data.coverLetter.inspectionOverview.failedItems || 'N/A',
            tbcItems: response.data.coverLetter.inspectionOverview.tbcItems || 'N/A'
          },
          address: response.data.coverLetter.address || 'N/A',
          date: response.data.coverLetter.date || 'N/A',
          buildingName: response.data.coverLetter.buildingName || 'N/A',
          reportTitle: response.data.coverLetter.reportTitle || 'N/A',
          additionalInfo: response.data.coverLetter.additionalInfo || 'N/A'
        };
        console.log('CoverLetterData set:', this.coverLetterData);
      }

      if (response.instanceId) {
        this.instanceId = response.instanceId;
        localStorage.setItem('instanceId', this.instanceId);
      }

      const { doc, yOffset } = await this.generatePDFContent();
      this.addFooterAndSave(doc, yOffset, margin);

    } catch (error) {
      console.error('Failed to upload report:', error);
      alert('Failed to upload report. Generating local PDF with default values.');
      this.coverLetterData = null;
      const { doc, yOffset } = await this.generatePDFContent();
      doc.save(`${this.selectedOption || 'Report'}_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
      this.closeReportModal();
    }
  }

  private async generatePDFContent(): Promise<{ doc: jsPDF, yOffset: number }> {
    const doc = new jsPDF();
    let yOffset = 25;
    const margin = 10;
    const lineHeight = 10;

    try {
      doc.addImage('/images/logo.png', 'PNG', 160, 10, 30.17, 15.58);
    } catch (error) {
      console.error('Error adding logo image to PDF:', error);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(this.project?.projectName || 'N/A', margin, yOffset);
    yOffset += 10;
    doc.text(this.project?.client?.clientName || this.project?.clientName || 'N/A', margin, yOffset);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    yOffset += 20;

    doc.setFont('helvetica', 'bold');
    doc.text('Site Logo', margin, yOffset);
    const detailsXOffset = margin + 60;
    let detailsYOffset = yOffset;

    doc.setFont('helvetica', 'normal');
    doc.text(`Address: ${this.coverLetterData?.address || 'N/A'}`, detailsXOffset, detailsYOffset);
    detailsYOffset += lineHeight;
    doc.text(`Building: ${this.coverLetterData?.buildingName || 'N/A'}`, detailsXOffset, detailsYOffset);
    detailsYOffset += lineHeight;
    doc.text(`Date: ${this.coverLetterData?.date ? new Date(this.coverLetterData.date).toLocaleString('en-PK', { timeZone: 'Asia/Karachi', day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A'}`, detailsXOffset, detailsYOffset);
    detailsYOffset += lineHeight;
    doc.text(`Report Title & Revision Number: ${this.coverLetterData?.reportTitle || 'N/A'}`, detailsXOffset, detailsYOffset);

    yOffset += 10;
    console.log('Project Image URL:', this.project?.imageUrl);
    if (this.project?.imageUrl) {
      const projectImg = await this.loadImage(this.project.imageUrl);
      if (projectImg) {
        try {
          doc.addImage(projectImg, 'JPEG', margin, yOffset, 50, 50);
          yOffset += 50;
        } catch (error) {
          console.error('Failed to add project image:', error);
          doc.rect(margin, yOffset, 50, 50);
          doc.text('Image not available.', margin, yOffset + 25);
          yOffset += 50;
        }
      } else {
        doc.rect(margin, yOffset, 50, 50);
        doc.text('Image not available.', margin, yOffset + 25);
        yOffset += 50;
      }
    } else {
      doc.rect(margin, yOffset, 50, 50);
      doc.text('Image not available.', margin, yOffset + 25);
      yOffset += 50;
    }

    yOffset += 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Inspection Report Overview', margin, yOffset);
    yOffset += lineHeight;

    doc.setFont('helvetica', 'normal');
    const inspectionXOffset = margin + 5;
    let inspectionYOffset = yOffset;
    const additionalXOffset = margin + 60;

    doc.setTextColor(0, 0, 0);
    doc.text('Number of Items: ', inspectionXOffset, inspectionYOffset);
    const numberOfItemsX = inspectionXOffset + doc.getTextWidth('Number of Items: ');
    doc.text(`${this.coverLetterData?.inspectionOverview.totalItems || 'N/A'}`, numberOfItemsX, inspectionYOffset);

    doc.text(`Additional Info: ${this.coverLetterData?.additionalInfo || 'N/A'}`, additionalXOffset, inspectionYOffset);
    inspectionYOffset += lineHeight;

    doc.setTextColor(0, 0, 0);
    doc.text('Number of ', inspectionXOffset, inspectionYOffset);
    const numberOfPassX = inspectionXOffset + doc.getTextWidth('Number of ');
    doc.setTextColor(135, 225, 135);
    doc.text('PASS', numberOfPassX, inspectionYOffset);
    const passX = numberOfPassX + doc.getTextWidth('PASS');
    doc.setTextColor(0, 0, 0);
    doc.text(`: ${this.coverLetterData?.inspectionOverview.passedItems || 'N/A'}`, passX, inspectionYOffset);
    inspectionYOffset += lineHeight;

    doc.setTextColor(0, 0, 0);
    doc.text('Number of ', inspectionXOffset, inspectionYOffset);
    const numberOfFailX = inspectionXOffset + doc.getTextWidth('Number of ');
    doc.setTextColor(254, 0, 0);
    doc.text('FAIL', numberOfFailX, inspectionYOffset);
    const failX = numberOfFailX + doc.getTextWidth('FAIL');
    doc.setTextColor(0, 0, 0);
    doc.text(`: ${this.coverLetterData?.inspectionOverview.failedItems || 'N/A'}`, failX, inspectionYOffset);
    inspectionYOffset += lineHeight;

    doc.setTextColor(0, 0, 0);
    doc.text('Number of ', inspectionXOffset, inspectionYOffset);
    const numberOfTbcX = inspectionXOffset + doc.getTextWidth('Number of ');
    doc.setTextColor(128, 128, 128);
    doc.text('TBC', numberOfTbcX, inspectionYOffset);
    const tbcX = numberOfTbcX + doc.getTextWidth('TBC');
    doc.setTextColor(0, 0, 0);
    doc.text(`: ${this.coverLetterData?.inspectionOverview.tbcItems || 'N/A'}`, tbcX, inspectionYOffset);

    const additionalInfoWidth = 100;
    const additionalInfoHeight = 4 * lineHeight;
    doc.rect(additionalXOffset - 2, yOffset - lineHeight, additionalInfoWidth, additionalInfoHeight + lineHeight);

    yOffset = inspectionYOffset + lineHeight * 2;

    console.log('Hierarchy Image URL:', this.selectedHierarchy?.imageUrl);
    yOffset = await this.addHierarchyImages(doc, yOffset, margin, lineHeight);

    if (yOffset + 30 > 270) {
      doc.addPage();
      yOffset = 20;
    }

    const tableX = margin;
    const columnWidths = [10, 25, 35, 27, 20, 20, 35, 20];
    const headerHeight = 10;
    let rowHeight = 12;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    const headers = ['Ref#', 'Location', 'Plan', 'Type', 'FRL', 'Result', 'Photos', 'Comments'];
    let xOffset = tableX;
    headers.forEach((header, i) => {
      doc.text(header, xOffset + 2, yOffset + 7);
      xOffset += columnWidths[i];
    });
    doc.rect(tableX, yOffset, columnWidths.reduce((a, b) => a + b, 0), headerHeight);
    xOffset = tableX;
    headers.forEach((_, i) => {
      doc.line(xOffset, yOffset, xOffset, yOffset + headerHeight);
      xOffset += columnWidths[i];
    });
    doc.line(tableX, yOffset + headerHeight, xOffset, yOffset + headerHeight);
    yOffset += headerHeight;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const getAttributeValue = (name: string): string => {
      const attr = this.selectedInstance?.attributes?.find((a: { name: string; selectedValue?: string; value?: string | string[] }) => a.name === name);
      return attr?.selectedValue || (Array.isArray(attr?.value) && attr.value.length > 0 ? attr.value.join(', ') : attr?.value?.toString() || '') || 'N/A';
    };

    console.log('Pre-Install Photos:', this.preInstallPhotos);
    console.log('Post-Install Photos:', this.postInstallPhotos);

    const photos = [...this.preInstallPhotos, ...this.postInstallPhotos].map(photo => photo.url);
    const row = {
      ref: '1',
      location: this.selectedHierarchy?.hierarchyName || 'N/A',
      plan: this.floorPlanImage,
      type: getAttributeValue('Service'),
      frl: getAttributeValue('FRL'),
      result: this.selectedInstance?.status || 'N/A',
      photos: photos,
      comments: getAttributeValue('Comments')
    };

    console.log('Table Row Data:', row);

    const photoCount = photos.length;
    rowHeight = Math.max(12, photoCount * 30);

    doc.rect(tableX, yOffset, columnWidths.reduce((a, b) => a + b, 0), rowHeight);
    xOffset = tableX;
    columnWidths.forEach((_, i) => {
      doc.line(xOffset, yOffset, xOffset, yOffset + rowHeight);
      xOffset += columnWidths[i];
    });
    doc.line(tableX, yOffset + rowHeight, xOffset, yOffset + rowHeight);

    doc.text(row.ref, tableX + 2, yOffset + 7);

    const locationLines = doc.splitTextToSize(row.location, columnWidths[1] - 4);
    doc.text(locationLines.slice(0, 5), tableX + columnWidths[0] + 2, yOffset + 7);

    if (row.plan && !row.plan.includes('placeholder.com')) {
      const planImg = await this.loadImage(row.plan);
      if (planImg) {
        try {
          const aspectRatio = planImg.height / planImg.width;
          const imageHeight = 30 * aspectRatio;
          const maxHeight = rowHeight - 4;
          const finalHeight = Math.min(imageHeight, maxHeight);
          doc.addImage(planImg, 'JPEG', tableX + columnWidths[0] + columnWidths[1] + 2.5, yOffset + 2, 30, finalHeight);
        } catch (error) {
          console.error('Failed to add plan image to table:', error);
          doc.rect(tableX + columnWidths[0] + columnWidths[1] + 2.5, yOffset + 2, 30, 30);
          doc.text('N/A', tableX + columnWidths[0] + columnWidths[1] + 3.5, yOffset + 6);
        }
      } else {
        doc.rect(tableX + columnWidths[0] + columnWidths[1] + 2.5, yOffset + 2, 30, 30);
        doc.text('N/A', tableX + columnWidths[0] + columnWidths[1] + 3.5, yOffset + 6);
      }
    } else {
      doc.rect(tableX + columnWidths[0] + columnWidths[1] + 2.5, yOffset + 2, 30, 30);
      doc.text('N/A', tableX + columnWidths[0] + columnWidths[1] + 3.5, yOffset + 6);
    }

    doc.text(row.type, tableX + columnWidths[0] + columnWidths[1] + columnWidths[2] + 2, yOffset + 7);

    doc.text(row.frl, tableX + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3] + 2, yOffset + 7);

    doc.text(row.result, tableX + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3] + columnWidths[4] + 2, yOffset + 7);

    let photoYOffset = yOffset + 2;
    for (const photoUrl of row.photos) {
      const photoImg = await this.loadImage(photoUrl);
      if (photoImg) {
        try {
          const aspectRatio = photoImg.height / photoImg.width;
          const imageHeight = 30 * aspectRatio;
          const maxHeight = (rowHeight / Math.max(1, photoCount)) - 4;
          const finalHeight = Math.min(imageHeight, maxHeight);
          doc.addImage(photoImg, 'JPEG', tableX + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3] + columnWidths[4] + columnWidths[5] + 2.5, photoYOffset, 30, finalHeight);
          photoYOffset += finalHeight + 4;
        } catch (error) {
          console.error('Failed to add photo to table:', error);
          doc.rect(tableX + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3] + columnWidths[4] + columnWidths[5] + 2.5, photoYOffset, 30, 30);
          doc.text('N/A', tableX + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3] + columnWidths[4] + columnWidths[5] + 3.5, photoYOffset + 6);
          photoYOffset += 34;
        }
      } else {
        doc.rect(tableX + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3] + columnWidths[4] + columnWidths[5] + 2.5, photoYOffset, 30, 30);
        doc.text('N/A', tableX + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3] + columnWidths[4] + columnWidths[5] + 3.5, photoYOffset + 6);
        photoYOffset += 34;
      }
    }
    if (photoCount === 0) {
      doc.text('N/A', tableX + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3] + columnWidths[4] + columnWidths[5] + 2, yOffset + 7);
    }

    const commentLines = doc.splitTextToSize(row.comments, columnWidths[7] - 4);
    doc.text(commentLines.slice(0, 5), tableX + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3] + columnWidths[4] + columnWidths[5] + columnWidths[6] + 2, yOffset + 7);

    yOffset += rowHeight + 10;

    return { doc, yOffset };
  }

  private async addHierarchyImages(doc: jsPDF, yOffset: number, margin: number, lineHeight: number): Promise<number> {
    const imageWidth = 190;

    if (this.selectedHierarchy?.imageUrl) {
      if (yOffset + 90 > 270) {
        doc.addPage();
        yOffset = 20;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Hierarchy: ${this.selectedHierarchy.hierarchyName || 'N/A'}`, margin, yOffset);
      yOffset += 10;

      const hierarchyImg = await this.loadImage(this.selectedHierarchy.imageUrl);
      if (hierarchyImg) {
        try {
          const aspectRatio = hierarchyImg.height / hierarchyImg.width;
          const imageHeight = imageWidth * aspectRatio;
          doc.addImage(hierarchyImg, 'JPEG', margin, yOffset, imageWidth, imageHeight);
          yOffset += imageHeight + 10;
          console.log('Hierarchy image added successfully:', this.selectedHierarchy.imageUrl);
        } catch (error) {
          console.error('Failed to add hierarchy image:', error);
          doc.rect(margin, yOffset, imageWidth, 50);
          const text = 'Hierarchy image not available.';
          const textWidth = doc.getTextWidth(text);
          const textX = margin + (imageWidth - textWidth) / 2;
          doc.text(text, textX, yOffset + 25);
          yOffset += 60;
        }
      } else {
        doc.rect(margin, yOffset, imageWidth, 50);
        const text = 'Hierarchy image not available.';
        const textWidth = doc.getTextWidth(text);
        const textX = margin + (imageWidth - textWidth) / 2;
        doc.text(text, textX, yOffset + 25);
        yOffset += 60;
      }
    } else {
      console.warn('No imageUrl found for selectedHierarchy:', this.selectedHierarchy);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Hierarchy: ${this.selectedHierarchy?.hierarchyName || 'N/A'}`, margin, yOffset);
      yOffset += 10;
      doc.rect(margin, yOffset, imageWidth, 50);
      const text = 'Hierarchy image not available.';
      const textWidth = doc.getTextWidth(text);
      const textX = margin + (imageWidth - textWidth) / 2;
      doc.text(text, textX, yOffset + 25);
      yOffset += 60;
    }
    return yOffset;
  }

  private addFooterAndSave(doc: jsPDF, yOffset: number, margin: number): void {
    console.log('addFooterAndSave - instanceId:', this.instanceId, 'selectedInstance:', this.selectedInstance);
    doc.save(`${this.selectedOption || 'Report'}_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
    alert('Report generated and uploaded successfully!');
    this.closeReportModal();
    this.fetchReports();
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