import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { PresentationService } from '../../core/services/presentation.service';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { SvgIconsComponent } from '../../shared/svg-icons/svg-icons.component';
import { FootComponent } from '../components/foot/foot.component';
import { ProjectResponse, InstanceResponse, Marker, Document } from '../../core/models/presentation';

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
export class PresentationComponent implements OnInit, AfterViewInit {
  @ViewChild('editCanvas') editCanvas!: ElementRef<HTMLCanvasElement>;

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
  reportTypes: string[] = ['Standard Reports', '2D Reports', 'Excel Reports'];
  selectedFields: { [key: string]: boolean } = {};
  reportFields: { key: string; name: string }[] = [
    { key: 'productName', name: 'Product Name' },
    { key: 'approval', name: 'Approval' },
    { key: 'building', name: 'Building' },
    { key: 'level', name: 'Level' },
    { key: 'itemNumber', name: 'Item #' },
    { key: 'testReference', name: 'Test Reference' },
    { key: 'location', name: 'Location' },
    { key: 'frl', name: 'FRL' },
    { key: 'barrier', name: 'Barrier' },
    { key: 'description', name: 'Description' },
    { key: 'date', name: 'Date' },
    { key: 'installer', name: 'Installer' },
    { key: 'inspector', name: 'Inspector' },
    { key: 'safetyMeasures', name: 'Safety Measures' },
    { key: 'relevanceToBuildingCode', name: 'Relevance to Building Code' },
    { key: 'compliance', name: 'Compliance' },
    { key: 'comments', name: 'Comments' },
    { key: 'notes', name: 'Notes' },
    { key: 'time', name: 'Time' },
    { key: 'priceExcludingGST', name: 'Price Excluding GST' }
  ];
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

  // Image Editing Properties
  isEditing: boolean = false;
  ctx!: CanvasRenderingContext2D;
  drawColor: string = '#000000';
  currentTool: string = 'line';
  isDrawing: boolean = false;
  startX: number = 0;
  startY: number = 0;
  currentX: number = 0;
  currentY: number = 0;

