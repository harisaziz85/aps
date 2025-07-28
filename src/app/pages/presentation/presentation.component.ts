import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { PresentationService } from '../../core/services/presentation.service';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { SvgIconsComponent } from '../../shared/svg-icons/svg-icons.component';
import { FootComponent } from '../components/foot/foot.component';
import { ProjectResponse, InstanceResponse, Marker, Document } from '../../core/models/presentation';
import { HttpClient } from '@angular/common/http';

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

interface Product {
  _id: string;
  name: string;
  approvalDocuments: { _id: string; name: string; fileUrl: string; createdAt: string; __v: number }[];
  createdAt: string;
  updatedAt: string;
  __v: number;
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
  instances: InstanceResponse[] = [];
  preInstallPhotos: { url: string; category: string; _id: string }[] = [];
  postInstallPhotos: { url: string; category: string; _id: string }[] = [];
  tablePhotos: { url: string; category: string; _id: string }[] = [];
  markers: Marker[] = [];
  floorPlanImage: string = '';
  dropdown1 = { isOpen: false, selected: 'Select an option', options: ['In progress', 'Completed', 'To-do'] };
  isDropdownOpen: boolean = false;
  selectedOption: string = 'Excel Reports';
  reportTypes: string[] = ['Standard Reports', '2D Reports', 'Excel Reports'];
  selectedFields: { [key: string]: boolean } = {};
  selectedFieldValues: { [key: string]: string } = {};
  dropdownStates: { [key: string]: boolean } = {};
  reportFields: { key: string; name: string }[] = [
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
  products: Product[] = [];
  selectedProduct: string = '';
  approvalDocuments: { _id: string; name: string; fileUrl: string }[] = [];
  isProductDropdownOpen: boolean = false;
  isApprovalDropdownOpen: boolean = false;
  selectedApprovalDocument: string = '';
  selectedProductName: string = 'Select a product';
  selectedApprovalDocumentName: string = 'Select a document';
  isProductSelected: boolean = false;
  selectApproval: boolean = false;
  hierarchyLevels: string[] = [];
  attributeValues: { [key: string]: string[] } = {};

  constructor(
    private route: ActivatedRoute,
    private presentationService: PresentationService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    window.scrollTo(0, 0);
    this.initializeSelectedFields();
    this.fetchProducts();
    this.route.queryParams.subscribe(params => {
      this.projectId = params['projectId'] || this.route.snapshot.paramMap.get('projectId') || '';
      this.instanceId = params['instanceId'] || localStorage.getItem('instanceId') || this.instanceId;
      this.reportId = params['reportId'] || null;
      this.hierarchyLevelId = params['hierarchyLevelId'] || '';
      const from: string | undefined = params['from'];

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
        this.fetchAttributes(this.projectId);
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

  fetchProducts(): void {
    this.http.get<Product[]>('https://vps.allpassiveservices.com.au/api/product/list').subscribe({
      next: (response) => {
        this.products = response || [];
        this.updateSelectedProductName();
        this.updateSelectedApprovalDocumentName();
        this.cdr.detectChanges();
      },
      error: () => {
        this.products = [];
        this.updateSelectedProductName();
        this.updateSelectedApprovalDocumentName();
        this.cdr.detectChanges();
      }
    });
  }

  selectProduct(productId: string): void {
    this.selectedProduct = productId;
    const product = this.products.find(p => p._id === productId);
    this.approvalDocuments = product ? product.approvalDocuments : [];
    this.selectedApprovalDocument = this.approvalDocuments.length > 0 ? this.approvalDocuments[0].fileUrl : '';
    this.updateSelectedProductName();
    this.updateSelectedApprovalDocumentName();
    this.isProductDropdownOpen = false;
    this.cdr.detectChanges();
  }

  toggleProductDropdown(): void {
    this.isProductDropdownOpen = !this.isProductDropdownOpen;
    this.isApprovalDropdownOpen = false;
    this.isDropdownOpen = false;
    this.closeAllFieldDropdowns();
  }

  toggleApprovalDropdown(): void {
    this.isApprovalDropdownOpen = !this.isApprovalDropdownOpen;
    this.isProductDropdownOpen = false;
    this.isDropdownOpen = false;
    this.closeAllFieldDropdowns();
  }

  selectApprovalDocument(documentUrl: string): void {
    this.selectedApprovalDocument = documentUrl;
    this.updateSelectedApprovalDocumentName();
    this.isApprovalDropdownOpen = false;
    this.cdr.detectChanges();
  }

  updateSelectedProductName(): void {
    this.selectedProductName = this.selectedProduct
      ? this.products.find(p => p._id === this.selectedProduct)?.name || 'Select a product'
      : 'Select a product';
  }

  updateSelectedApprovalDocumentName(): void {
    this.selectedApprovalDocumentName = this.selectedApprovalDocument
      ? this.approvalDocuments.find(doc => doc.fileUrl === this.selectedApprovalDocument)?.name || 'Select a document'
      : 'Select a document';
  }

  fetchAttributes(projectId: string): void {
    this.http.get<{ message: string; data: any }>(`https://vps.allpassiveservices.com.au/api/project/attributes/${projectId}`).subscribe({
      next: (response) => {
        const attributes = response.data.attributes || [];
        this.initializeSelectedFields(attributes);
        this.attributeValues = {};
        attributes.forEach((attr: any) => {
          this.attributeValues[attr.name.toLowerCase()] = Array.isArray(attr.value) ? attr.value : [attr.value || 'N/A'];
          this.dropdownStates[attr.name.toLowerCase()] = false;
        });
        this.hierarchyLevels = response.data.subProjects || [];
        this.attributeValues['level'] = this.hierarchyLevels;
        this.dropdownStates['level'] = false;
        ['installer', 'inspector', 'safetyMeasures'].forEach(field => {
          if (!this.attributeValues[field]) {
            this.attributeValues[field] = ['N/A'];
            this.dropdownStates[field] = false;
          }
        });
        this.cdr.detectChanges();
      },
      error: () => {
        this.initializeSelectedFields([]);
        this.attributeValues = {};
        this.hierarchyLevels = [];
        ['level', 'frl', 'barrier', 'installer', 'inspector', 'safetyMeasures'].forEach(field => {
          this.attributeValues[field] = ['N/A'];
          this.dropdownStates[field] = false;
        });
        this.cdr.detectChanges();
      }
    });
  }

  fetchProjectDetails(projectId: string): void {
    this.presentationService.getProjectDetails(projectId).subscribe({
      next: (data: ProjectResponse) => {
        this.project = data;
        this.instances = data.instances || [];
        this.hierarchyLevels = data.subProjects?.map(sp => sp.hierarchyName) || [];
        this.attributeValues['level'] = this.hierarchyLevels;
        this.dropdownStates['level'] = false;
        this.dropdown1.selected = data.status || 'Select an option';
        if (data.subProjects && data.subProjects.length > 0) {
          const queryHierarchyLevelId = this.hierarchyLevelId;
          this.selectedHierarchy = data.subProjects.find(sp => sp.hierarchyLevelId === queryHierarchyLevelId) || data.subProjects[0];
          this.hierarchyLevelId = this.selectedHierarchy.hierarchyLevelId;

          if (this.projectId && this.hierarchyLevelId) {
            this.fetchHierarchyDocuments(this.projectId, this.hierarchyLevelId);
          }

          this.fetchInstances(this.projectId, this.hierarchyLevelId);
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.project = null;
        this.instances = [];
        this.hierarchyLevels = [];
        this.attributeValues['level'] = ['N/A'];
        this.dropdownStates['level'] = false;
        this.cdr.detectChanges();
      }
    });
  }

  fetchHierarchyDocuments(projectId: string, hierarchyLevelId: string): void {
    this.presentationService.getDocumentByHierarchy(projectId, hierarchyLevelId).subscribe({
      next: (response: { message: string; data: Document[] }) => {
        const documentWithImage = response.data.find(doc => doc.documentUrl && doc.documentType === '2D Plan');
        if (documentWithImage && this.selectedHierarchy) {
          this.selectedHierarchy.imageUrl = documentWithImage.documentUrl;
        } else {
          this.selectedHierarchy.imageUrl = 'https://via.placeholder.com/600x400?text=No+Image';
        }
      },
      error: () => {
        if (this.selectedHierarchy) {
          this.selectedHierarchy.imageUrl = 'https://via.placeholder.com/600x400?text=No+Image';
        }
      }
    });
  }

  fetchInstances(projectId: string, hierarchyLevelId: string): void {
    this.http.get<{ instances: InstanceResponse[] }>(`https://vps.allpassiveservices.com.au/api/project/instances/list/${hierarchyLevelId}`).subscribe({
      next: (response) => {
        this.instances = response.instances || [];
        this.cdr.detectChanges();
      },
      error: () => {
        this.instances = [];
        this.cdr.detectChanges();
      }
    });
  }

  initializeSelectedFields(attributes: any[] = []): void {
    this.selectedFields = {};
    this.selectedFieldValues = {};
    this.reportFields.forEach(field => {
      this.selectedFields[field.key] = true;
      const attr = attributes.find(a => a.name.toLowerCase() === field.key.toLowerCase());
      if (attr) {
        this.selectedFieldValues[field.key] = Array.isArray(attr.value) ? attr.value[0] || 'N/A' : attr.value || 'N/A';
      } else {
        this.selectedFieldValues[field.key] = this.getAttributeDisplayValue(field.key);
      }
    });
  }

  isSelectAllIndeterminate(): boolean {
    const checkedCount = this.reportFields.filter(field => this.selectedFields[field.key]).length;
    return checkedCount > 0 && checkedCount < this.reportFields.length;
  }

  selectInstance(instanceId: string): void {
    if (!instanceId) {
      this.selectedInstance = null;
      this.preInstallPhotos = [];
      this.postInstallPhotos = [];
      this.tablePhotos = [];
      this.isLoadingInstance = false;
      this.cdr.detectChanges();
      return;
    }
    this.instanceId = instanceId;
    localStorage.setItem('instanceId', this.instanceId);
    this.isLoadingInstance = true;

    this.presentationService.getInstanceDetails(instanceId).subscribe({
      next: (instance: InstanceResponse) => {
        this.selectedInstance = instance || null;
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
        }

        this.http.get<{ message: string; data: { url: string; category: string; _id: string }[] }>(
          `https://vps.allpassiveservices.com.au/api/project-instance/photos/${instanceId}`
        ).subscribe({
          next: (response) => {
            this.tablePhotos = response.data || [];
            this.isLoadingInstance = false;
            this.cdr.detectChanges();
          },
          error: () => {
            this.tablePhotos = [];
            this.isLoadingInstance = false;
            this.cdr.detectChanges();
          }
        });

        if (this.projectId && this.hierarchyLevelId) {
          this.fetchMarkers(this.projectId, this.hierarchyLevelId, instanceId);
          this.fetchAttributes(this.projectId);
        }
        this.isLoadingInstance = false;
        this.cdr.detectChanges();
        this.fetchReports();
      },
      error: () => {
        this.selectedInstance = null;
        this.preInstallPhotos = [];
        this.postInstallPhotos = [];
        this.tablePhotos = [];
        this.isLoadingInstance = false;
        this.cdr.detectChanges();
      }
    });
  }

  fetchMarkers(projectId: string, hierarchyLevelId: string, instanceId: string): void {
    if (!projectId || !hierarchyLevelId || !instanceId) {
      this.floorPlanImage = this.project?.imageUrl || 'https://via.placeholder.com/600x400?text=No+Image';
      this.markers = [];
      return;
    }
    this.http.get<{ message: string; data: Document[] }>(`https://vps.allpassiveservices.com.au/api/project/getInstanceMarkers/${projectId}/${hierarchyLevelId}/${instanceId}`).subscribe({
      next: (response) => {
        const documents = response.data || [];
        const documentWithMarkers = documents.find(doc => doc.markers && doc.markers.length > 0);
        this.floorPlanImage = documentWithMarkers?.documentUrl || this.project?.imageUrl || 'https://via.placeholder.com/600x400?text=No+Image';
        this.markers = documentWithMarkers?.markers.map(marker => ({
          ...marker,
          position: {
            x: parseFloat(marker.position?.x?.toString()) || 0,
            y: parseFloat(marker.position?.y?.toString()) || 0
          },
          style: {
            textSize: parseInt(marker.style?.textSize?.toString(), 10) || 14
          }
        })) || [];
      },
      error: () => {
        this.markers = [];
        this.floorPlanImage = this.project?.imageUrl || 'https://via.placeholder.com/600x400?text=No+Image';
      }
    });
  }

  updateProjectStatus(status: string): void {
    if (this.projectId) {
      this.presentationService.updateProjectStatus(this.projectId, status).subscribe({
        next: () => {
          this.dropdown1.selected = status;
          if (this.project) {
            this.project.status = status;
          }
        },
        error: () => {}
      });
    }
  }

  openCarparkModal(hierarchy: any, instanceId?: string): void {
    this.selectedHierarchy = hierarchy;
    this.hierarchyLevelId = hierarchy.hierarchyLevelId || '';
    this.floorPlanImage = 'https://via.placeholder.com/600x400?text=Loading+Image';
    this.markers = [];
    this.preInstallPhotos = [];
    this.postInstallPhotos = [];
    this.tablePhotos = [];
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
    this.tablePhotos = [];
    this.markers = [];
    this.floorPlanImage = '';
    this.hierarchyLevelId = '';
    document.body.style.overflow = 'auto';
  }

  openReportModal(): void {
    this.isReportModalOpen = true;
    localStorage.setItem('isReportModalOpen', 'true');
    document.body.style.overflow = 'hidden';
    if (this.instanceId && !this.selectedInstance) {
      this.selectInstance(this.instanceId);
    }
    if (this.projectId) {
      this.fetchAttributes(this.projectId);
    }
    this.fetchReports();
  }

  closeReportModal(): void {
    this.isReportModalOpen = false;
    localStorage.setItem('isReportModalOpen', 'false');
    document.body.style.overflow = 'auto';
    this.closeAllFieldDropdowns();
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
    this.isProductDropdownOpen = false;
    this.isApprovalDropdownOpen = false;
    this.closeAllFieldDropdowns();
  }

  selectOption1(option: string, event: Event): void {
    event.stopPropagation();
    this.selectedOption = option;
    this.isDropdownOpen = false;
    this.cdr.detectChanges();
  }

  toggleSelectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.reportFields.forEach(field => {
      this.selectedFields[field.key] = checked;
    });
    this.isProductSelected = checked;
    this.selectApproval = checked;
    this.updateSelectAll();
  }

  toggleSelectProduct(event: Event): void {
    this.isProductSelected = (event.target as HTMLInputElement).checked;
    this.updateSelectAll();
  }

  toggleSelectApproval(event: Event): void {
    this.selectApproval = (event.target as HTMLInputElement).checked;
    this.updateSelectAll();
  }

  updateSelectAll(): void {
    const selectAllCheckbox = document.getElementById('selectAll') as HTMLInputElement | null;
    if (selectAllCheckbox) {
      const allChecked = this.reportFields.every(field => this.selectedFields[field.key]) && this.isProductSelected && this.selectApproval;
      const someChecked = this.reportFields.some(field => this.selectedFields[field.key]) || this.isProductSelected || this.selectApproval;
      selectAllCheckbox.checked = allChecked;
      selectAllCheckbox.indeterminate = someChecked && !allChecked;
    }
  }

  toggleFieldDropdown(fieldKey: string): void {
    this.dropdownStates[fieldKey] = !this.dropdownStates[fieldKey];
    Object.keys(this.dropdownStates).forEach(key => {
      if (key !== fieldKey) {
        this.dropdownStates[key] = false;
      }
    });
    this.isDropdownOpen = false;
    this.isProductDropdownOpen = false;
    this.isApprovalDropdownOpen = false;
    this.cdr.detectChanges();
  }

  closeAllFieldDropdowns(): void {
    Object.keys(this.dropdownStates).forEach(key => {
      this.dropdownStates[key] = false;
    });
    this.cdr.detectChanges();
  }

  selectFieldValue(fieldKey: string, value: string, event: Event): void {
    event.stopPropagation();
    this.selectedFieldValues[fieldKey] = value;
    this.dropdownStates[fieldKey] = false;
    this.cdr.detectChanges();
  }

  async generateReport(): Promise<void> {
    const margin = 10;
    const lineHeight = 10;
    const imageWidth = 52.92;
    const imageHeight = 52.92;
    const photoImageHeight = 30;
    const baseRowHeight = 30;
    const pageWidth = 297;
    const pageHeight = 420;
    const contentWidth = pageWidth - 2 * margin;
    const bottomMargin = 40;
    const logoWidth = 40;
    const logoHeight = 20;
    const headerHeight = 10;
    const headers = ['Ref No', 'Location', 'Plan', 'Type', 'Substrate', 'FRL', 'Result', 'Photos', 'Comments'];
    const columnWidths = [20, 30, 40, 30, 30, 20, 20, 45, 42];
    const maxHierarchyImageHeight = 141.7;
    const inspectionTopMargin = 20;

    const doc = new jsPDF({ format: 'a3' });
    let yOffset = margin;
    const maxContentHeight = pageHeight - margin - bottomMargin;

    const normalizeUrl = (url: string): string => {
      if (!url || url === 'N/A' || url.trim() === '') {
        console.warn('Invalid URL, using placeholder:', url);
        return 'https://via.placeholder.com/200x200?text=No+Image';
      }
      if (url.startsWith('https://aps-app-frontend.vercel.app/')) {
        return url;
      }
      if (url.startsWith('https://vps.allpassiveservices.com.au/')) {
        return `https://aps-app-frontend.vercel.app/api/proxy?url=${encodeURIComponent(url)}`;
      }
      const cleanPath = url.replace(/^\/*uploads\/*/i, '').replace(/^\/+/, '');
      return `https://aps-app-frontend.vercel.app/api/proxy?url=${encodeURIComponent(`https://vps.allpassiveservices.com.au/uploads/${cleanPath}`)}`;
    };

    const loadImage = async (url: string): Promise<string> => {
      const normalizedUrl = normalizeUrl(url);
      console.log(`Attempting to load image: ${normalizedUrl}`);
      if (normalizedUrl.includes('via.placeholder.com')) {
        return normalizedUrl;
      }
      try {
        const response = await fetch(normalizedUrl, {
          method: 'GET',
          headers: { 'Accept': 'image/*' },
          mode: 'cors',
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const blob = await response.blob();
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => {
            console.error(`Failed to read blob for image: ${normalizedUrl}`);
            resolve('https://via.placeholder.com/200x200?text=Read+Error');
          };
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.error(`Failed to load image: ${normalizedUrl}`, error);
        return 'https://via.placeholder.com/200x200?text=Image+Error';
      }
    };

    const loadLocalImage = async (url: string): Promise<string> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = url;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => {
          console.error(`Failed to load local image: ${url}`);
          resolve('https://via.placeholder.com/200x200?text=Local+Image+Error');
        };
      });
    };

    const checkPageBreak = (requiredHeight: number) => {
      if (yOffset + requiredHeight > maxContentHeight) {
        doc.addPage();
        yOffset = margin;
        return true;
      }
      return false;
    };

    console.log('Table Photos:', this.tablePhotos.map(p => p.url));
    console.log('Floor Plan Image:', this.floorPlanImage);
    console.log('Selected Approval Document:', this.selectedApprovalDocument);
    console.log('Markers:', this.markers);
    console.log('Pre-install Photos:', this.preInstallPhotos.map(p => p.url));
    console.log('Post-install Photos:', this.postInstallPhotos.map(p => p.url));

    let projectDetails: ProjectResponse;
    try {
      const details = await this.presentationService.getProjectDetails(this.projectId).toPromise();
      if (!details) {
        throw new Error();
      }
      projectDetails = details;
      console.log('Project Image URL:', projectDetails.imageUrl);
    } catch {
      projectDetails = {
        projectId: this.projectId,
        projectName: 'Unknown Project',
        buildingName: 'N/A',
        address: 'N/A',
        client: { clientId: '', clientName: 'Unknown Client', clientPhone: '' },
        clientName: 'Unknown Client',
        createdAt: '',
        buildingType: '',
        assignedEmployees: [],
        reports: [],
        subProjects: [],
        status: '',
        imageUrl: null,
        instances: [],
        documents: [],
        hierarchyLevels: []
      };
    }

    const hierarchyImages: { hierarchyName: string; imageUrl: string }[] = [];
    if (projectDetails.subProjects && projectDetails.subProjects.length > 0) {
      for (const subProject of projectDetails.subProjects) {
        try {
          const response = await this.presentationService.getDocumentByHierarchy(this.projectId, subProject.hierarchyLevelId).toPromise();
          const documentWithImage = response?.data.find(doc => doc.documentUrl && doc.documentType === '2D Plan');
          const imageUrl = documentWithImage ? normalizeUrl(documentWithImage.documentUrl) : 'https://via.placeholder.com/200x200?text=No+Hierarchy+Image';
          if (!imageUrl.includes('via.placeholder.com')) {
            hierarchyImages.push({
              hierarchyName: subProject.hierarchyName,
              imageUrl: imageUrl
            });
          }
        } catch {
          // Skip if no valid image
        }
      }
    }

    try {
      const logoUrl = 'images/logo.png';
      const logoData = await loadLocalImage(logoUrl);
      const logoX = pageWidth - margin - logoWidth;
      checkPageBreak(logoHeight + lineHeight);
      doc.addImage(logoData, 'PNG', logoX, yOffset, logoWidth, logoHeight);
      yOffset += logoHeight + lineHeight;
    } catch {
      checkPageBreak(lineHeight * 2);
      doc.setFontSize(10);
      doc.setTextColor(255, 0, 0);
      doc.text('Failed to load logo image', pageWidth - margin - 40, yOffset + 10);
      doc.setTextColor(0, 0, 0);
      yOffset += logoHeight + lineHeight;
    }

    checkPageBreak(lineHeight * 2);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(`Project Name: ${projectDetails.projectName || 'Unknown Project'}`, margin, yOffset);
    yOffset += lineHeight;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`Client Name: ${projectDetails.client?.clientName || projectDetails.clientName || 'Unknown Client'}`, margin, yOffset);
    yOffset += lineHeight + 10;

    checkPageBreak(lineHeight);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Site Photos', margin, yOffset);
    yOffset += lineHeight;

    const projectImageUrl = normalizeUrl(projectDetails.imageUrl || 'https://via.placeholder.com/600x400?text=No+Image');
    try {
      const imgData = await loadImage(projectImageUrl);
      checkPageBreak(imageHeight + lineHeight);
      doc.addImage(imgData, 'PNG', margin, yOffset, imageWidth, imageHeight);

      const textX = pageWidth * 0.4;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Address: ${projectDetails.address || 'N/A'}`, textX, yOffset + 10);
      doc.text(`Building Name: ${projectDetails.buildingName || 'N/A'}`, textX, yOffset + 20);
      doc.text(`Hierarchy Name: ${projectDetails.subProjects?.[0]?.hierarchyName || 'N/A'}`, textX, yOffset + 30);
      yOffset += Math.max(imageHeight, 40) + lineHeight;
    } catch {
      checkPageBreak(lineHeight * 2);
      doc.setFontSize(10);
      doc.setTextColor(255, 0, 0);
      doc.text(`Failed to load image: ${projectImageUrl}`, margin, yOffset);
      doc.setTextColor(0, 0, 0);

      const textX = pageWidth * 0.4;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Address: ${projectDetails.address || 'N/A'}`, textX, yOffset + 10);
      doc.text(`Building Name: ${projectDetails.buildingName || 'N/A'}`, textX, yOffset + 20);
      doc.text(`Hierarchy Name: ${projectDetails.subProjects?.[0]?.hierarchyName || 'N/A'}`, textX, yOffset + 30);
      yOffset += lineHeight * 4;
    }

    checkPageBreak(inspectionTopMargin + lineHeight * 6);
    yOffset += inspectionTopMargin;
    const inspectionStartY = yOffset;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Inspection Report Overview', margin, yOffset);
    yOffset += lineHeight;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const report = projectDetails.reports && projectDetails.reports.length > 0 ? projectDetails.reports[0] : null;
    const inspectionStats = report?.coverLetter?.inspectionOverview || { totalItems: '0', passedItems: '0', failedItems: '0', tbcItems: '0' };

    doc.setTextColor(0, 0, 0);
    doc.text(`Total number of items: ${inspectionStats.totalItems}`, margin, yOffset);
    yOffset += lineHeight;

    const passText = `Number of PASS: `;
    const passValue = `${inspectionStats.passedItems}`;
    doc.setTextColor(0, 0, 0);
    doc.text(passText, margin, yOffset);
    doc.setTextColor(92, 201, 110);
    doc.text('PASS', margin + doc.getTextWidth(passText), yOffset);
    doc.setTextColor(0, 0, 0);
    doc.text(`: ${passValue}`, margin + doc.getTextWidth(passText + 'PASS'), yOffset);
    yOffset += lineHeight;

    const failText = `Number of FAIL: `;
    const failValue = `${inspectionStats.failedItems}`;
    doc.setTextColor(0, 0, 0);
    doc.text(failText, margin, yOffset);
    doc.setTextColor(228, 66, 52);
    doc.text('FAIL', margin + doc.getTextWidth(failText), yOffset);
    doc.setTextColor(0, 0, 0);
    doc.text(`: ${failValue}`, margin + doc.getTextWidth(failText + 'FAIL'), yOffset);
    yOffset += lineHeight;

    const tbcText = `Number of TBC: `;
    const tbcValue = `${inspectionStats.tbcItems}`;
    doc.setTextColor(0, 0, 0);
    doc.text(tbcText, margin, yOffset);
    doc.setTextColor(128, 128, 128);
    doc.text('TBC', margin + doc.getTextWidth(tbcText), yOffset);
    doc.setTextColor(0, 0, 0);
    doc.text(`: ${tbcValue}`, margin + doc.getTextWidth(tbcText + 'TBC'), yOffset);
    const inspectionHeight = lineHeight * 4;

    const infoBoxX = pageWidth * 0.4;
    const infoBoxWidth = contentWidth * 0.6 - margin;
    const infoBoxHeight = 40;
    doc.setFillColor(255, 255, 255);
    doc.rect(infoBoxX, inspectionStartY, infoBoxWidth, infoBoxHeight, 'S');
    const additionalInfo = report?.coverLetter?.additionalInfo || 'N/A';
    const infoLines = doc.splitTextToSize(`Additional Info: ${additionalInfo}`, infoBoxWidth - 4);
    doc.setTextColor(0, 0, 0);
    doc.text(infoLines, infoBoxX + 2, inspectionStartY + 5);
    yOffset = inspectionStartY + Math.max(inspectionHeight, infoBoxHeight);

    if (hierarchyImages.length > 0) {
      checkPageBreak(lineHeight);
      yOffset += lineHeight;

      const availableHeight = maxContentHeight - yOffset - lineHeight;
      const dynamicImageHeight = Math.min(maxHierarchyImageHeight, availableHeight / hierarchyImages.length - lineHeight);

      for (const { hierarchyName, imageUrl } of hierarchyImages.slice(0, 3)) {
        checkPageBreak(lineHeight + dynamicImageHeight);
        try {
          const imgData = await loadImage(imageUrl);
          checkPageBreak(dynamicImageHeight + lineHeight);
          doc.addImage(imgData, 'PNG', margin, yOffset, contentWidth, dynamicImageHeight);
          yOffset += dynamicImageHeight + lineHeight;
        } catch {
          checkPageBreak(lineHeight);
          doc.setFontSize(10);
          doc.setTextColor(255, 0, 0);
          doc.text(`Failed to load image: ${imageUrl}`, margin, yOffset);
          doc.setTextColor(0, 0, 0);
          yOffset += lineHeight;
        }
      }
    }

    const tableData: TableRow[] = [];
    let index = 1;
    if (this.instances?.length > 0) {
      for (const instance of this.instances) {
        const allPhotos = [
          ...this.tablePhotos.map(p => normalizeUrl(p.url)),
          ...this.preInstallPhotos.map(p => normalizeUrl(p.url)),
          ...this.postInstallPhotos.map(p => normalizeUrl(p.url))
        ].filter(url => url && url !== 'N/A' && url.trim() !== '');
        
        const row: TableRow = {
          'Ref No': (instance.instanceNumber || index).toString(),
          Location: instance.hierarchyName || projectDetails.subProjects?.[0]?.hierarchyName || 'N/A',
          Plan: this.floorPlanImage || 'N/A',
          Type: instance.subProjectCategory || projectDetails.subProjects?.map(sp => sp.hierarchyName).join(', ') || 'N/A',
          Substrate: instance.attributes?.find(attr => attr.name === 'Materils')?.selectedValue || this.getAttributeDisplayValue('Materils'),
          FRL: this.selectedFieldValues['frl'] || 'N/A',
          Result: this.selectedFieldValues['compliance'] || 'N/A',
          Photos: allPhotos,
          Comments: instance.attributes?.find(attr => attr.name === 'Comments')?.selectedValue || this.getAttributeDisplayValue('Comments')
        };
        tableData.push(row);
        index++;
      }
    } else {
      const allPhotos = [
        ...this.tablePhotos.map(p => normalizeUrl(p.url)),
        ...this.preInstallPhotos.map(p => normalizeUrl(p.url)),
        ...this.postInstallPhotos.map(p => normalizeUrl(p.url))
      ].filter(url => url && url !== 'N/A' && url.trim() !== '');
      
      tableData.push({
        'Ref No': '1',
        Location: projectDetails.subProjects?.[0]?.hierarchyName || 'N/A',
        Plan: this.floorPlanImage || 'N/A',
        Type: projectDetails.subProjects?.map(sp => sp.hierarchyName).join(', ') || 'N/A',
        Substrate: this.getAttributeDisplayValue('Materils'),
        FRL: this.selectedFieldValues['frl'] || 'N/A',
        Result: this.selectedFieldValues['compliance'] || 'N/A',
        Photos: allPhotos,
        Comments: this.getAttributeDisplayValue('Comments')
      });
    }

    checkPageBreak(lineHeight * 3 + headerHeight + (tableData.length * baseRowHeight));
    yOffset += lineHeight * 3;
    const tableX = margin;
    const tableStartY = yOffset;

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
      doc.setDrawColor(255, 255, 181);
      doc.rect(xOffset, yOffset, columnWidths[index], headerHeight);
      xOffset += columnWidths[index];
    });
    doc.setTextColor(0, 0, 0);
    yOffset += headerHeight;

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
        if (header === 'Plan') {
          const planUrl = normalizeUrl(row['Plan']);
          try {
            const imgData = await loadImage(planUrl);
            const imgWidth = columnWidths[colIndex] - 4;
            const imgHeight = Math.min(photoImageHeight - 4, rowHeight - 4);
            doc.addImage(imgData, 'PNG', xOffset + 2, yOffset + 2, imgWidth, imgHeight);

            // Render markers on the floor plan image
            const instance = this.instances?.find(inst => inst.instanceNumber?.toString() === row['Ref No']);
            const instanceMarkers = this.markers.filter(m => m.instanceId === instance?.instanceId);
            for (const marker of instanceMarkers) {
              const scaleX = imgWidth / 600; // Assuming original image width is 600px
              const scaleY = imgHeight / 400; // Assuming original image height is 400px
              const markerX = xOffset + 2 + marker.position.x * scaleX;
              const markerY = yOffset + 2 + marker.position.y * scaleY;
              doc.setFillColor(255, 0, 0);
              doc.circle(markerX, markerY, 2, 'F');
              doc.setFontSize(marker.style.textSize || 8);
              doc.setTextColor(0, 0, 0);
              doc.text(marker.label || 'M', markerX + 3, markerY + 3);
            }
          } catch {
            doc.setTextColor(255, 0, 0);
            doc.text('Failed to load plan image', xOffset + 2, yOffset + 8);
            doc.setTextColor(0, 0, 0);
          }
        } else if (header === 'Photos' && row['Photos'].length > 0) {
          try {
            const photoPromises = row['Photos'].slice(0, 2).map(url => loadImage(url)); // Show up to 2 photos
            const photoData = await Promise.all(photoPromises);
            const imgWidth = (columnWidths[colIndex] - 6) / Math.min(photoData.length, 2);
            const imgHeight = Math.min(photoImageHeight - 4, rowHeight - 4);
            let photoX = xOffset + 2;
            photoData.forEach((imgData, idx) => {
              if (idx < 2) {
                doc.addImage(imgData, 'PNG', photoX, yOffset + 2, imgWidth, imgHeight);
                photoX += imgWidth + 2;
              }
            });
          } catch {
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
          const cellValue = row[header as keyof TableRow];
          const cellText = typeof cellValue === 'string' ? cellValue : Array.isArray(cellValue) ? (cellValue.length > 0 ? 'Photo Available' : 'N/A') : 'N/A';
          const cellLines = doc.splitTextToSize(cellText, columnWidths[colIndex] - 4);
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

    doc.setLineWidth(0.5);
    doc.setDrawColor(0, 0, 0);
    doc.rect(tableX, tableStartY, contentWidth, tableEndY - tableStartY);

    if (this.selectApproval && this.selectedApprovalDocument) {
      checkPageBreak(lineHeight * 2);
      yOffset += lineHeight;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Selected Approval Document:', margin, yOffset);
      yOffset += lineHeight;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const docName = this.approvalDocuments.find(doc => doc.fileUrl === this.selectedApprovalDocument)?.name || 'N/A';
      doc.text(`Document: ${docName}`, margin, yOffset);
      yOffset += lineHeight;
    }

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

    doc.save(`Report_${this.projectId}_${this.instanceId}_${new Date().toISOString().slice(0, 10)}.pdf`);

    if (this.selectedOption === 'Excel Reports') {
      const reportData: { [key: string]: string } = {};
      this.reportFields.forEach(field => {
        reportData[field.key] = this.selectedFieldValues[field.key] || 'N/A';
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

      data.push({ Field: 'Address', Value: projectDetails.address || 'N/A' });
      data.push({ Field: 'Building Name', Value: projectDetails.buildingName || 'N/A' });
      data.push({ Field: 'Hierarchy Name', Value: projectDetails.subProjects?.[0]?.hierarchyName || 'N/A' });
      if (this.isProductSelected && this.selectedProduct) {
        const productName = this.products.find(p => p._id === this.selectedProduct)?.name || 'N/A';
        data.push({ Field: 'Product Name', Value: productName });
      }
      if (this.selectApproval && this.selectedApprovalDocument) {
        const docName = this.approvalDocuments.find(doc => doc.fileUrl === this.selectedApprovalDocument)?.name || 'N/A';
        data.push({ Field: 'Approval', Value: docName });
      }

      hierarchyImages.forEach((img, index) => {
        data.push({ Field: `Hierarchy Image ${index + 1} (${img.hierarchyName})`, Value: img.imageUrl });
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
    const value = this.selectedFieldValues[key] || 'N/A';
    return Array.isArray(value) ? (value[0] || 'N/A') : (value || 'N/A');
  }

  getAttributeDisplayValues(key: string): string[] {
    return this.attributeValues[key.toLowerCase()] || ['N/A'];
  }

  fetchReports(): void {
    if (this.projectId) {
      this.isLoadingReports = true;
      this.http.get<{ message: string; data: any[] }>(`https://vps.allpassiveservices.com.au/api/project/reports/${this.projectId}`).subscribe({
        next: (response) => {
          this.reports = response.data || [];
          this.isLoadingReports = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.reports = [];
          this.isLoadingReports = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      this.reports = [];
      this.isLoadingReports = false;
      this.cdr.detectChanges();
    }
  }

  toggleReportDropdown(): void {
    this.isReportDropdownOpen = !this.isReportDropdownOpen;
    this.isProductDropdownOpen = false;
    this.isApprovalDropdownOpen = false;
    this.closeAllFieldDropdowns();
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
}