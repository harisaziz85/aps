import { Component, Input, HostListener, ElementRef, ViewChild, AfterViewInit, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router, NavigationStart, RouterLink, ActivatedRoute } from '@angular/router';
import { CreateprojectService } from '../../core/services/createproject.service';
import { ClientService } from '../../core/services/client.service';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TopbarComponent } from '../components/topbar/topbar.component';
import { FootComponent } from '../components/foot/foot.component';
import { PresentationService } from '../../core/services/presentation.service';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Pipe, PipeTransform } from '@angular/core';
import jsPDF from 'jspdf';
import { AttributeTemplateResponse, ProjectResponse } from '../../core/models/presentation';
import html2canvas from 'html2canvas';
import { SvgIconsComponent } from '../../shared/svg-icons/svg-icons.component';
import { ToastrService } from 'ngx-toastr';

type Attribute = {
  name: string;
  type: string;
  barrierInput: string;
  barrierValues: string[];
  editableInBackOffice: boolean;
  hideForMobile: boolean;
  isConditional: boolean;
  productId: string;
  approvalDocumentId: string;
  filteredApprovalDocuments?: { id: string, name: string }[];
  selectedApprovalDocuments?: string[];
};

type StandardAttribute = {
  name: string;
  type: string;
  value: string | string[];
  editableBackOffice: boolean;
  hideForMobileUser: boolean;
  conditionalAttribute: {
    isEnabled: boolean;
    productId: string;
    approvalDocumentId: string;
  };
};

interface Report {
  _id: string;
  projectId: string;
  reportPDF: string;
  coverLetter: {
    projectName: string;
    clientName: string;
    fileUrl: string;
    address: string;
    date: string;
    buildingName: string;
    reportTitle: string;
    additionalInfo: string;
    inspectionOverview: {
      totalItems: string;
      passedItems: string;
      failedItems: string;
      tbcItems: string;
    };
  };
  createdAt: string;
  updatedAt: string;
  __v: number;
};

interface Document {
  _id: string;
  documentName: string;
  documentUrl: string;
  version: number;
  documentType: '2D Plan' | 'Technical' | 'Additional';
  projectReserve: string;
  hierarchyLevel: string;
  markers: any[];
}

@Component({
  selector: 'app-createproject',
  templateUrl: './createproject.component.html',
  styleUrls: ['./createproject.component.css'],
  imports: [
    CommonModule,
    FormsModule,
    FontAwesomeModule,
    RouterLink,
    TopbarComponent,
    FootComponent,
    SvgIconsComponent,
  ],
  standalone: true
})
export class CreateprojectComponent implements AfterViewInit, OnInit {
  additionalFiles: Document[] = [];
  technicalFiles: Document[] = [];
  twoDFiles: Document[] = [];
  isSubProjectDropdownOpen = false;
  selectedSubProject: string | null = null;

  getFileExtension(fileName: string): string {
    return fileName?.split('.').pop()?.toLowerCase() || '';
  }

  svgIcon1: SafeHtml;

  projectName: string = '';
  buildingName: string = '';
  imageFile: File | null = null;
  imagePreview: string | null = null;
  subProjects: string[] = [];
  addressLine1: string = '';
  addressLine2: string = '';
  city: string = '';
  state: string = '';
  zip: string = '';
  projectStatus: string = '';
  hierarchyLevelsChange: boolean = false;
  subcontractorName: string = '';
  subcontractorContactPerson: string = '';
  subcontractorPhone: string = '';
  clientId: string = '';
  clientName: string = '';
  clientContactPerson: string = '';
  clientPhone: string = '';
  clients: { id: string, name: string, phone: string }[] = []; // Modified to include phone

  employees: { id: string, name: string, userType: string }[] = [];
  filteredEmployees: { id: string, name: string, userType: string }[] = [];
  searchQuery: string = '';
  products: { id: string, name: string }[] = [];
  approvalDocuments: { id: string, name: string }[] = [];
  filteredApprovalDocuments: { id: string, name: string }[] = [];
  selectedApprovalDocuments: string[] = [];

  hierarchyLevelsInput: { name: string }[] = [{ name: '' }];
  projectId: string = '';
  hierarchyLevels: { id: string, name: string }[] = [];
  selectedHierarchyLevel: string = '';

  bulkFiles: File[] = [];
  documentNames: string[] = [];
  singleFile2D: File | null = null;
  singleFileTechnical: File | null = null;
  singleFileAdditional: File | null = null;

  reports: Report[] = [];

  @ViewChild('bulkFileInput') bulkFileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('tab1', { static: true }) defaultTab!: ElementRef;

  isReportModalOpen = false;
  selectedReportType: string = 'Standard Reports';
  reportFields: { [key: string]: string[] } = {
    'Standard Reports': [],
    '2D': [],
    'Excel': []
  };
  selectedFields: { [key: string]: boolean } = {};
  isLoadingAttributes: boolean = false;

  predefinedTemplates: { [key: string]: Attribute[] } = {
    'Scoping': [
      { name: 'Barrier', type: 'list', barrierInput: '', barrierValues: ['Bulkhead', 'Ceiling', 'Floor', 'Wall', 'Riser'], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Services', type: 'list', barrierInput: '', barrierValues: ['2 Pex Pipes','1 PVC Pipes','3 Copper Pipes'], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Materials', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'FRL', type: 'list', barrierInput: '', barrierValues: ['-/120-','-/120/120','-180/180','-/60/60','-/240/240','-/60/60','-90/90','Smoke'], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Location', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Comments', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Date', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Inspector', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Notes', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Time', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Price', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Additional Requirnments', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
    ],
     'Annual Inspection': [
      { name: 'Services', type: 'list', barrierInput: '', barrierValues: ['2 Pex Pipes', '1 PVC Pipes', '3 Copper Pipes'], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },{ name: 'Materials', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Barrier', type: 'list', barrierInput: '', barrierValues: ['Bulkhead','Ceiling','Floor','Wall','Riser'], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'FRL', type: 'list', barrierInput: '', barrierValues: ['-/120-','-/120/120','-180/180','-/60/60','-/240/240','-/60/60','-90/90','Smoke'], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Location', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Comments', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Safety Measures', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Relevance to Building Code', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Compliance', type: 'string', barrierInput: '', barrierValues: ['Pass','Fail'], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Date Inspected', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Inspector', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Date', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Time', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Price', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
    ],
    'Fire Dampers': [
      { name: 'FD No.', type: 'list', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] }, { name: 'Location', type: 'list', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Year Inspected', type: 'list', barrierInput: '', barrierValues: ['2025','2026','2027','2028','2029'], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Inspection Date', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Damper Accessible', type: 'string', barrierInput: '', barrierValues: ['Yes','No'], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Damper Closes and fusable link ok', type: 'list', barrierInput: '', barrierValues: ['Yes','No'], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Damper Installed Correctly', type: 'string', barrierInput: '', barrierValues: ['Yes','No'], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Flanges or Retaining Angles Correct', type: 'list', barrierInput: '', barrierValues: ['Yes','No'], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Barrier', type: 'list', barrierInput: '', barrierValues: ['Bulkhead','Ceiling','Floor','Wall','Riser'], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'FRL', type: 'list', barrierInput: '', barrierValues: ['-/120-','-/120/120','-180/180','-/60/60','-/240/240','-/60/60','-90/90','Smoke'], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Substrate Type', type: 'list', barrierInput: '', barrierValues: ['Concrete Wall','Masonry Wall','Dincel','Hebel Wall','Fire Rated Plasterboard Wall','Speedpanel Wall','Hebel Powerpanel Wall'], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Penetration Compliant', type: 'list', barrierInput: '', barrierValues: ['Yes','No'], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Breakaway Connection', type: 'list', barrierInput: '', barrierValues: ['Yes','No'], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Damper free from Corrosion', type: 'list', barrierInput: '', barrierValues: ['Yes','No'], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Is this damper installed correctly', type: 'list', barrierInput: '', barrierValues: ['Yes','No'], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Comments', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Date of Repairs', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },

    ],
    'Installation/Penetration Register': [
      { name: 'Test ID', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },{ name: 'Sticker Number', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Services', type: 'list', barrierInput: '', barrierValues: ['2 Pex Pipes','1 PVC Pipes','3 Copper Pipes'], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Materials', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Barrier', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'FRL', type: 'list', barrierInput: '', barrierValues: ['-/120-','-/120/120','-180/180','-/60/60','-/240/240','-/60/60','-90/90','Smoke'], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Reference to Building Code', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Location', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Compliance', type: 'list', barrierInput: '', barrierValues: ['Pass','Fail'], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Comments', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Date', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
    ],
    'Third Party Certification': [
      { name: 'Test ID', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Sticker Number', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Services', type: 'list', barrierInput: '', barrierValues: ['2 Pex Pipes','1 PVC Pipes','3 Copper Pipes'], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Materials', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Barrier', type: 'list', barrierInput: '', barrierValues: ['Bulkhead','Ceiling','Floor','Wall','Riser'], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'FRL', type: 'list', barrierInput: '', barrierValues: ['-/120-','-/120/120','-180/180','-/60/60','-/240/240','-/60/60','-90/90','Smoke'], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Location', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Comments', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Trade', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Compliance', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Date Inspected', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Inspector', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Notes', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Time', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Price', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
    ]
  };

  isDropdownOpenMainType: boolean = false;
  isDropdownOpenMainProduct: boolean = false;
  isDropdownOpenMainApproval: boolean = false;
  isDropdownOpenAttrType: boolean[] = [];
  isDropdownOpenAttrProduct: boolean[] = [];
  isDropdownOpenAttrApproval: boolean[] = [];

  toggleSubProjectDropdown(event: Event): void {
    event.stopPropagation();
    this.isSubProjectDropdownOpen = !this.isSubProjectDropdownOpen;
  }

  selectSubProject(subProject: string, event: Event): void {
    event.stopPropagation();
    this.selectedSubProject = subProject;
    this.isSubProjectDropdownOpen = false;
  }

  removeSubProject(): void {
    this.selectedSubProject = null;
  }

  constructor(
    private sanitizer: DomSanitizer,
    private router: Router,
    private createprojectService: CreateprojectService,
    private clientService: ClientService,
    private http: HttpClient,
    private route: ActivatedRoute,
    private presentationService: PresentationService,
    private toastr: ToastrService
  ) {
    this.svgIcon1 = this.sanitizer.bypassSecurityTrustHtml('[SVG Icon]');

    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.closeReportModal();
        this.closeModal();
      }
    });
  }