  constructor(
    private route: ActivatedRoute,
    private presentationService: PresentationService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    window.scrollTo(0, 0);
    this.initializeSelectedFields();
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

  ngAfterViewInit(): void {
    if (this.editCanvas) {
      this.ctx = this.editCanvas.nativeElement.getContext('2d')!;
      this.ctx.lineWidth = 2;
      this.ctx.strokeStyle = this.drawColor;
    }
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

  initializeSelectedFields(): void {
    this.selectedFields = {};
    this.reportFields.forEach(field => {
      this.selectedFields[field.key] = false;
    });
  }

  isSelectAllIndeterminate(): boolean {
    const checkedCount = this.reportFields.filter(field => this.selectedFields[field.key]).length;
    return checkedCount > 0 && checkedCount < this.reportFields.length;
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
        console.log('Instance Attributes:', this.selectedInstance?.attributes?.map(attr => attr.name));
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
    this.initializeCanvas();
  }

  closeImageModal(): void {
    this.isImageModalOpen = false;
    this.isEditing = false;
    this.currentTool = 'line';
    this.drawColor = '#000000';
    document.body.style.overflow = 'auto';
    if (this.editCanvas && this.ctx) {
      this.ctx.clearRect(0, 0, this.editCanvas.nativeElement.width, this.editCanvas.nativeElement.height);
    }
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
    this.reportFields.forEach(field => {
      this.selectedFields[field.key] = checked;
    });
    this.updateSelectAll();
  }

  updateSelectAll(): void {
    const selectAllCheckbox = document.getElementById('selectAll') as HTMLInputElement | null;
    if (selectAllCheckbox) {
      const allChecked = this.reportFields.every(field => this.selectedFields[field.key]);
      const someChecked = this.reportFields.some(field => this.selectedFields[field.key]);
      selectAllCheckbox.checked = allChecked;
      selectAllCheckbox.indeterminate = someChecked && !allChecked;
    }
  }

  async generateReport(): Promise<void> {
    // Collect report data
    const reportData = {
      productName: this.selectedInstance?.attributes.find(attr => attr.name === 'Product Name')?.value || 'N/A',
      approval: this.selectedInstance?.attributes.find(attr => attr.name === 'Approval')?.value || 'N/A',
      building: this.selectedInstance?.attributes.find(attr => attr.name === 'Building')?.value || 'N/A',
      level: this.selectedInstance?.attributes.find(attr => attr.name === 'Level')?.value || 'N/A',
      itemNumber: this.selectedInstance?.attributes.find(attr => attr.name === 'Item #')?.value || 'N/A',
      testReference: this.selectedInstance?.attributes.find(attr => attr.name === 'Test Reference')?.value || 'N/A',
      location: this.selectedInstance?.attributes.find(attr => attr.name === 'Location')?.value || 'N/A',
      frl: this.selectedInstance?.attributes.find(attr => attr.name === 'FRL')?.value || 'N/A',
      barrier: this.selectedInstance?.attributes.find(attr => attr.name === 'Barrier')?.value || 'N/A',
      description: this.selectedInstance?.attributes.find(attr => attr.name === 'Description')?.value || 'N/A',
      date: this.selectedInstance?.attributes.find(attr => attr.name === 'Date')?.value || 'N/A',
      installer: this.selectedInstance?.attributes.find(attr => attr.name === 'Installer')?.value || 'N/A',
      inspector: this.selectedInstance?.attributes.find(attr => attr.name === 'Inspector')?.value || 'N/A',
      safetyMeasures: this.selectedInstance?.attributes.find(attr => attr.name === 'Safety Measures')?.value || 'N/A',
      relevanceToBuildingCode: this.selectedInstance?.attributes.find(attr => attr.name === 'Relevance to Building Code')?.value || 'N/A',
      compliance: this.selectedInstance?.attributes.find(attr => attr.name === 'Compliance')?.value || 'N/A',
      comments: this.selectedInstance?.attributes.find(attr => attr.name === 'Comments')?.value || 'N/A',
      notes: this.selectedInstance?.attributes.find(attr => attr.name === 'Notes')?.value || 'N/A',
      time: this.selectedInstance?.attributes.find(attr => attr.name === 'Time')?.value || 'N/A',
      priceExcludingGST: this.selectedInstance?.attributes.find(attr => attr.name === 'Price Excluding GST')?.value || 'N/A'
    };

    const includeTechnicalDocs = (document.getElementById('includeTechnicalDocs') as HTMLInputElement)?.checked;
    const includeFloorPlans = (document.getElementById('includeFloorPlans') as HTMLInputElement)?.checked;
    const includeAdditionalDocs = (document.getElementById('includeAdditionalDocs') as HTMLInputElement)?.checked;
    const excludeBlankFields = (document.getElementById('excludeBlankFields') as HTMLInputElement)?.checked;

    if (this.selectedOption === 'Excel Reports') {
      // Generate Excel Report
      const data: any[] = [];

      // Add all fields as rows
      this.reportFields.forEach(field => {
        const value = reportData[field.key as keyof typeof reportData];
        const displayValue = Array.isArray(value) ? value.join(', ') : value?.toString() || 'N/A';
        data.push({ Field: field.name, Value: displayValue });
      });

      // Add attachments as a row if selected
      if (includeTechnicalDocs || includeFloorPlans || includeAdditionalDocs) {
        let attachments: string[] = [];
        if (includeTechnicalDocs) attachments.push('Technical Documents');
        if (includeFloorPlans) attachments.push('Floor Plans');
        if (includeAdditionalDocs) attachments.push('Additional Documents');
        data.push({ Field: 'Attachments', Value: attachments.join(', ') });
      }

      // Create worksheet and workbook
      const ws = XLSX.utils.json_to_sheet(data, { header: ['Field', 'Value'] });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Report');

      // Generate and download Excel file
      XLSX.writeFile(wb, `Report_${this.projectId}_${this.instanceId}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } else {
      // Generate PDF Report (for Standard Reports and 2D Reports)
      const doc = new jsPDF();
      let y = 40; // Start content below the image to avoid overlap

      // Load and add logo image to top-right
      const loadImage = (url: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.src = url;
          img.crossOrigin = 'Anonymous';
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error(`Failed to load image at ${url}`));
        });
      };

      try {
        const img = await loadImage('/images/logo.png');
        const imgWidth = 50; // Adjust width as needed
        const imgHeight = 20; // Adjust height as needed
        const pageWidth = doc.internal.pageSize.getWidth();
        const x = pageWidth - imgWidth - 10; // 10mm from right edge
        doc.addImage(img, 'PNG', x, 10, imgWidth, imgHeight);
      } catch (error) {
        console.error('Error loading logo image:', error);
        // Optionally add placeholder text or skip
        doc.text('Logo not found', 160, 15);
      }

      // Include selected fields in the report
      this.reportFields.forEach(field => {
        if (this.selectedFields[field.key]) {
          const value = reportData[field.key as keyof typeof reportData];
          const displayValue = Array.isArray(value) ? value.join(', ') : value?.toString() || 'N/A';
          if (!excludeBlankFields || (excludeBlankFields && displayValue !== 'N/A')) {
            doc.text(`${field.name}: ${displayValue}`, 10, y);
            y += 10;
          }
        }
      });

      // Include report attachments if selected
      if (includeTechnicalDocs || includeFloorPlans || includeAdditionalDocs) {
        doc.text('Report Attachments:', 10, y);
        y += 10;
        if (includeTechnicalDocs) {
          doc.text('- Technical Documents', 10, y);
          y += 10;
        }
        if (includeFloorPlans) {
          doc.text('- Floor Plans', 10, y);
          y += 10;
        }
        if (includeAdditionalDocs) {
          doc.text('- Additional Documents', 10, y);
          y += 10;
        }
      }

      // Save the PDF
      doc.save(`Report_${this.projectId}_${this.instanceId}_${new Date().toISOString().slice(0, 10)}.pdf`);
    }

    alert('Report generated successfully!');
    this.closeReportModal();
  }

  getAttributeDisplayValue(key: string): string {
    const reportData = {
      productName: this.selectedInstance?.attributes.find(attr => attr.name === 'Product Name')?.value || 'N/A',
      approval: this.selectedInstance?.attributes.find(attr => attr.name === 'Approval')?.value || 'N/A',
      building: this.selectedInstance?.attributes.find(attr => attr.name === 'Building')?.value || 'N/A',
      level: this.selectedInstance?.attributes.find(attr => attr.name === 'Level')?.value || 'N/A',
      itemNumber: this.selectedInstance?.attributes.find(attr => attr.name === 'Item #')?.value || 'N/A',
      testReference: this.selectedInstance?.attributes.find(attr => attr.name === 'Test Reference')?.value || 'N/A',
      location: this.selectedInstance?.attributes.find(attr => attr.name === 'Location')?.value || 'N/A',
      frl: this.selectedInstance?.attributes.find(attr => attr.name === 'FRL')?.value || 'N/A',
      barrier: this.selectedInstance?.attributes.find(attr => attr.name === 'Barrier')?.value || 'N/A',
      description: this.selectedInstance?.attributes.find(attr => attr.name === 'Description')?.value || 'N/A',
      date: this.selectedInstance?.attributes.find(attr => attr.name === 'Date')?.value || 'N/A',
      installer: this.selectedInstance?.attributes.find(attr => attr.name === 'Installer')?.value || 'N/A',
      inspector: this.selectedInstance?.attributes.find(attr => attr.name === 'Inspector')?.value || 'N/A',
      safetyMeasures: this.selectedInstance?.attributes.find(attr => attr.name === 'Safety Measures')?.value || 'N/A',
      relevanceToBuildingCode: this.selectedInstance?.attributes.find(attr => attr.name === 'Relevance to Building Code')?.value || 'N/A',
      compliance: this.selectedInstance?.attributes.find(attr => attr.name === 'Compliance')?.value || 'N/A',
      comments: this.selectedInstance?.attributes.find(attr => attr.name === 'Comments')?.value || 'N/A',
      notes: this.selectedInstance?.attributes.find(attr => attr.name === 'Notes')?.value || 'N/A',
      time: this.selectedInstance?.attributes.find(attr => attr.name === 'Time')?.value || 'N/A',
      priceExcludingGST: this.selectedInstance?.attributes.find(attr => attr.name === 'Price Excluding GST')?.value || 'N/A'
    };
    const value = reportData[key as keyof typeof reportData];
    return Array.isArray(value) ? value.join(', ') : value?.toString() || 'N/A';
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

  toggleEditMode(): void {
    this.isEditing = !this.isEditing;
    if (this.isEditing) {
      this.initializeCanvas();
      this.redrawImage();
    } else {
      if (this.editCanvas && this.ctx) {
        this.ctx.clearRect(0, 0, this.editCanvas.nativeElement.width, this.editCanvas.nativeElement.height);
        this.redrawImage();
      }
    }
  }

  initializeCanvas(): void {
    if (this.editCanvas && this.ctx) {
      const canvas = this.editCanvas.nativeElement;
      canvas.width = 520;
      canvas.height = 480;
      this.ctx.clearRect(0, 0, canvas.width, canvas.height);
      this.ctx.lineWidth = 2;
      this.ctx.strokeStyle = this.drawColor;
      canvas.addEventListener('mousedown', this.startDrawing.bind(this));
      canvas.addEventListener('mousemove', this.draw.bind(this));
      canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
      canvas.addEventListener('mouseout', this.stopDrawing.bind(this));
    }
  }

  redrawImage(): void {
    if (this.editCanvas && this.ctx) {
      const canvas = this.editCanvas.nativeElement;
      const img = new Image();
      img.src = this.selectedImage;
      img.onload = () => {
        this.ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
    }
  }

  setTool(tool: string): void {
    this.currentTool = tool;
  }

  updateDrawColor(): void {
    if (this.ctx) {
      this.ctx.strokeStyle = this.drawColor;
    }
  }

  startDrawing(event: MouseEvent): void {
    if (this.isEditing && this.ctx) {
      this.isDrawing = true;
      const canvas = this.editCanvas.nativeElement;
      const rect = canvas.getBoundingClientRect();
      this.startX = event.clientX - rect.left;
      this.startY = event.clientY - rect.top;
      this.ctx.beginPath();
      this.redrawImage();
    }
  }

  draw(event: MouseEvent): void {
    if (this.isEditing && this.isDrawing && this.ctx) {
      const canvas = this.editCanvas.nativeElement;
      const rect = canvas.getBoundingClientRect();
      this.currentX = event.clientX - rect.left;
      this.currentY = event.clientY - rect.top;

      this.ctx.clearRect(0, 0, canvas.width, canvas.height);
      this.redrawImage();

      if (this.currentTool === 'line') {
        this.ctx.beginPath();
        this.ctx.moveTo(this.startX, this.startY);
        this.ctx.lineTo(this.currentX, this.currentY);
        this.ctx.stroke();
      } else if (this.currentTool === 'circle') {
        const radius = Math.sqrt(Math.pow(this.currentX - this.startX, 2) + Math.pow(this.currentY - this.startY, 2));
        this.ctx.beginPath();
        this.ctx.arc(this.startX, this.startY, radius, 0, Math.PI * 2);
        this.ctx.stroke();
      }
    }
  }

  stopDrawing(event: MouseEvent): void {
    if (this.isEditing && this.isDrawing && this.ctx) {
      this.isDrawing = false;
      const canvas = this.editCanvas.nativeElement;
      const rect = canvas.getBoundingClientRect();
      this.currentX = event.clientX - rect.left;
      this.currentY = event.clientY - rect.top;

      if (this.currentTool === 'line') {
        this.ctx.beginPath();
        this.ctx.moveTo(this.startX, this.startY);
        this.ctx.lineTo(this.currentX, this.currentY);
        this.ctx.stroke();
      } else if (this.currentTool === 'circle') {
        const radius = Math.sqrt(Math.pow(this.currentX - this.startX, 2) + Math.pow(this.currentY - this.startY, 2));
        this.ctx.beginPath();
        this.ctx.arc(this.startX, this.startY, radius, 0, Math.PI * 2);
        this.ctx.stroke();
      }
    }
  }

  saveEditedImage(): void {
    if (this.editCanvas && this.ctx) {
      const canvas = this.editCanvas.nativeElement;
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `edited_image_${Date.now()}.png`;
      link.click();
    }
    this.toggleEditMode();
  }

  cancelEditMode(): void {
    this.isEditing = false;
    if (this.editCanvas && this.ctx) {
      this.ctx.clearRect(0, 0, this.editCanvas.nativeElement.width, this.editCanvas.nativeElement.height);
      this.redrawImage();
    }
  }
}
