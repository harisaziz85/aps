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

interface TableRow {
  'Ref No': string;
  Location: string;
  Plan: string;
  Type: string;
  Substrate: string;
  FRL: string;
  Result: string;
  Photos: string[];
  Comments: string;
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
  instances: InstanceResponse[] = [];
  preInstallPhotos: { url: string; category: string; _id: string }[] = [];
  postInstallPhotos: { url: string; category: string; _id: string }[] = [];
  markers: Marker[] = [];
  floorPlanImage: string = '';
  dropdown1 = { isOpen: false, selected: 'Select an option', options: ['In progress', 'Completed', 'To-do'] };
  isDropdownOpen: boolean = false;
  selectedOption: string = 'Excel Reports';
  reportTypes: string[] = ['Standard Reports', '2D Reports', 'Excel Reports'];
  selectedFields: { [key: string]: boolean } = {};
  selectedFieldValues: { [key: string]: string } = {};
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
  reports: any[] = [];
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

      console.log('ngOnInit - Query Params:', { projectId: this.projectId, instanceId: this

.instanceId, reportId: this.reportId, hierarchyLevelId: this.hierarchyLevelId, from });

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
        this.instances = data.instances || [];
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
        this.instances = [];
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
    this.selectedFieldValues = {};
    this.reportFields.forEach(field => {
      this.selectedFields[field.key] = false;
      const values = this.getAttributeDisplayValues(field.key);
      this.selectedFieldValues[field.key] = values.length > 0 ? values[0] : 'N/A';
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
        if (this.projectId as string && this.hierarchyLevelId) {
          this.fetchMarkers(this.projectId as string, this.hierarchyLevelId, instanceId);
        }
        this.isLoadingInstance = false;
        this.cdr.detectChanges();
        this.fetchReports();
        this.initializeSelectedFields();
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
        this.instances = instances;
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
      this.floorPlanImage = this.project?.imageUrl || 'https://via.placeholder.com/600x400?text=No+Image';
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
        this.floorPlanImage = documentWithMarkers?.documentUrl || this.project?.imageUrl || 'https://via.placeholder.com/600x400?text=No+Image';
        console.log('fetchMarkers - Response:', response);
        console.log('Markers:', this.markers, 'Floor Plan Image:', this.floorPlanImage);
      },
      error: (err: any) => {
        console.error('Error fetching markers:', err);
        this.markers = [];
        this.floorPlanImage = this.project?.imageUrl || 'https://via.placeholder.com/600x400?text=No+Image';
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
    // Constants for layout
    const margin = 10;
    const lineHeight = 10;
    const imageWidth = 52.92; // 200px ≈ 52.92mm
    const imageHeight = 52.92; // 200px ≈ 52.92mm
    const photoImageHeight = 30; // Height for photos in table
    const baseRowHeight = 30; // Minimum row height
    const pageWidth = 297; // A3 width (mm)
    const pageHeight = 420; // A3 height (mm)
    const contentWidth = pageWidth - 2 * margin;
    const bottomMargin = 40;
    const logoWidth = 40;
    const logoHeight = 20;
    const headerHeight = 10;
    const headers = ['Ref No', 'Location', 'Plan', 'Type', 'Substrate', 'FRL', 'Result', 'Photos', 'Comments'];
    const columnWidths = [20, 30, 40, 30, 30, 20, 20, 45, 42]; // Total: 277

    // Initialize PDF with A3 size
    const doc = new jsPDF({ format: 'a3' });
    let yOffset = margin;
    const maxContentHeight = pageHeight - margin - bottomMargin;

    // Helper function to normalize URLs for API-based images
    const normalizeUrl = (url: string): string => {
      if (!url) {
        console.warn('Image URL is empty, using placeholder');
        return 'https://via.placeholder.com/200x200?text=No+Image';
      }
      // Extract the file path by removing the domain and normalizing uploads
      const cleanPath = url
        .replace(/^https?:\/\/vps\.allpassiveservices\.com\.au\/?/, '') // Remove domain
        .replace(/^\/*uploads\/*/i, '') // Remove leading /uploads/
        .replace(/^\/+/, ''); // Remove any remaining leading slashes
      const normalized = `/uploads/${cleanPath}`;
      console.log(`Normalized URL: ${url} → ${normalized}`);
      return normalized;
    };

    // Helper function to load image data with CORS handling for API-based images
    const loadImage = async (url: string): Promise<string> => {
      const normalizedUrl = normalizeUrl(url);
      console.log(`Attempting to load image: ${normalizedUrl}`);
      return new Promise((resolve) => {
        fetch(normalizedUrl, {
          method: 'GET',
          headers: {
            'Accept': 'image/*'
          },
          credentials: 'same-origin'
        })
          .then(response => {
            if (!response.ok) {
              throw new Error(`HTTP error! Status: ${response.status}, URL: ${normalizedUrl}`);
            }
            console.log(`Image fetched successfully: ${normalizedUrl}`);
            return response.blob();
          })
          .then(blob => {
            const reader = new FileReader();
            reader.onload = () => {
              console.log(`Image converted to Data URL: ${normalizedUrl}`);
              resolve(reader.result as string);
            };
            reader.onerror = () => {
              console.error(`Failed to read blob for: ${normalizedUrl}`);
              resolve('https://via.placeholder.com/200x200?text=Read+Error');
            };
            reader.readAsDataURL(blob);
          })
          .catch(error => {
            console.error(`Failed to load image: ${normalizedUrl}, Error: ${error.message}`);
            resolve('https://via.placeholder.com/200x200?text=Image+Error');
          });
      });
    };

    // Helper function to load local image
    const loadLocalImage = async (url: string): Promise<string> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = url;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0);
          const dataUrl = canvas.toDataURL('image/png');
          console.log(`Local image loaded: ${url}`);
          resolve(dataUrl);
        };
        img.onerror = () => {
          console.error(`Failed to load local image: ${url}`);
          resolve('https://via.placeholder.com/200x200?text=Local+Image+Error');
        };
      });
    };

    // Helper function to check and add new page if needed
    const checkPageBreak = (requiredHeight: number) => {
      if (yOffset + requiredHeight > maxContentHeight) {
        doc.addPage();
        yOffset = margin;
        return true;
      }
      return false;
    };

    // Add Logo (Local Asset)
    try {
      const logoUrl = 'images/logo.png'; // Local path
      const logoData = await loadLocalImage(logoUrl);
      const logoX = pageWidth - margin - logoWidth;
      checkPageBreak(logoHeight + lineHeight);
      doc.addImage(logoData, 'PNG', logoX, yOffset, logoWidth, logoHeight);
      yOffset += logoHeight + lineHeight;
    } catch (error) {
      console.error('Error loading local logo image:', error);
      checkPageBreak(lineHeight * 2);
      doc.setFontSize(10);
      doc.setTextColor(255, 0, 0);
      doc.text('Failed to load logo image', pageWidth - margin - 40, yOffset + 10);
      doc.setTextColor(0, 0, 0);
      yOffset += logoHeight + lineHeight;
    }

    // Add Project Name
    checkPageBreak(lineHeight);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(`Project Name: ${this.project?.projectName || 'Unknown Project'}`, margin, yOffset);
    yOffset += lineHeight;

    // Add Client Name
    checkPageBreak(lineHeight);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`Client Name: ${this.project?.client?.clientName || this.project?.clientName || 'Unknown Client'}`, margin, yOffset);
    yOffset += lineHeight + 10;

    // Add Site Photos Heading
    checkPageBreak(lineHeight);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Site Photos', margin, yOffset);
    yOffset += lineHeight;

    // Add Project Image
    const projectImageUrl = normalizeUrl(this.project?.imageUrl || 'https://via.placeholder.com/600x400?text=No+Image');
    try {
      const imgData = await loadImage(projectImageUrl);
      checkPageBreak(imageHeight + lineHeight);
      doc.addImage(imgData, 'PNG', margin, yOffset, imageWidth, imageHeight);
      yOffset += imageHeight + lineHeight;
    } catch (error) {
      console.error(`Error loading project image: ${projectImageUrl}`, error);
      checkPageBreak(lineHeight * 2);
      doc.setFontSize(10);
      doc.setTextColor(255, 0, 0);
      doc.text(`Failed to load image: ${projectImageUrl}`, margin, yOffset);
      doc.setTextColor(0, 0, 0);
      yOffset += lineHeight * 2;
    }

    // Prepare Table Data
    const tableData: TableRow[] = [];
    let index = 1;
    if (this.instances?.length > 0) {
      for (const instance of this.instances) {
        const row: TableRow = {
          'Ref No': index.toString(),
          Location: instance.hierarchyName || this.project?.hierarchyLevels?.[0]?.name || 'N/A',
          Plan: 'N/A',
          Type: instance.subProjectCategory || this.project?.subProjects?.map(sp => sp.hierarchyName).join(', ') || 'N/A',
          Substrate: instance.attributes?.find(attr => attr.name === 'Materils')?.selectedValue || 'N/A',
          FRL: instance.attributes?.find(attr => attr.name === 'FRL')?.selectedValue || 'N/A',
          Result: instance.attributes?.find(attr => attr.name === 'Compliance')?.selectedValue || 'N/A',
          Photos: (instance.photos || []).map(p => normalizeUrl(p.url)),
          Comments: instance.attributes?.find(attr => attr.name === 'Comments')?.selectedValue || 'N/A'
        };
        tableData.push(row);
        index++;
      }
    } else {
      tableData.push({
        'Ref No': '1',
        Location: this.project?.hierarchyLevels?.[0]?.name || 'N/A',
        Plan: 'N/A',
        Type: this.project?.subProjects?.map(sp => sp.hierarchyName).join(', ') || 'N/A',
        Substrate: this.getAttributeDisplayValue('Materils'),
        FRL: this.getAttributeDisplayValue('FRL'),
        Result: this.getAttributeDisplayValue('Compliance'),
        Photos: [],
        Comments: this.getAttributeDisplayValue('Comments')
      });
    }

    // Add Attributes Table
    checkPageBreak(lineHeight * 3 + headerHeight);
    yOffset += lineHeight * 3;
    const tableX = margin;
    const tableStartY = yOffset;

    // Draw table headers
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    let xOffset = tableX;
    headers.forEach((header, index) => {
      doc.setFillColor(0, 0, 0);
      doc.rect(xOffset, yOffset, columnWidths[index], headerHeight, 'F');
      doc.setTextColor(255, 255, 255);
      const headerLines = doc.splitTextToSize(header, columnWidths[index] - 4);
      doc.text(headerLines, xOffset + columnWidths[index] / 2, yOffset + 8, { align: 'center' });
      doc.setLineWidth(0.2);
      doc.setDrawColor(255, 255, 255);
      doc.rect(xOffset, yOffset, columnWidths[index], headerHeight);
      xOffset += columnWidths[index];
    });
    doc.setTextColor(0, 0, 0);
    yOffset += headerHeight;

    // Draw table rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    let tableEndY = yOffset;
    for (const row of tableData) {
      const commentsText = row['Comments'] || 'N/A';
      const commentsLines = doc.splitTextToSize(commentsText, columnWidths[headers.indexOf('Comments')] - 4);
      const commentsHeight = commentsLines.length * 6;
      const photosHeight = row['Photos'].length > 0 ? photoImageHeight : 6;
      const rowHeight = Math.max(baseRowHeight, commentsHeight, photosHeight);

      checkPageBreak(rowHeight);
      const rowStartY = yOffset;
      xOffset = tableX;
      for (const header of headers) {
        const colIndex = headers.indexOf(header);
        if (header === 'Plan' && this.project?.documents?.[0]?.documentUrl) {
          try {
            const imgData = await loadImage(normalizeUrl(this.project.documents[0].documentUrl));
            const imgWidth = columnWidths[colIndex] - 4;
            const imgHeight = Math.min(photoImageHeight - 4, rowHeight - 4);
            doc.addImage(imgData, 'PNG', xOffset + 2, yOffset + 2, imgWidth, imgHeight);
          } catch (error) {
            console.error('Error loading plan image:', error);
            doc.setTextColor(255, 0, 0);
            doc.text('Failed to load plan image', xOffset + 2, yOffset + 8);
            doc.setTextColor(0, 0, 0);
          }
        } else if (header === 'Photos' && row['Photos'].length > 0) {
          try {
            const photoPromises = row['Photos'].slice(0, 1).map(url => loadImage(url));
            const [imgData] = await Promise.all(photoPromises);
            const imgWidth = columnWidths[colIndex] - 4;
            const imgHeight = Math.min(photoImageHeight - 4, rowHeight - 4);
            doc.addImage(imgData, 'PNG', xOffset + 2, yOffset + 2, imgWidth, imgHeight);
          } catch (error) {
            console.error('Error loading photo:', error);
            doc.setTextColor(255, 0, 0);
            doc.text('Failed to load photo', xOffset + 2, yOffset + 8);
            doc.setTextColor(0, 0, 0);
          }
        } else if (header === 'Result') {
          const cellText = row[header] || 'N/A';
          const cellLines = doc.splitTextToSize(cellText, columnWidths[colIndex] - 4);
          const textHeight = cellLines.length * 6;
          const yCenter = yOffset + (rowHeight - textHeight) / 2 + 2;
          if (cellText.toUpperCase() === 'PASS') {
            doc.setTextColor(92, 201, 110);
          } else if (cellText.toUpperCase() === 'FAIL') {
            doc.setTextColor(228, 66, 52);
          } else if (cellText.toUpperCase() === 'TBC') {
            doc.setTextColor(128, 128, 128);
          } else {
            doc.setTextColor(0, 0, 0);
          }
          doc.text(cellLines, xOffset + columnWidths[colIndex] / 2, yCenter, { align: 'center' });
          doc.setTextColor(0, 0, 0);
        } else if (header === 'Comments') {
          const cellLines = doc.splitTextToSize(row[header] || 'N/A', columnWidths[colIndex] - 4);
          const textHeight = cellLines.length * 6;
          const yCenter = yOffset + (rowHeight - textHeight) / 2 + 2;
          doc.text(cellLines, xOffset + columnWidths[colIndex] / 2, yCenter, { align: 'center' });
        } else if (header !== 'Photos') {
          const cellText = row[header as keyof TableRow] || 'N/A';
          const cellLines = doc.splitTextToSize(cellText as string, columnWidths[colIndex] - 4);
          const textHeight = cellLines.length * 6;
          const yCenter = yOffset + (rowHeight - textHeight) / 2 + 2;
          doc.text(cellLines, xOffset + columnWidths[colIndex] / 2, yCenter, { align: 'center' });
        }
        doc.setLineWidth(0.2);
        doc.setDrawColor(0, 0, 0);
        doc.rect(xOffset, yOffset, columnWidths[colIndex], rowHeight);
        xOffset += columnWidths[colIndex];
      }
      yOffset += rowHeight;
      tableEndY = yOffset;
    }

    // Draw outer table border
    doc.setLineWidth(0.5);
    doc.setDrawColor(0, 0, 0);
    doc.rect(tableX, tableStartY, contentWidth, tableEndY - tableStartY);

    // Include selected fields below the table (if any)
    const includeTechnicalDocs = (document.getElementById('includeTechnicalDocs') as HTMLInputElement)?.checked;
    const includeFloorPlans = (document.getElementById('includeFloorPlans') as HTMLInputElement)?.checked;
    const includeAdditionalDocs = (document.getElementById('includeAdditionalDocs') as HTMLInputElement)?.checked;
    const excludeBlankFields = (document.getElementById('excludeBlankFields') as HTMLInputElement)?.checked;

    if (includeTechnicalDocs || includeFloorPlans || includeAdditionalDocs) {
      checkPageBreak(lineHeight * 3);
      yOffset += lineHeight * 2;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Report Attachments:', margin, yOffset);
      yOffset += lineHeight;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      if (includeTechnicalDocs) {
        doc.text('- Technical Documents', margin, yOffset);
        yOffset += lineHeight;
      }
      if (includeFloorPlans) {
        doc.text('- Floor Plans', margin, yOffset);
        yOffset += lineHeight;
      }
      if (includeAdditionalDocs) {
        doc.text('- Additional Documents', margin, yOffset);
        yOffset += lineHeight;
      }
    }

    // Save the PDF
    doc.save(`Report_${this.projectId}_${this.instanceId}_${new Date().toISOString().slice(0, 10)}.pdf`);

    // Generate Excel Report if selected
    if (this.selectedOption === 'Excel Reports') {
      const reportData: { [key: string]: string } = {};
      this.reportFields.forEach(field => {
        const values = this.getAttributeDisplayValues(field.key);
        reportData[field.key] = values.length > 1 ? this.selectedFieldValues[field.key] : this.getAttributeDisplayValue(field.key);
      });

      const data: any[] = [];
      this.reportFields.forEach(field => {
        if (this.selectedFields[field.key]) {
          const value = reportData[field.key];
          const displayValue = Array.isArray(value) ? value.join(', ') : value || 'N/A';
          if (!excludeBlankFields || (excludeBlankFields && displayValue !== 'N/A')) {
            data.push({ Field: field.name, Value: displayValue });
          }
        }
      });

      if (includeTechnicalDocs || includeFloorPlans || includeAdditionalDocs) {
        let attachments: string[] = [];
        if (includeTechnicalDocs) attachments.push('Technical Documents');
        if (includeFloorPlans) attachments.push('Floor Plans');
        if (includeAdditionalDocs) attachments.push('Additional Documents');
        data.push({ Field: 'Attachments', Value: attachments.join(', ') });
      }

      const ws = XLSX.utils.json_to_sheet(data, { header: ['Field', 'Value'] });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Report');
      XLSX.writeFile(wb, `Report_${this.projectId}_${this.instanceId}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    }

    alert('Report generated successfully!');
    this.closeReportModal();
  }

  getAttributeDisplayValue(key: string): string {
    const reportData: { [key: string]: string | string[] } = {
      productName: this.selectedInstance?.attributes.find(attr => attr.name === 'Product Name')?.selectedValue || 'N/A',
      approval: this.selectedInstance?.attributes.find(attr => attr.name === 'Approval')?.selectedValue || 'N/A',
      building: this.project?.buildingName || '21',
      level: this.selectedInstance?.hierarchyName || 'N/A',
      itemNumber: this.selectedInstance?.attributes.find(attr => attr.name === 'Sticker Number')?.selectedValue || 'N/A',
      testReference: this.selectedInstance?.attributes.find(attr => attr.name === 'Test ID')?.selectedValue || 'N/A',
      location: this.selectedInstance?.attributes.find(attr => attr.name === 'Location')?.selectedValue || 'N/A',
      frl: this.selectedInstance?.attributes.find(attr => attr.name === 'FRL')?.selectedValue || 'N/A',
      barrier: this.selectedInstance?.attributes.find(attr => attr.name === 'Barrier')?.selectedValue || 'N/A',
      description: this.selectedInstance?.attributes.find(attr => attr.name === 'Description')?.selectedValue || 'N/A',
      installer: this.selectedInstance?.attributes.find(attr => attr.name === 'Installer')?.selectedValue || 'N/A',
      inspector: this.selectedInstance?.attributes.find(attr => attr.name === 'Inspector')?.selectedValue || 'N/A',
      safetyMeasures: this.selectedInstance?.attributes.find(attr => attr.name === 'Safety Measures')?.selectedValue || 'N/A',
      relevanceToBuildingCode: this.selectedInstance?.attributes.find(attr => attr.name === 'Reference to Building Code')?.selectedValue || 'N/A',
      compliance: this.selectedInstance?.attributes.find(attr => attr.name === 'Compliance')?.selectedValue || 'N/A',
      comments: this.selectedInstance?.attributes.find(attr => attr.name === 'Comments')?.selectedValue || 'N/A',
      notes: this.selectedInstance?.attributes.find(attr => attr.name === 'Notes')?.selectedValue || 'N/A',
      time: this.selectedInstance?.attributes.find(attr => attr.name === 'Time')?.selectedValue || 'N/A',
      priceExcludingGST: this.selectedInstance?.attributes.find(attr => attr.name === 'Price Excluding GST')?.selectedValue || 'N/A'
    };
    const value = reportData[key];
    return Array.isArray(value) ? (value[0] || 'N/A') : (value || 'N/A');
  }

  getAttributeDisplayValues(key: string): string[] {
    const reportData: { [key: string]: string | string[] } = {
      productName: this.selectedInstance?.attributes.find(attr => attr.name === 'Product Name')?.selectedValue || 'N/A',
      approval: this.selectedInstance?.attributes.find(attr => attr.name === 'Approval')?.selectedValue || 'N/A',
      building: this.project?.buildingName || '21',
      level: this.selectedInstance?.hierarchyName || 'N/A',
      itemNumber: this.selectedInstance?.attributes.find(attr => attr.name === 'Sticker Number')?.selectedValue || 'N/A',
      testReference: this.selectedInstance?.attributes.find(attr => attr.name === 'Test ID')?.selectedValue || 'N/A',
      location: this.selectedInstance?.attributes.find(attr => attr.name === 'Location')?.selectedValue || 'N/A',
      frl: this.selectedInstance?.attributes.find(attr => attr.name === 'FRL')?.selectedValue || 'N/A',
      barrier: this.selectedInstance?.attributes.find(attr => attr.name === 'Barrier')?.selectedValue || 'N/A',
      description: this.selectedInstance?.attributes.find(attr => attr.name === 'Description')?.selectedValue || 'N/A',
      installer: this.selectedInstance?.attributes.find(attr => attr.name === 'Installer')?.selectedValue || 'N/A',
      inspector: this.selectedInstance?.attributes.find(attr => attr.name === 'Inspector')?.selectedValue || 'N/A',
      safetyMeasures: this.selectedInstance?.attributes.find(attr => attr.name === 'Safety Measures')?.selectedValue || 'N/A',
      relevanceToBuildingCode: this.selectedInstance?.attributes.find(attr => attr.name === 'Reference to Building Code')?.selectedValue || 'N/A',
      compliance: this.selectedInstance?.attributes.find(attr => attr.name === 'Compliance')?.selectedValue || 'N/A',
      comments: this.selectedInstance?.attributes.find(attr => attr.name === 'Comments')?.selectedValue || 'N/A',
      notes: this.selectedInstance?.attributes.find(attr => attr.name === 'Notes')?.selectedValue || 'N/A',
      time: this.selectedInstance?.attributes.find(attr => attr.name === 'Time')?.selectedValue || 'N/A',
      priceExcludingGST: this.selectedInstance?.attributes.find(attr => attr.name === 'Price Excluding GST')?.selectedValue || 'N/A'
    };
    const value = reportData[key];
    if (Array.isArray(value) && value.length > 0) {
      return value.filter((v: string) => v !== '');
    }
    return [typeof value === 'string' && value !== '' ? value : 'N/A'];
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

  getReportIndex(report: any): number {
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