  getHierarchyLevelName(hierarchyLevelId: string): string {
    const level = this.hierarchyLevels.find(level => level.id === hierarchyLevelId);
    return level ? level.name : 'Unknown Level';
  }

  getApprovalDocumentName(docId: string): string {
    const doc = this.approvalDocuments.find(doc => doc.id === docId);
    return doc ? doc.name : 'Unknown Document';
  }

  getProductName(productId: string): string {
    const product = this.products.find(p => p.id === productId);
    return product ? product.name : 'Select a product';
  }

  isDropdownOpen = false;
  selectedOption: string = 'Active';
  options: string[] = ['Active', 'Completed'];

  isDropdownOpen1: boolean = false;
  isDropdownOpen2: boolean = false;
  isDropdownOpen3: boolean = false;
  isDropdownOpen4: boolean = false;
  isDropdownOpen5: boolean = false;
  isDropdownOpen6: boolean = false;
  isDropdownOpen7: boolean = false;
  isDropdownOpenli: boolean = false;
  isDropdownOpen30: boolean = false;
  isDropdownOpen31: boolean = false;

  selectedOption4: string = 'Standard Reports';
  selectedOption6: string = '';
  selectedOption7: string = '';
  selectedOptionli = { label: 'Installation/Penetration Register', value: 'option4' };
  options6 = ['Yes', 'No'];
  options7: string[] = [];
  optionsli = [
    { label: 'Scoping', value: 'option1' },
    { label: 'Annual Inspection', value: 'option2' },
    { label: 'Fire Dampers', value: 'option3' },
    { label: 'Installation/Penetration Register', value: 'option4' },
    { label: 'Third Party Certification', value: 'option5' }
  ];
  options5: string[] = [];
  selectedDocuments5: string[] = [];

  dropdown8 = {
    selected: '',
    isOpen: false,
    options: ['Penetration Joints', 'Fire Dampers', 'Fire Doors', 'Fire Windows', 'Service Penetration']
  };
  addedTags: string[] = [];

  activeTab: string = 'clientInfo';
  activeTabLeft: number = 0;
  activeTabWidth: number = 0;
  isOpen = false;

  isDefaultTemplate: boolean = false;
  barrierValues: string[] = [];
  barrierInput: string = '';
  templateName: string = 'Installation/Penetration Register';
  attributeName: string = '';
  attributeType: string = 'string';
  mainAttribute: Attribute = {
    name: '',
    type: 'string',
    barrierInput: '',
    barrierValues: [],
    editableInBackOffice: false,
    hideForMobile: false,
    isConditional: false,
    productId: '',
    approvalDocumentId: '',
    filteredApprovalDocuments: [],
    selectedApprovalDocuments: []
  };
  additionalAttributes: Attribute[] = [];
  productId: string = '';
  approvalDocumentId: string = '';

  standardAttributes: any = null;
  existingAttributes: Attribute[] = [];

  ngOnInit(): void {
    this.selectedOption6 = 'Yes';
    this.hierarchyLevelsChange = true;
    this.filteredEmployees = [...this.employees];
    this.twoDFiles = [];
    this.technicalFiles = [];
    this.additionalFiles = [];

    const savedFormData = localStorage.getItem('projectFormData');
    if (savedFormData) {
      const formData = JSON.parse(savedFormData);
      this.projectName = formData.projectName || '';
      this.buildingName = formData.buildingName || '';
      this.addressLine1 = formData.address?.line1 || '';
      this.addressLine2 = formData.address?.line2 || '';
      this.city = formData.address?.city || '';
      this.state = formData.address?.state || '';
      this.zip = formData.address?.zip || '';
      this.projectStatus = formData.projectStatus || 'Active';
      this.hierarchyLevelsChange = formData.hierarchyLevelsChange === 'true';
      this.subcontractorName = formData.subcontractorName || '';
      this.subcontractorContactPerson = formData.subcontractorContactPerson || '';
      this.subcontractorPhone = formData.subcontractorPhone || '';
      this.clientId = formData.clientId || '';
      this.clientName = formData.clientName || '';
      this.clientContactPerson = formData.contactPerson || '';
      this.clientPhone = formData.clientPhone || '';
      this.subProjects = formData.subProjects ? JSON.parse(formData.subProjects) : [];
      this.addedTags = this.subProjects;
      this.selectedApprovalDocuments = formData.selectedApprovalDocuments ? JSON.parse(formData.selectedApprovalDocuments) : [];
      console.log('Restored form data from localStorage:', formData);
    }

    this.clientService.getClients().subscribe({
      next: (response) => {
        this.clients = response.clients.map(client => ({
          id: client._id,
          name: client.name,
          phone: client.phone // Include phone in the clients array
        }));
        this.options7 = this.clients.map(client => client.name);
      },
      error: (error) => {
        console.error('Error fetching clients:', error);
      }
    });

    this.createprojectService.getEmployees().subscribe({
      next: (response) => {
        this.employees = response
          .filter((employee: any) => employee.userType === 'mobile user')
          .map((employee: any) => ({
            id: employee._id,
            name: employee.name || employee.username,
            userType: employee.userType
          }));
        this.options5 = this.employees.map(employee => employee.name);
        this.filteredEmployees = [...this.employees];
        console.log('Fetched employees (filtered for mobile users):', this.employees);
      },
      error: (error) => {
        console.error('Failed to fetch employees:', error);
      }
    });

    this.createprojectService.getProducts().subscribe({
      next: (response) => {
        this.products = response.map((product: any) => ({
          id: product._id,
          name: product.name
        }));
        console.log('Fetched products:', this.products);
        this.onProductChange();
      },
      error: (error) => {
        console.error('Failed to fetch products:', error);
      }
    });

    this.createprojectService.getApprovalDocuments().subscribe({
      next: (response) => {
        this.approvalDocuments = response.map((doc: any) => ({
          id: doc._id,
          name: doc.name
        }));
        console.log('Fetched approval documents:', this.approvalDocuments);
        this.onProductChange();
      },
      error: (error) => {
        console.error('Failed to fetch approval documents:', error);
      }
    });

    const storedData = localStorage.getItem('projectId');
    if (storedData) {
      this.projectId = storedData;
      console.log('Retrieved project ID from localStorage:', this.projectId);
      this.loadHierarchyLevels();
      this.fetchProjectReports();
    }

    this.fetchStandardAttributes();
    this.loadTemplateAttributes();

    this.route.queryParams.subscribe(params => {
      if (params['tab']) {
        setTimeout(() => {
          this.switchTab(params['tab']);
          if (params['drawer'] === 'open' && params['tab'] === 'reports') {
            this.openReportModal();
          }
        }, 300);
      }
      if (params['from'] === 'coverletter') {
        this.restoreFormData();
        this.fetchProjectReports();
        this.fetchStandardAttributes();
      }
    });

    this.additionalAttributes.forEach(() => {
      this.isDropdownOpenAttrType.push(false);
      this.isDropdownOpenAttrProduct.push(false);
      this.isDropdownOpenAttrApproval.push(false);
    });
  }

  ngAfterViewInit() {
    this.updateIndicatorPosition();
    const tabs = document.querySelectorAll('.nav-link');
    tabs.forEach(tab => {
      tab.addEventListener('click', (event) => {
        this.updateIndicatorPosition(event.target as HTMLElement);
        if ((event.target as HTMLElement).getAttribute('id') === 'reports-tab') {
          this.fetchProjectReports();
        } else if ((event.target as HTMLElement).getAttribute('id') === 'upload-documents-tab') {
          this.twoDFiles = [];
          this.technicalFiles = [];
          this.additionalFiles = [];
          this.fetchDocuments();
        }
      });
    });
  }

  filterEmployees() {
    const query = this.searchQuery.toLowerCase().trim();
    if (query) {
      this.filteredEmployees = this.employees.filter(employee =>
        employee.name.toLowerCase().includes(query) && employee.userType === 'mobile user'
      );
    } else {
      this.filteredEmployees = [...this.employees];
    }
  }

  stopPropagation(event: Event) {
    event.stopPropagation();
  }

  fetchProjectReports() {
    const projectId = this.projectId || localStorage.getItem('projectId');
    if (!projectId || !/^[0-9a-fA-F]{24}$/.test(projectId)) {
      console.error('Invalid or missing projectId for fetching reports:', projectId);
      this.reports = [];
      return;
    }

    const reportsApiUrl = `https://vps.allpassiveservices.com.au/api/project/reports/${projectId}`;
    this.http.get<{ message: string; data: Report[] }>(reportsApiUrl).subscribe({
      next: (response) => {
        this.reports = response.data || [];
        console.log('Fetched project reports:', this.reports);
        this.toastr.success('Project reports fetched successfully', 'Success');
      },
      error: (error) => {
        if (error.error && error.error.message === "No reports found for this project.") {
          console.log('No reports found for this project');
          this.reports = [];
        } else {
          console.error('Failed to fetch project reports:', error);
          this.reports = [];
          this.toastr.error('Failed to fetch project reports', 'Error');
        }
      }
    });
  }

  fetchDocuments() {
    const projectId = this.projectId || localStorage.getItem('projectId');
    if (!projectId || !/^[0-9a-fA-F]{24}$/.test(projectId)) {
      console.error('Invalid or missing projectId for fetching documents:', projectId);
      this.twoDFiles = [];
      this.technicalFiles = [];
      this.additionalFiles = [];
      return;
    }

    if (!this.selectedHierarchyLevel && this.hierarchyLevels.length > 0) {
      this.selectedHierarchyLevel = this.hierarchyLevels[0].id;
    }

    if (!this.selectedHierarchyLevel) {
      console.error('No hierarchy level selected for fetching documents.');
      this.twoDFiles = [];
      this.technicalFiles = [];
      this.additionalFiles = [];
      return;
    }

    this.createprojectService.getDocuments(projectId, this.selectedHierarchyLevel).subscribe({
      next: (response) => {
        console.log('Fetched documents:', response);
        const documents: Document[] = response.data || [];
        this.twoDFiles = documents.filter(doc => doc.documentType === '2D Plan');
        this.technicalFiles = documents.filter(doc => doc.documentType === 'Technical');
        this.additionalFiles = documents.filter(doc => doc.documentType === 'Additional');
        console.log('Updated 2D Files:', this.twoDFiles);
        console.log('Updated Technical Files:', this.technicalFiles);
        console.log('Updated Additional Files:', this.additionalFiles);
        this.toastr.success('Documents fetched successfully', 'Success');
      },
      error: (error) => {
        if (error.error && error.error.message === "No documents found for this project.") {
          console.log('No documents found for this project');
        } else {
          console.error('Failed to fetch documents:', error);
          this.toastr.error('Failed to fetch documents', 'Error');
        }
        this.twoDFiles = [];
        this.technicalFiles = [];
        this.additionalFiles = [];
      }
    });
  }

  deleteDocument(documentId: string, documentType: '2D Plan' | 'Technical' | 'Additional') {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    switch (documentType) {
      case '2D Plan':
        this.twoDFiles = this.twoDFiles.filter(doc => doc._id !== documentId);
        break;
      case 'Technical':
        this.technicalFiles = this.technicalFiles.filter(doc => doc._id !== documentId);
        break;
      case 'Additional':
        this.additionalFiles = this.additionalFiles.filter(doc => doc._id !== documentId);
        break;
    }

    console.log(`Deleted document with ID: ${documentId} of type ${documentType}`);
  }

  toggleDropdown(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.isDropdownOpen = !this.isDropdownOpen;
    this.closeOtherDropdowns('dropdown-toggle-status');
    console.log('Toggling project status dropdown, new state:', this.isDropdownOpen);
  }

  toggleDropdown1(dropdown: any, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    dropdown.isOpen = !dropdown.isOpen;
    this.closeOtherDropdowns('dropdown-toggle-1');
    console.log('Toggling dropdown1, new state:', dropdown.isOpen);
  }

  toggleDropdown10(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.isDropdownOpen1 = !this.isDropdownOpen1;
    this.closeOtherDropdowns('dropdown-toggle-10');
    console.log('Toggling dropdown1, new state:', this.isDropdownOpen1);
  }

  toggleDropdown2(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.isDropdownOpen2 = !this.isDropdownOpen2;
    this.closeOtherDropdowns('dropdown-toggle-2');
    console.log('Toggling dropdown2, new state:', this.isDropdownOpen2);
  }

  toggleDropdown3(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.isDropdownOpen3 = !this.isDropdownOpen3;
    this.closeOtherDropdowns('dropdown-toggle-3');
    console.log('Toggling dropdown3, new state:', this.isDropdownOpen3);
  }

  toggleDropdown4(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.isDropdownOpen4 = !this.isDropdownOpen4;
    this.closeOtherDropdowns('dropdown-toggle-4');
    console.log('Toggling dropdown4, new state:', this.isDropdownOpen4);
  }

  toggleDropdown5(event: Event): void {
    event.stopPropagation();
    this.isDropdownOpen5 = !this.isDropdownOpen5;
    this.closeOtherDropdowns('dropdown-toggle-5');
    if (this.isDropdownOpen5) {
      this.searchQuery = '';
      this.filteredEmployees = [...this.employees];
    }
    console.log('Toggling Assign Employees dropdown, new state:', this.isDropdownOpen5);
  }

  toggleDropdown6(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.isDropdownOpen6 = !this.isDropdownOpen6;
    this.isDropdownOpen7 = false;
    this.closeOtherDropdowns('dropdown-toggle-6');
    console.log('Toggling dropdown6, new state:', this.isDropdownOpen6);
  }

  toggleDropdown7(event: Event): void {
    event.stopPropagation();
    this.isDropdownOpen7 = !this.isDropdownOpen7;
    this.closeOtherDropdowns('dropdown-toggle-7');
    console.log('Toggling Client Name dropdown, new state:', this.isDropdownOpen7);
  }

  toggleDropdown12(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.dropdown8.isOpen = !this.dropdown8.isOpen;
    this.closeOtherDropdowns('dropdown-toggle-8');
    console.log('Toggling dropdown8, new state:', this.dropdown8.isOpen);
  }

  toggleDropdown30(event: Event): void {
    event.stopPropagation();
    this.isDropdownOpen30 = !this.isDropdownOpen30;
    this.closeOtherDropdowns('dropdown-toggle-30');
    console.log('Toggling Product ID dropdown, new state:', this.isDropdownOpen30);
  }

  toggleDropdown31(event: Event): void {
    event.stopPropagation();
    this.isDropdownOpen31 = !this.isDropdownOpen31;
    this.closeOtherDropdowns('dropdown-toggle-31');
    console.log('Toggling Approval Documents dropdown, new state:', this.isDropdownOpen31);
  }

  toggleDropdownli(event: Event): void {
    event.stopPropagation();
    this.isDropdownOpenli = !this.isDropdownOpenli;
    this.closeOtherDropdowns('dropdown-toggle-li');
    console.log('Toggling Template Name dropdown, new state:', this.isDropdownOpenli);
  }

  toggleDropdownMainType(event: Event): void {
    event.stopPropagation();
    this.isDropdownOpenMainType = !this.isDropdownOpenMainType;
    this.closeOtherDropdowns('dropdown-toggle-main-type');
  }

  toggleDropdownMainProduct(event: Event): void {
    event.stopPropagation();
    this.isDropdownOpenMainProduct = !this.isDropdownOpenMainProduct;
    this.closeOtherDropdowns('dropdown-toggle-main-product');
  }

  toggleDropdownMainApproval(event: Event): void {
    event.stopPropagation();
    this.isDropdownOpenMainApproval = !this.isDropdownOpenMainApproval;
    this.closeOtherDropdowns('dropdown-toggle-main-approval');
  }

  toggleDropdownAttrType(index: number, event: Event): void {
    event.stopPropagation();
    this.isDropdownOpenAttrType[index] = !this.isDropdownOpenAttrType[index];
    this.closeOtherDropdowns(`dropdown-toggle-attr-type-${index}`);
  }

  toggleDropdownAttrProduct(index: number, event: Event): void {
    event.stopPropagation();
    this.isDropdownOpenAttrProduct[index] = !this.isDropdownOpenAttrProduct[index];
    this.closeOtherDropdowns(`dropdown-toggle-attr-product-${index}`);
  }

  toggleDropdownAttrApproval(index: number, event: Event): void {
    event.stopPropagation();
    this.isDropdownOpenAttrApproval[index] = !this.isDropdownOpenAttrApproval[index];
    this.closeOtherDropdowns(`dropdown-toggle-attr-approval-${index}`);
  }

  closeOtherDropdowns(currentDropdownId: string) {
    const dropdowns = [
      { id: 'dropdown-toggle-status', prop: 'isDropdownOpen' },
      { id: 'dropdown-toggle-1', prop: 'isDropdownOpen1' },
      { id: 'dropdown-toggle-2', prop: 'isDropdownOpen2' },
      { id: 'dropdown-toggle-3', prop: 'isDropdownOpen3' },
      { id: 'dropdown-toggle-4', prop: 'isDropdownOpen4' },
      { id: 'dropdown-toggle-5', prop: 'isDropdownOpen5' },
      { id: 'dropdown-toggle-6', prop: 'isDropdownOpen6' },
      { id: 'dropdown-toggle-7', prop: 'isDropdownOpen7' },
      { id: 'dropdown-toggle-8', prop: 'dropdown8.isOpen' },
      { id: 'dropdown-toggle-li', prop: 'isDropdownOpenli' },
      { id: 'dropdown-toggle-30', prop: 'isDropdownOpen30' },
      { id: 'dropdown-toggle-31', prop: 'isDropdownOpen31' },
      { id: 'dropdown-toggle-main-type', prop: 'isDropdownOpenMainType' },
      { id: 'dropdown-toggle-main-product', prop: 'isDropdownOpenMainProduct' },
      { id: 'dropdown-toggle-main-approval', prop: 'isDropdownOpenMainApproval' },
      ...this.additionalAttributes.map((_, i) => [
        { id: `dropdown-toggle-attr-type-${i}`, prop: `isDropdownOpenAttrType[${i}]` },
        { id: `dropdown-toggle-attr-product-${i}`, prop: `isDropdownOpenAttrProduct[${i}]` },
        { id: `dropdown-toggle-attr-approval-${i}`, prop: `isDropdownOpenAttrApproval[${i}]` }
      ]).flat()
    ];

    dropdowns.forEach(dropdown => {
      if (dropdown.id !== currentDropdownId) {
        const props = dropdown.prop.split('.');
        const indexMatch = dropdown.prop.match(/\[(\d+)\]/);
        if (indexMatch) {
          const index = parseInt(indexMatch[1], 10);
          const propName = dropdown.prop.split('[')[0];
          (this as any)[propName][index] = false;
        } else if (props.length === 1) {
          (this as any)[dropdown.prop] = false;
        } else {
          (this as any)[props[0]][props[1]] = false;
        }
      }
    });
  }

  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const dropdownIds = [
      'dropdown-toggle-status',
      'dropdown-toggle-1',
      'dropdown-toggle-2',
      'dropdown-toggle-3',
      'dropdown-toggle-4',
      'dropdown-toggle-5',
      'dropdown-toggle-6',
      'dropdown-toggle-7',
      'dropdown-toggle-8',
      'dropdown-toggle-li',
      'dropdown-toggle-30',
      'dropdown-toggle-31',
      'dropdown-toggle-main-type',
      'dropdown-toggle-main-product',
      'dropdown-toggle-main-approval',
      ...this.additionalAttributes.map((_, i) => [
        `dropdown-toggle-attr-type-${i}`,
        `dropdown-toggle-attr-product-${i}`,
        `dropdown-toggle-attr-approval-${i}`
      ]).flat()
    ];

    const isClickInsideDropdown = dropdownIds.some(id => {
      const dropdown = document.getElementById(id);
      return dropdown && dropdown.contains(target);
    }) || document.querySelector('.dropdown-menu')?.contains(target);

    if (!isClickInsideDropdown) {
      this.isDropdownOpen = false;
      this.isDropdownOpen1 = false;
      this.isDropdownOpen2 = false;
      this.isDropdownOpen3 = false;
      this.isDropdownOpen4 = false;
      this.isDropdownOpen5 = false;
      this.isDropdownOpen6 = false;
      this.isDropdownOpen7 = false;
      this.dropdown8.isOpen = false;
      this.isDropdownOpenli = false;
      this.isDropdownOpen30 = false;
      this.isDropdownOpen31 = false;
      this.isDropdownOpenMainType = false;
      this.isDropdownOpenMainProduct = false;
      this.isDropdownOpenMainApproval = false;
      this.isDropdownOpenAttrType = this.isDropdownOpenAttrType.map(() => false);
      this.isDropdownOpenAttrProduct = this.isDropdownOpenAttrProduct.map(() => false);
      this.isDropdownOpenAttrApproval = this.isDropdownOpenAttrApproval.map(() => false);
      console.log('Closed all dropdowns due to outside click');
    }
  }

  selectOption(option: string, event: Event) {
    event.stopPropagation();
    this.selectedOption = option;
    this.isDropdownOpen = false;
    console.log('Selected project status:', option);
    this.saveFormData();
  }

  selectOption1(dropdown: any, option: string, event: Event) {
    event.stopPropagation();
    dropdown.selected = option;
    dropdown.isOpen = false;
    console.log('Selected dropdown1 option:', option);
  }

  selectOption4(option: string, event: Event) {
    event.stopPropagation();
    this.selectedReportType = option;
    this.selectedOption4 = option;
    this.isDropdownOpen4 = false;
    this.initializeSelectedFields();
    console.log('Selected dropdown4 option:', option);
  }

  selectOption5(option: string, event: Event) {
    event.stopPropagation();
    if (!this.selectedDocuments5.includes(option)) {
      this.selectedDocuments5.push(option);
    }
    this.isDropdownOpen5 = false;
    this.searchQuery = '';
    this.filteredEmployees = [...this.employees];
    console.log('Selected dropdown5 option:', option, 'Current selections:', this.selectedDocuments5);
  }

  selectOption6(option: string, event: Event) {
    event.stopPropagation();
    this.selectedOption6 = option;
    this.hierarchyLevelsChange = option === 'Yes';
    this.isDropdownOpen6 = false;
    console.log('Selected option6:', option);
    this.saveFormData();
  }

  selectOption7(option: string): void {
    this.selectedOption7 = option;
    const selectedClient = this.clients.find(client => client.name === option);
    if (selectedClient) {
      this.clientId = selectedClient.id;
      this.clientName = selectedClient.name;
      this.clientPhone = selectedClient.phone || ''; // Set clientPhone to the selected client's phone number
    } else {
      this.clientId = '';
      this.clientName = '';
      this.clientPhone = ''; // Clear clientPhone if no client is found
    }
    this.isDropdownOpen7 = false;
    this.saveFormData(); // Save updated form data including clientPhone
    console.log('Selected client:', option, 'clientPhone set to:', this.clientPhone);
  }

  selectOption8(dropdown: any, option: string, event: Event) {
    event.stopPropagation();
    dropdown.selected = option;
    dropdown.isOpen = false;
    console.log('Selected dropdown8 option:', option);
  }

  selectOptionli(option: any) {
    this.selectedOptionli = option;
    this.templateName = option.label;
    this.isDropdownOpenli = false;
    this.loadTemplateAttributes();
    console.log('Selected dropdownli option:', option, 'templateName set to:', this.templateName);
  }

  selectProduct(productId: string, event: Event): void {
    event.stopPropagation();
    this.productId = productId;
    this.isDropdownOpen30 = false;
    this.onProductChange();
    console.log('Selected Product ID:', productId);
    this.saveFormData();
  }

  selectApprovalDocument(docId: string, event: Event): void {
    event.stopPropagation();
    if (docId && !this.selectedApprovalDocuments.includes(docId)) {
      this.selectedApprovalDocuments.push(docId);
      console.log('Added approval document:', docId, 'Current selections:', this.selectedApprovalDocuments);
    }
    this.isDropdownOpen31 = false;
    this.saveFormData();
  }

  selectMainType(type: string, event: Event): void {
    event.stopPropagation();
    this.attributeType = type;
    this.isDropdownOpenMainType = false;
  }

  selectMainProduct(productId: string, event: Event): void {
    event.stopPropagation();
    this.mainAttribute.productId = productId;
    this.isDropdownOpenMainProduct = false;
    this.onConditionalProductChange(-1);
  }

  addMainConditionalApprovalDocumentCustom(docId: string, event: Event): void {
    event.stopPropagation();
    if (docId && !this.mainAttribute.selectedApprovalDocuments?.includes(docId)) {
      this.mainAttribute.selectedApprovalDocuments = this.mainAttribute.selectedApprovalDocuments || [];
      this.mainAttribute.selectedApprovalDocuments.push(docId);
    }
    this.isDropdownOpenMainApproval = false;
  }

  selectAttrType(index: number, type: string, event: Event): void {
    event.stopPropagation();
    this.additionalAttributes[index].type = type;
    this.isDropdownOpenAttrType[index] = false;
  }

  selectAttrProduct(index: number, productId: string, event: Event): void {
    event.stopPropagation();
    this.additionalAttributes[index].productId = productId;
    this.isDropdownOpenAttrProduct[index] = false;
    this.onConditionalProductChange(index);
  }

  addAdditionalConditionalApprovalDocumentCustom(index: number, docId: string, event: Event): void {
    event.stopPropagation();
    if (docId && !this.additionalAttributes[index].selectedApprovalDocuments?.includes(docId)) {
      this.additionalAttributes[index].selectedApprovalDocuments = this.additionalAttributes[index].selectedApprovalDocuments || [];
      this.additionalAttributes[index].selectedApprovalDocuments.push(docId);
    }
    this.isDropdownOpenAttrApproval[index] = false;
  }

  addTag() {
    const val = this.dropdown8.selected.trim();
    if (val && !this.addedTags.includes(val)) {
      this.addedTags.push(val);
      this.dropdown8.selected = '';
      console.log('Added tag:', val, 'Current tags:', this.addedTags);
      this.saveFormData();
    }
  }

  removeTag(index: number, event: MouseEvent) {
    event.stopPropagation();
    this.addedTags.splice(index, 1);
    console.log('Removed tag at index:', index, 'Current tags:', this.addedTags);
    this.saveFormData();
  }

  removeDocument5(doc: string) {
    this.selectedDocuments5 = this.selectedDocuments5.filter(d => d !== doc);
    console.log('Removed document5:', doc, 'Current selections:', this.selectedDocuments5);
  }

  addApprovalDocument(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    const docId = selectElement.value;
    if (docId && !this.selectedApprovalDocuments.includes(docId)) {
      this.selectedApprovalDocuments.push(docId);
      console.log('Added approval document:', docId, 'Current selections:', this.selectedApprovalDocuments);
    }
    selectElement.value = '';
  }

  removeApprovalDocument(index: number) {
    this.selectedApprovalDocuments.splice(index, 1);
    console.log('Removed approval document at index:', index, 'Current selections:', this.selectedApprovalDocuments);
    this.saveFormData();
  }

  addMainConditionalApprovalDocument(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    const docId = selectElement.value;
    if (docId && !this.mainAttribute.selectedApprovalDocuments?.includes(docId)) {
      this.mainAttribute.selectedApprovalDocuments = this.mainAttribute.selectedApprovalDocuments || [];
      this.mainAttribute.selectedApprovalDocuments.push(docId);
      console.log('Added main conditional approval document:', docId);
    }
    selectElement.value = '';
  }

  removeMainConditionalApprovalDocument(index: number) {
    if (this.mainAttribute.selectedApprovalDocuments) {
      this.mainAttribute.selectedApprovalDocuments.splice(index, 1);
      console.log('Removed main conditional approval document at index:', index);
    }
  }

  addAdditionalConditionalApprovalDocument(attrIndex: number, event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    const docId = selectElement.value;
    if (docId && !this.additionalAttributes[attrIndex].selectedApprovalDocuments?.includes(docId)) {
      this.additionalAttributes[attrIndex].selectedApprovalDocuments = this.additionalAttributes[attrIndex].selectedApprovalDocuments || [];
      this.additionalAttributes[attrIndex].selectedApprovalDocuments.push(docId);
      console.log(`Added conditional approval document for attribute ${attrIndex}:`, docId);
    }
    selectElement.value = '';
  }

  removeAdditionalConditionalApprovalDocument(attrIndex: number, docIndex: number) {
    if (this.additionalAttributes[attrIndex].selectedApprovalDocuments) {
      this.additionalAttributes[attrIndex].selectedApprovalDocuments.splice(docIndex, 1);
      console.log(`Removed conditional approval document at index ${docIndex} for attribute ${attrIndex}`);
    }
  }

  onProductChange() {
    if (this.productId) {
      this.http.get(`https://vps.allpassiveservices.com.au/api/product/list`).subscribe({
        next: (response: any) => {
          const selectedProduct = response.find((product: any) => product._id === this.productId);
          if (selectedProduct && selectedProduct.approvalDocuments) {
            this.filteredApprovalDocuments = selectedProduct.approvalDocuments.map((doc: any) => ({
              id: doc._id,
              name: doc.name
            }));
            console.log('Filtered approval documents for product:', this.productId, this.filteredApprovalDocuments);
          } else {
            this.filteredApprovalDocuments = [];
            console.log('No approval documents found for product:', this.productId);
          }
          this.selectedApprovalDocuments = [];
          this.mainAttribute.filteredApprovalDocuments = [...this.filteredApprovalDocuments];
          this.additionalAttributes = this.additionalAttributes.map(attr => ({
            ...attr,
            filteredApprovalDocuments: [...this.filteredApprovalDocuments]
          }));
        },
        error: (error) => {
          console.error('Failed to fetch product details:', error);
          this.filteredApprovalDocuments = [];
          this.selectedApprovalDocuments = [];
          this.mainAttribute.filteredApprovalDocuments = [];
          this.additionalAttributes = this.additionalAttributes.map(attr => ({
            ...attr,
            filteredApprovalDocuments: []
          }));
        }
      });
    } else {
      this.filteredApprovalDocuments = [];
      this.selectedApprovalDocuments = [];
      this.mainAttribute.filteredApprovalDocuments = [];
      this.additionalAttributes = this.additionalAttributes.map(attr => ({
        ...attr,
        filteredApprovalDocuments: []
      }));
    }
    this.saveFormData();
  }

  onConditionalProductChange(attrIndex: number) {
    const productId = attrIndex === -1 ? this.mainAttribute.productId : this.additionalAttributes[attrIndex].productId;
    if (productId) {
      this.http.get(`https://vps.allpassiveservices.com.au/api/product/list`).subscribe({
        next: (response: any) => {
          const selectedProduct = response.find((product: any) => product._id === productId);
          const filteredDocs = selectedProduct && selectedProduct.approvalDocuments
            ? selectedProduct.approvalDocuments.map((doc: any) => ({
              id: doc._id,
              name: doc.name
            }))
            : [];
          if (attrIndex === -1) {
            this.mainAttribute.filteredApprovalDocuments = filteredDocs;
            this.mainAttribute.selectedApprovalDocuments = [];
          } else {
            this.additionalAttributes[attrIndex].filteredApprovalDocuments = filteredDocs;
            this.additionalAttributes[attrIndex].selectedApprovalDocuments = [];
          }
          console.log(`Filtered approval documents for conditional product ${productId} (attrIndex: ${attrIndex}):`, filteredDocs);
        },
        error: (error) => {
          console.error(`Failed to fetch approval documents for conditional product ${productId}:`, error);
          if (attrIndex === -1) {
            this.mainAttribute.filteredApprovalDocuments = [];
            this.mainAttribute.selectedApprovalDocuments = [];
          } else {
            this.additionalAttributes[attrIndex].filteredApprovalDocuments = [];
            this.additionalAttributes[attrIndex].selectedApprovalDocuments = [];
          }
        }
      });
    } else {
      if (attrIndex === -1) {
        this.mainAttribute.filteredApprovalDocuments = [];
        this.mainAttribute.selectedApprovalDocuments = [];
      } else {
        this.additionalAttributes[attrIndex].filteredApprovalDocuments = [];
        this.additionalAttributes[attrIndex].selectedApprovalDocuments = [];
      }
    }
  }

  openModal() {
    this.isOpen = true;
    this.loadHierarchyLevels();
    console.log('Opened modal, triggered loadHierarchyLevels');
  }

  closeModal() {
    this.isOpen = false;
    this.bulkFiles = [];
    this.documentNames = [];
    this.singleFile2D = null;
    this.singleFileTechnical = null;
    this.singleFileAdditional = null;
    if (this.bulkFileInput) {
      this.bulkFileInput.nativeElement.value = '';
    }
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
      modal.classList.remove('show');
      modal.setAttribute('aria-hidden', 'true');
      (modal as HTMLElement).style.display = 'none';
    });
    const modalBackdrop = document.querySelector('.modal-backdrop');
    if (modalBackdrop) {
      modalBackdrop.remove();
    }
    document.body.classList.remove('modal-open');
  }

  openReportModal() {
    this.isOpen = true;
    this.isReportModalOpen = true;
    this.selectedReportType = 'Standard Reports';
    this.fetchStandardAttributes();
    setTimeout(() => {
      this.initializeSelectedFields();
    }, 500);
  }

  closeReportModal() {
    this.isReportModalOpen = false;
    console.log('Closed report modal');
  }

  initializeSelectedFields() {
    this.selectedFields = { 'Select All': false };
    if (this.standardAttributes?.attributes) {
      this.standardAttributes.attributes.forEach((attr: any) => {
        this.selectedFields[attr.name] = false;
      });
    }
  }

  toggleSelectAll() {
    const isSelectAll = this.selectedFields['Select All'];
    Object.keys(this.selectedFields).forEach(field => {
      this.selectedFields[field] = isSelectAll;
    });
  }

  generateReport(): void {
    const doc = new jsPDF();
    doc.save('blank_report.pdf');
    console.log('Generated blank PDF');
    this.closeReportModal();
  }

  updateIndicatorPosition(tab: HTMLElement = document.querySelector('.nav-link.active') as HTMLElement) {
    const indicator = document.querySelector('.tab-indicator') as HTMLElement;
    if (indicator && tab) {
      const tabRect = tab.getBoundingClientRect();
      indicator.style.width = `${tabRect.width}px`;
      indicator.style.left = `${tabRect.left}px`;
    }
  }

  addHierarchyLevel() {
    this.hierarchyLevelsInput.push({ name: '' });
    console.log('Added new hierarchy level input:', this.hierarchyLevelsInput);
  }

  removeHierarchyLevel(index: number) {
    if (this.hierarchyLevelsInput.length > 1) {
      this.hierarchyLevelsInput.splice(index, 1);
      console.log('Removed hierarchy level input at index:', index, 'Current inputs:', this.hierarchyLevelsInput);
    }
  }

  submitHierarchy() {
    const levels = this.hierarchyLevelsInput
      .map(level => ({ name: level.name.trim() }))
      .filter(level => level.name);
    if (levels.length === 0) {
      console.error('No valid hierarchy levels provided:', this.hierarchyLevelsInput);
      this.toastr.error('No valid hierarchy levels provided', 'Error');
      return;
    }

    let projectId = this.projectId || localStorage.getItem('projectId');
    if (!projectId || !/^[0-9a-fA-F]{24}$/.test(projectId)) {
      console.error('Invalid projectId:', projectId);
      this.toastr.error('Invalid project ID', 'Error');
      return;
    }

    const payload = {
      projectId: projectId,
      levels: levels
    };

    console.log('Submitting hierarchy with payload:', JSON.stringify(payload, null, 2));

    this.createprojectService.createBuildingHierarchy(projectId, levels).subscribe({
      next: (response) => {
        console.log('createBuildingHierarchy API Response:', response);
        this.hierarchyLevelsInput = [{ name: '' }];
        this.projectId = projectId;
        localStorage.setItem('projectId', projectId);
        this.toastr.success('Hierarchy levels created successfully', 'Success');
        setTimeout(() => {
          this.loadHierarchyLevels();
        }, 500);
        setTimeout(() => {
          const uploadDocumentsTab = document.getElementById('upload-documents-tab');
          if (uploadDocumentsTab) {
            (uploadDocumentsTab as HTMLElement).click();
          }
        }, 1000);
      },
      error: (error) => {
        console.error('createBuildingHierarchy API Error:', error);
        console.error('Response Body:', error.error);
        this.toastr.error('Failed to create hierarchy levels', 'Error');
      }
    });
  }

  onFormSubmit(event: Event) {
    event.preventDefault();
  }

  onInputKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addHierarchyLevel();
    }
  }

  goToStandardsTab() {
    const standardsTab = document.getElementById('standards-tab');
    if (standardsTab) {
      (standardsTab as HTMLElement).click();
    }
  }

  loadHierarchyLevels() {
    let projectId = this.projectId || localStorage.getItem('projectId');
    if (!projectId || !/^[0-9a-fA-F]{24}$/.test(projectId)) {
      console.error('Invalid or missing projectId for loading hierarchy levels:', projectId);
      this.hierarchyLevels = [];
      return;
    }

    console.log('Fetching project details for projectId:', projectId);

    this.http.get(`https://vps.allpassiveservices.com.au/api/project/details/${projectId}`).subscribe({
      next: (response: any) => {
        console.log('Project Details API Response:', response);
        if (response && response.subProjects && Array.isArray(response.subProjects)) {
          this.hierarchyLevels = response.subProjects.map((subProject: any) => ({
            id: subProject.hierarchyLevelId,
            name: subProject.hierarchyName
          }));

          if (this.hierarchyLevels.length > 0 && !this.selectedHierarchyLevel) {
            this.selectedHierarchyLevel = this.hierarchyLevels[0].id;
          }

          console.log('Populated hierarchyLevels:', this.hierarchyLevels);
          console.log('Selected hierarchy level:', this.selectedHierarchyLevel);
        } else {
          console.warn('No subProjects found or invalid response format:', response);
          this.hierarchyLevels = [];
          this.selectedHierarchyLevel = '';
          this.twoDFiles = [];
          this.technicalFiles = [];
          this.additionalFiles = [];
        }
      },
      error: (error: any) => {
        console.error('Project Details API Error:', error, 'Response:', error.error);
        this.hierarchyLevels = [];
        this.selectedHierarchyLevel = '';
        this.twoDFiles = [];
        this.technicalFiles = [];
        this.additionalFiles = [];
      }
    });
  }

  onBulkFilesChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.bulkFiles = Array.from(input.files);
      this.documentNames = this.bulkFiles.map(file => file.name);
      console.log('Selected bulk files:', this.bulkFiles.map(f => f.name));
    }
  }

  onSingleFileChange(event: Event, documentType: string) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (documentType === '2D Plan') {
        this.singleFile2D = file;
      } else if (documentType === 'Technical Document') {
        this.singleFileTechnical = file;
      } else if (documentType === 'Additional Document') {
        this.singleFileAdditional = file;
      }
      console.log(`Selected single file for ${documentType}:`, file.name);
    }
  }

  saveBulkFiles(documentType: string) {
    if (this.bulkFiles.length === 0) {
      console.error('No files selected for upload');
      this.toastr.error('No files selected for upload', 'Error');
      return;
    }

    let mappedDocumentType: string;
    switch (documentType) {
      case '2D Plan':
        mappedDocumentType = '2D Plan';
        break;
      case 'Technical Document':
        mappedDocumentType = 'Technical';
        break;
      case 'Additional Document':
        mappedDocumentType = 'Additional';
        break;
      default:
        console.error('Invalid document type');
        this.toastr.error('Invalid document type', 'Error');
        return;
    }

    for (let i = 0; i < this.bulkFiles.length; i++) {
      if (!this.documentNames[i] || this.documentNames[i].trim() === '') {
        this.documentNames[i] = this.bulkFiles[i].name;
      }
    }

    let projectId = this.projectId || localStorage.getItem('projectId');
    if (!projectId || !/^[0-9a-fA-F]{24}$/.test(projectId)) {
      console.error('Invalid projectId for uploading documents:', projectId);
      this.toastr.error('Invalid project ID', 'Error');
      return;
    }

    if (!this.selectedHierarchyLevel) {
      console.error('No hierarchy level selected for uploading documents');
      this.toastr.error('No hierarchy level selected', 'Error');
      return;
    }

    console.log('Uploading bulk documents:', {
      projectId: projectId,
      documentType: mappedDocumentType,
      hierarchyLevel: this.selectedHierarchyLevel,
      fileCount: this.bulkFiles.length,
      fileNames: this.bulkFiles.map(f => f.name),
      documentNames: this.documentNames
    });

    this.createprojectService.uploadDocuments(
      projectId,
      mappedDocumentType,
      this.selectedHierarchyLevel,
      this.bulkFiles,
      this.documentNames
    ).subscribe({
      next: (response) => {
        console.log('Bulk upload response:', response);
        this.bulkFiles = [];
        if (this.bulkFileInput) {
          this.bulkFileInput.nativeElement.value = '';
        }
        this.documentNames = [];
        this.closeModal();
        this.fetchDocuments();
        this.toastr.success('Bulk files uploaded successfully', 'Success');
      },
      error: (error) => {
        console.error('API Error:', error);
        this.toastr.error('Failed to upload bulk files', 'Error');
      }
    });
  }

saveSingleFile(documentType: string) {
  let file: File | null = null;
  let mappedDocumentType: string;

  switch (documentType) {
    case '2D Plan':
      file = this.singleFile2D;
      mappedDocumentType = '2D Plan';
      break;
    case 'Technical Document':
      file = this.singleFileTechnical;
      mappedDocumentType = 'Technical';
      break;
    case 'Additional Document':
      file = this.singleFileAdditional;
      mappedDocumentType = 'Additional';
      break;
    default:
      console.error('Invalid document type');
      this.toastr.error('Invalid document type', 'Error');
      return;
  }

  if (!file) {
    console.error('No file selected for upload');
    this.toastr.error('No file selected for upload', 'Error');
    return;
  }

  const projectId = this.projectId || localStorage.getItem('projectId');
  if (!projectId || !/^[0-9a-fA-F]{24}$/.test(projectId)) {
    console.error('Invalid projectId for uploading document:', projectId);
    this.toastr.error('Invalid project ID', 'Error');
    return;
  }

  if (!this.selectedHierarchyLevel) {
    console.error('No hierarchy level selected for uploading document');
    this.toastr.error('No hierarchy level selected', 'Error');
    return;
  }

  console.log('Uploading single document:', {
    projectId,
    documentType: mappedDocumentType,
    hierarchyLevel: this.selectedHierarchyLevel,
    fileName: file.name
  });

  this.createprojectService.uploadSingleDocument(
    projectId,
    mappedDocumentType,
    this.selectedHierarchyLevel,
    file,
    file.name
  ).subscribe({
    next: (response) => {
      console.log('Single file upload response:', response);
      this.singleFile2D = null;
      this.singleFileTechnical = null;
      this.singleFileAdditional = null;
      this.closeModal();
      this.fetchDocuments();
      this.toastr.success('File uploaded successfully', 'Success');
    },
    error: (error) => {
      console.error('API Error:', error);
      this.toastr.error('Failed to upload file', 'Error');
    }
  });
}

  openFileInput() {
    document.getElementById('fileInput')?.click();
  }

  onImageFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.type.startsWith('image/')) {
        this.imageFile = file;
        const reader = new FileReader();
        reader.onload = () => {
          this.imagePreview = reader.result as string;
        };
        reader.readAsDataURL(file);
        console.log('Selected image file:', file.name);
        this.saveFormData();
      } else {
        console.error('Invalid file type: Please upload an image file');
        this.toastr.error('Invalid file type: Please upload an image file', 'Error');
      }
    }
  }

  @HostListener('dragover', ['$event'])
  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    const dropZone = document.querySelector('.igm1');
    if (dropZone) {
      dropZone.classList.add('drag-over');
    }
  }

  @HostListener('dragleave', ['$event'])
  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    const dropZone = document.querySelector('.igm1');
    if (dropZone) {
      dropZone.classList.remove('drag-over');
    }
  }

  @HostListener('drop', ['$event'])
  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    const dropZone = document.querySelector('.igm1');
    if (dropZone) {
      dropZone.classList.remove('drag-over');
    }

    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        this.imageFile = file;
        const reader = new FileReader();
        reader.onload = () => {
          this.imagePreview = reader.result as string;
        };
        reader.readAsDataURL(file);
        console.log('Dropped image file:', file.name);
        this.saveFormData();
      } else {
        console.error('Invalid file type: Please upload an image file');
        this.toastr.error('Invalid file type: Please upload an image file', 'Error');
      }
    }
  }

  saveFormData() {
    const formData = {
      projectName: this.projectName,
      buildingName: this.buildingName,
      address: {
        line1: this.addressLine1,
        line2: this.addressLine2,
        city: this.city,
        state: this.state,
        zip: this.zip
      },
      projectStatus: this.selectedOption,
      hierarchyLevelsChange: this.hierarchyLevelsChange ? 'true' : 'false',
      subcontractorName: this.subcontractorName,
      subcontractorContactPerson: this.subcontractorContactPerson,
      subcontractorPhone: this.subcontractorPhone,
      clientId: this.clientId,
      clientName: this.clientName,
      contactPerson: this.clientContactPerson,
      clientPhone: this.clientPhone,
      subProjects: JSON.stringify(this.addedTags),
      selectedApprovalDocuments: JSON.stringify(this.selectedApprovalDocuments)
    };
    localStorage.setItem('projectFormData', JSON.stringify(formData));
    console.log('Saved form data to localStorage:', formData);
  }

  submitProjectAttributes() {
    this.projectName = (document.querySelectorAll('.col-6 input[type="text"]')[0] as HTMLInputElement)?.value || '';
    this.buildingName = (document.querySelectorAll('.col-6 input[type="text"]')[1] as HTMLInputElement)?.value || '';
    this.addressLine1 = (document.querySelectorAll('.input-container input')[2] as HTMLInputElement)?.value || '';
    this.addressLine2 = (document.querySelectorAll('.input-container input')[3] as HTMLInputElement)?.value || '';
    this.city = (document.querySelectorAll('.input-container input')[4] as HTMLInputElement)?.value || '';
    this.state = (document.querySelectorAll('.input-container input')[5] as HTMLInputElement)?.value || '';
    this.zip = (document.querySelectorAll('.input-container input')[6] as HTMLInputElement)?.value || '';
    this.subcontractorName = (document.querySelectorAll('.col-12 .input-container input')[0] as HTMLInputElement)?.value || '';
    this.subcontractorContactPerson = (document.querySelectorAll('.col-12 .input-container input')[1] as HTMLInputElement)?.value || '';
    this.subcontractorPhone = (document.querySelectorAll('.col-12 .input-container input')[2] as HTMLInputElement)?.value || '';
    this.clientContactPerson = (document.querySelectorAll('.col-12 .input-container input')[3] as HTMLInputElement)?.value || '';
    this.clientPhone = (document.querySelectorAll('.col-12 .input-container input')[4] as HTMLInputElement)?.value || '';

    if (!this.projectName) {
      console.error('Project Name is required');
      this.toastr.error('Project Name is required', 'Error');
      return;
    }
    if (!this.clientId && !this.clientName) {
      console.error('Please select a client');
      this.toastr.error('Please select a client', 'Error');
      return;
    }

    const formData = new FormData();
    formData.append('projectName', this.projectName);
    formData.append('buildingName', this.buildingName);
    this.subProjects = this.addedTags.length > 0 ? this.addedTags : ['Default SubProject'];
    formData.append('subProjects', JSON.stringify(this.subProjects));
    const address = {
      line1: this.addressLine1,
      line2: this.addressLine2,
      city: this.city,
      state: this.state,
      zip: this.zip
    };
    formData.append('address', JSON.stringify(address));
    formData.append('projectStatus', this.selectedOption || 'Active');
    formData.append('hierarchyLevelsChange', this.hierarchyLevelsChange ? 'true' : 'false');
    formData.append('clientId', this.clientId);
    formData.append('clientName', this.selectedOption7);
    formData.append('contactPerson', this.clientContactPerson);
    formData.append('clientPhone', this.clientPhone);
    formData.append('subcontractorName', this.subcontractorName);
    formData.append('subcontractorContactPerson', this.subcontractorContactPerson);
    formData.append('subcontractorPhone', this.subcontractorPhone);
    formData.append('createdBy', '67ef70ab80a38894337f7740');
    formData.append('approvalDocuments', JSON.stringify(this.selectedApprovalDocuments));

    if (this.imageFile) {
      formData.append('image', this.imageFile, this.imageFile.name);
    }

    console.log('Form data entries:');
    const payload: any = {};
    formData.forEach((value, key) => {
      payload[key] = value;
      console.log(`${key}: ${value}`);
    });
    console.log('Submitting form data:', payload);

    this.createprojectService.submitFormData(formData).subscribe({
      next: (response) => {
        if (response && response.project && response.project._id) {
          console.log('API Response:', response);
          localStorage.setItem('projectId', response.project._id);
          this.projectId = response.project._id;
          localStorage.removeItem('projectFormData');
          this.toastr.success('Project attributes submitted successfully', 'Success');
          setTimeout(() => {
            const standardsTab = document.getElementById('standards-tab');
            if (standardsTab) {
              (standardsTab as HTMLElement).click();
            }
          }, 0);
        } else {
          console.error('Project ID not found in response');
          this.toastr.error('Project ID not found in response', 'Error');
        }
      },
      error: (error) => {
        console.error('API Error:', error);
        this.toastr.error('Failed to submit project attributes', 'Error');
      }
    });
  }

  setDefaultTemplate(event: Event) {
    this.isDefaultTemplate = (event.target as HTMLInputElement).checked;
    this.saveFormData();
  }

  addBarrierValue(index: number) {
    if (index === -1) {
      if (this.attributeType === 'string') {
        if (this.barrierInput.trim()) {
          this.barrierValues = [this.barrierInput.trim()];
          this.barrierInput = '';
        }
      } else if (this.attributeType === 'list' && this.barrierInput.trim() && !this.barrierValues.includes(this.barrierInput)) {
        this.barrierValues.push(this.barrierInput.trim());
        this.barrierInput = '';
      }
    } else {
      const attr = this.additionalAttributes[index];
      if (attr.type === 'string') {
        if (attr.barrierInput.trim()) {
          attr.barrierValues = [attr.barrierInput.trim()];
          attr.barrierInput = '';
        }
      } else if (attr.type === 'list' && attr.barrierInput.trim() && !attr.barrierValues.includes(attr.barrierInput)) {
        attr.barrierValues.push(attr.barrierInput.trim());
        attr.barrierInput = '';
      }
    }
  }

  removeBarrierValue(index: number, attrIndex: number) {
    if (attrIndex === -1) {
      this.barrierValues.splice(index, 1);
    } else {
      this.additionalAttributes[attrIndex].barrierValues.splice(index, 1);
    }
  }

  addAttribute() {
    this.additionalAttributes.push({
      name: '',
      type: 'string',
      barrierInput: '',
      barrierValues: [],
      editableInBackOffice: false,
      hideForMobile: false,
      isConditional: false,
      productId: '',
      approvalDocumentId: '',
      filteredApprovalDocuments: [],
      selectedApprovalDocuments: []
    });
    this.isDropdownOpenAttrType.push(false);
    this.isDropdownOpenAttrProduct.push(false);
    this.isDropdownOpenAttrApproval.push(false);
  }

  removeAttribute(index: number) {
    this.additionalAttributes.splice(index, 1);
    this.isDropdownOpenAttrType.splice(index, 1);
    this.isDropdownOpenAttrProduct.splice(index, 1);
    this.isDropdownOpenAttrApproval.splice(index, 1);
  }

  toggleCheckbox(attrIndex: number, property: keyof Pick<Attribute, 'editableInBackOffice' | 'hideForMobile' | 'isConditional'>, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    if (attrIndex === -1) {
      this.mainAttribute[property] = checked;
      if (property === 'isConditional' && checked) {
        this.onConditionalProductChange(-1);
      }
    } else {
      this.additionalAttributes[attrIndex][property] = checked;
      if (property === 'isConditional' && checked) {
        this.onConditionalProductChange(attrIndex);
      }
    }
  }

  submitStandardAttributes() {
    const standardAttributes: StandardAttribute[] = [];

    if (this.attributeName && (this.attributeType === 'string' || this.barrierValues.length > 0)) {
      standardAttributes.push({
        name: this.attributeName,
        type: this.attributeType,
        value: this.attributeType === 'string' ? (this.barrierValues[0] || '') : this.barrierValues,
        editableBackOffice: this.mainAttribute.editableInBackOffice,
        hideForMobileUser: this.mainAttribute.hideForMobile,
        conditionalAttribute: {
          isEnabled: this.mainAttribute.isConditional,
          productId: this.mainAttribute.productId,
          approvalDocumentId: this.mainAttribute.selectedApprovalDocuments?.join(',') || ''
        }
      });
    }

    this.additionalAttributes.forEach((attr, index) => {
      if (attr.name && (attr.type === 'string' || attr.barrierValues.length > 0)) {
        standardAttributes.push({
          name: attr.name,
          type: attr.type || 'string',
          value: attr.type === 'string' ? (attr.barrierValues[0] || '') : attr.barrierValues,
          editableBackOffice: attr.editableInBackOffice,
          hideForMobileUser: attr.hideForMobile,
          conditionalAttribute: {
            isEnabled: attr.isConditional,
            productId: attr.productId,
            approvalDocumentId: attr.selectedApprovalDocuments?.join(',') || ''
          }
        });
      }
    });

    if (standardAttributes.length === 0) {
      console.error('No valid attributes provided');
      this.toastr.error('No valid attributes provided', 'Error');
      return;
    }

    if (!this.productId) {
      console.error('No product selected');
      this.toastr.error('No product selected', 'Error');
      return;
    }

    if (this.selectedApprovalDocuments.length === 0) {
      console.error('No approval documents selected');
      this.toastr.error('No approval documents selected', 'Error');
      return;
    }

    let projectId = this.projectId || localStorage.getItem('projectId');
    if (!projectId || !/^[0-9a-fA-F]{24}$/.test(projectId)) {
      console.error('Invalid projectId for submitting standard attributes:', projectId);
      this.toastr.error('Invalid project ID', 'Error');
      return;
    }

    const payload = {
      projectId: projectId,
      templateName: this.templateName,
      isDefaultTemplate: this.isDefaultTemplate,
      productId: this.productId,
      approvalDocumentIds: this.selectedApprovalDocuments,
      assignedEmployees: this.selectedDocuments5.length > 0
        ? this.selectedDocuments5.map(name => {
          const employee = this.employees.find(emp => emp.name === name);
          return employee ? employee.id : '67ef74d7ca67900789f2387d';
        })
        : ['67ef74d7ca67900789f2387d'],
      attributes: standardAttributes,
      subProjects: this.subProjects
    };

    console.log('Submitting standard attributes:', payload);

    this.createprojectService.createStandardAttribute(payload).subscribe({
      next: (response) => {
        console.log(response);
        this.attributeName = '';
        this.attributeType = 'string';
        this.barrierValues = [];
        this.barrierInput = '';
        this.mainAttribute = {
          name: '',
          type: 'string',
          barrierInput: '',
          barrierValues: [],
          editableInBackOffice: false,
          hideForMobile: false,
          isConditional: false,
          productId: '',
          approvalDocumentId: '',
          filteredApprovalDocuments: [],
          selectedApprovalDocuments: []
        };
        this.additionalAttributes = [];
        this.selectedDocuments5 = [];
        this.productId = '';
        this.approvalDocumentId = '';
        this.selectedApprovalDocuments = [];
        this.filteredApprovalDocuments = [];
        this.templateName = 'Installation/Penetration Register';
        this.selectedOptionli = { label: 'Installation/Penetration Register', value: 'option4' };
        this.toastr.success('Standard attributes submitted successfully', 'Success');

        setTimeout(() => {
          const buildingHierarchyTab = document.getElementById('building-hierarchy-tab');
          if (buildingHierarchyTab) {
            (buildingHierarchyTab as HTMLElement).click();
          }
        }, 0);
      },
      error: (error) => {
        console.error('API Error:', error);
        this.toastr.error('Failed to submit standard attributes', 'Error');
      }
    });
  }

  switchTab(tabId: string) {
    const tabElement = document.getElementById(`${tabId}-tab`);
    if (tabElement) {
      tabElement.click();
      console.log(`Switched to tab: ${tabId}`);

      this.activeTab = tabId;
      this.updateIndicatorPosition(tabElement as HTMLElement);

      if (tabId === 'uploadDocuments') {
        console.log('Switching to uploadDocuments tab, clearing and loading documents');
        this.twoDFiles = [];
        this.technicalFiles = [];
        this.additionalFiles = [];
        this.loadHierarchyLevels();
        this.fetchDocuments();
      } else if (tabId === 'reports') {
        console.log('Switching to reports tab, fetching project reports and attributes');
        this.fetchProjectReports();
        this.fetchStandardAttributes();
      }
    } else {
      console.warn(`Tab with id ${tabId}-tab not found`);
    }
  }

  @Input() documentName: string = 'Document Name';
  @Input() progress: number = 25;
  @Input() hierarchyLevel: string = 'Hierarchy Level';

  fetchStandardAttributes() {
    const projectId = this.projectId || localStorage.getItem('projectId');
    if (!projectId || !/^[0-9a-fA-F]{24}$/.test(projectId)) {
      console.error('Invalid or missing projectId for fetching standard attributes:', projectId);
      this.standardAttributes = null;
      return;
    }

    console.log('Fetching standard attributes for project:', projectId);
    this.isLoadingAttributes = true;
    this.createprojectService.getStandardAttributes(projectId).subscribe({
      next: (response) => {
        this.standardAttributes = response.data || null;
        if (this.standardAttributes?.attributes) {
          this.existingAttributes = this.standardAttributes.attributes.map((attr: any) => ({
            name: attr.name,
            type: attr.type,
            barrierInput: '',
            barrierValues: Array.isArray(attr.value) ? [...attr.value] : [attr.value || ''],
            editableInBackOffice: attr.editableBackOffice,
            hideForMobile: attr.hideForMobileUser,
            isConditional: attr.conditionalAttribute.isEnabled,
            productId: attr.conditionalAttribute.productId,
            approvalDocumentId: attr.conditionalAttribute.approvalDocumentId,
            filteredApprovalDocuments: [],
            selectedApprovalDocuments: []
          }));
          this.existingAttributes.forEach((attr, index) => {
            if (attr.isConditional && attr.productId) {
              this.http.get(`https://vps.allpassiveservices.com.au/api/product/list`).subscribe({
                next: (response: any) => {
                  const selectedProduct = response.find((product: any) => product._id === attr.productId);
                  if (selectedProduct && selectedProduct.approvalDocuments) {
                    this.existingAttributes[index].filteredApprovalDocuments = selectedProduct.approvalDocuments.map((doc: any) => ({
                      id: doc._id,
                      name: doc.name
                    }));
                  } else {
                    this.existingAttributes[index].filteredApprovalDocuments = [];
                  }
                },
                error: (error) => {
                  console.error(`Failed to fetch approval documents for existing attribute ${attr.productId}:`, error);
                  this.existingAttributes[index].filteredApprovalDocuments = [];
                }
              });
            }
          });
        }
        console.log('Successfully fetched standard attributes:', this.standardAttributes);
        this.isLoadingAttributes = false;
        if (Object.keys(this.selectedFields).length > 0) {
          this.standardAttributes.attributes.forEach((attr: any) => {
            if (!this.selectedFields.hasOwnProperty(attr.name)) {
              this.selectedFields[attr.name] = false;
            }
          });
        }
        this.isLoadingAttributes = false;
      },
      error: (error) => {
        console.error('Error fetching standard attributes:', error);
        this.standardAttributes = null;
        this.isLoadingAttributes = false;
      }
    });
  }

  goToReportsTab() {
    this.switchTab('reports');
  }

  saveFormDataBeforeNavigation() {
    const formData = {
      projectName: this.projectName,
      buildingName: this.buildingName,
      clientName: this.clientName,
      addressLine1: this.addressLine1,
      addressLine2: this.addressLine2,
      city: this.city,
      state: this.state,
      zip: this.zip,
      selectedReportType: this.selectedReportType,
      selectedFields: this.selectedFields,
      selectedApprovalDocuments: this.selectedApprovalDocuments
    };
    localStorage.setItem('createProjectFormData', JSON.stringify(formData));
  }


  restoreFormData() {
    const savedData = localStorage.getItem('createProjectFormData');
    if (savedData) {
      const formData = JSON.parse(savedData);
      this.projectName = formData.projectName;
      this.buildingName = formData.buildingName;
      this.clientName = formData.clientName;
      this.addressLine1 = formData.addressLine1;
      this.addressLine2 = formData.addressLine2;
      this.city = formData.city;
      this.state = formData.state;
      this.zip = formData.zip;
      this.selectedReportType = formData.selectedReportType;
      this.selectedFields = formData.selectedFields;
      this.selectedApprovalDocuments = formData.selectedApprovalDocuments || [];
    }
  }

  loadTemplateAttributes() {
    this.existingAttributes = [...this.predefinedTemplates[this.templateName] || []];
    this.attributeName = this.existingAttributes[0]?.name || '';
    this.attributeType = this.existingAttributes[0]?.type || 'string';
    this.barrierValues = [...(this.existingAttributes[0]?.barrierValues || [])];
    this.mainAttribute = {
      name: this.attributeName,
      type: this.attributeType,
      barrierInput: '',
      barrierValues: this.barrierValues,
      editableInBackOffice: this.existingAttributes[0]?.editableInBackOffice || false,
      hideForMobile: this.existingAttributes[0]?.hideForMobile || false,
      isConditional: this.existingAttributes[0]?.isConditional || false,
      productId: this.existingAttributes[0]?.productId || '',
      approvalDocumentId: this.existingAttributes[0]?.approvalDocumentId || '',
      filteredApprovalDocuments: [],
      selectedApprovalDocuments: []
    };
    this.additionalAttributes = this.existingAttributes.slice(1).map(attr => ({
      ...attr,
      filteredApprovalDocuments: [],
      selectedApprovalDocuments: []
    }));
    if (this.mainAttribute.isConditional && this.mainAttribute.productId) {
      this.onConditionalProductChange(-1);
    }
    this.additionalAttributes.forEach((attr, index) => {
      if (attr.isConditional && attr.productId) {
        this.onConditionalProductChange(index);
      }
    });
    console.log('Loaded template attributes for:', this.templateName, this.existingAttributes);
  }
}