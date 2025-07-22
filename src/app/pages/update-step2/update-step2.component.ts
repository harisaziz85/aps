import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../components/navbar/navbar.component';
import { TopbarComponent } from '../components/topbar/topbar.component';
import { FootComponent } from '../components/foot/foot.component';

interface Attribute {
  name: string;
  type: string;
  values: string[];
  editableBackOffice: boolean;
  hideForMobileUser: boolean;
  conditionalAttribute: {
    isEnabled: boolean;
    approvalDocumentIds: string[];
  };
  _id?: string;
  barrierInput?: string;
  barrierValues?: string[];
  editableInBackOffice?: boolean;
  hideForMobile?: boolean;
  isConditional?: boolean;
  productId?: string;
  approvalDocumentId?: string;
  filteredApprovalDocuments?: any[];
  selectedApprovalDocuments?: any[];
}

interface StandardAttribute {
  _id: string;
  projectId: string;
  templateName: string;
  approvalDocumentIds: string[];
  productId: string;
  assignedEmployees: string[];
  attributes: {
    name: string;
    type: string;
    value: string | string[];
    editableBackOffice: boolean;
    hideForMobileUser: boolean;
    conditionalAttribute: {
      isEnabled: boolean;
      approvalDocumentIds: string[];
    };
    _id?: string;
  }[];
  createdAt: string;
  updatedAt: string;
  __v: number;
  subProjects?: string[];
}

interface HierarchyLevel {
  name: string;
  _id: string;
}

interface Hierarchy {
  _id: string;
  projectId: string;
  levels: HierarchyLevel[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface DownloadProject {
  project: {
    _id: string;
    projectName: string;
    buildingName: string;
    address: {
      line1: string;
      line2: string;
      city: string;
      state: string;
      zip: string;
    };
    projectAdministration: {
      projectStatus: string;
      hierarchyLevelsChange: boolean;
    };
    subcontractorInfo: {
      name: string;
      contactPerson: string;
      phone: string;
    };
    clientInfo: {
      clientId: {
        _id: string;
        name: string;
        email: string;
        phone: string;
        address: string;
        clientProfile: string;
        __v: number;
      };
      name: string;
      contactPerson: string;
      phone: string;
    };
    imageUrl: string;
    subProjects: string[];
    submittedForApprovalBy: string[];
    isArchive: boolean;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    __v: number;
  };
  hierarchy: Hierarchy;
  standardAttributes: StandardAttribute[];
  instances: any[];
  documents: any[];
  reports: any[];
  jobNotes: any[];
}

interface ApprovalDocument {
  _id: string;
  name: string;
  fileUrl: string;
  createdAt: string;
  __v: number;
}

interface Product {
  _id: string;
  name: string;
  approvalDocuments: ApprovalDocument[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface Employee {
  _id: string;
  name: string;
  username: string;
  password: string;
  email: string;
  phone: string;
  employeeId: string;
  profilePic: string;
  userType: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface AttributeResponse {
  message: string;
  data: StandardAttribute;
}

@Component({
  selector: 'app-update-step2',
  standalone: true,
  templateUrl: './update-step2.component.html',
  styleUrls: ['./update-step2.component.css'],
  imports: [CommonModule, FormsModule, NavbarComponent, TopbarComponent, FootComponent]
})
export class UpdateStep2Component implements OnInit {
  projectId: string | null = null;
  projectData: DownloadProject | null = null;
  errorMessage: string | null = null;
  selectedTemplate: string = '';
  selectedProductId: string = '';
  selectedApprovalDocumentIds: string[] = [];
  selectedEmployeeIds: string[] = [];
  templateOptions: string[] = ['Penetration', 'Fire Dampers', 'Annual Inspection', 'Scoping', 'Installation/Penetration Register', 'Third Party Certification'];
  products: Product[] = [];
  employees: Employee[] = [];
  isTemplateDropdownOpen: boolean = false;
  isProductDropdownOpen: boolean = false;
  isApprovalDropdownOpen: boolean = false;
  isEmployeeDropdownOpen: boolean = false;
  attributes: Attribute[] = [];
  newAttributeValues: string[] = [];

  predefinedTemplates: { [key: string]: Attribute[] } = {
    'Scoping': [
      { name: 'Barrier', type: 'list', barrierInput: '', barrierValues: ['Bulkhead', 'Ceiling', 'Floor', 'Wall', 'Riser'], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] }, values: [], productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Services', type: 'list', barrierInput: '', barrierValues: ['2 Pex Pipes', '1 PVC Pipes', '3 Copper Pipes'], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] }, values: [], productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Materials', type: 'string', barrierInput: '', barrierValues: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] }, values: [], productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'FRL', type: 'list', barrierInput: '', barrierValues: ['-/120-', '-/120/120', '-180/180', '-/60/60', '-/240/240', '-90/90', 'Smoke'], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] }, values: [], productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Location', type: 'string', barrierInput: '', barrierValues: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] }, values: [], productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Comments', type: 'string', barrierInput: '', barrierValues: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] }, values: [], productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Date', type: 'string', barrierInput: '', barrierValues: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] }, values: [], productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Inspector', type: 'string', barrierInput: '', barrierValues: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] }, values: [], productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Notes', type: 'string', barrierInput: '', barrierValues: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] }, values: [], productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Time', type: 'string', barrierInput: '', barrierValues: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] }, values: [], productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Price', type: 'string', barrierInput: '', barrierValues: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] }, values: [], productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Additional Requirements', type: 'string', barrierInput: '', barrierValues: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] }, values: [], productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] }
    ],
    'Annual Inspection': [
      { name: 'Services', type: 'string', barrierInput: '', barrierValues: ['2 Pex Pipes', '1 PVC Pipes', '3 Copper Pipes'], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] }, values: [], productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Materials', type: 'string', barrierInput: '', barrierValues: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] }, values: [], productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Barrier', type: 'string', barrierInput: '', barrierValues: ['Bulkhead', 'Ceiling', 'Floor', 'Wall', 'Riser'], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] }, values: [], productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'FRL', type: 'string', barrierInput: '', barrierValues: ['-/120-', '-/120/120', '-180/180', '-/60/60', '-/240/240', '-90/90', 'Smoke'], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] }, values: [], productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Location', type: 'string', barrierInput: '', barrierValues: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] }, values: [], productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Comments', type: 'string', barrierInput: '', barrierValues: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] }, values: [], productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Safety Measures', type: 'string', barrierInput: '', barrierValues: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] }, values: [], productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Relevance to Building Code', type: 'string', barrierInput: '', barrierValues: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] }, values: [], productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Compliance', type: 'string', barrierInput: '', barrierValues: ['Pass', 'Fail'], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] }, values: [], productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Date Inspected', type: 'string', barrierInput: '', barrierValues: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] }, values: [], productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Inspector', type: 'string', barrierInput: '', barrierValues: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] }, values: [], productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Date', type: 'string', barrierInput: '', barrierValues: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] }, values: [], productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Time', type: 'string', barrierInput: '', barrierValues: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] }, values: [], productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Price', type: 'string', barrierInput: '', barrierValues: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] }, values: [], productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] }
    ],
    'Fire Dampers': [
      { name: 'FD No.', type: 'list', barrierInput: '', barrierValues: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] }, values: [], productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Location', type: 'list', barrierInput: '', barrierValues: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] }, values: [], productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Year Inspected', type: 'string', barrierInput: '', barrierValues: ['2025', '2026', '2027', '2028', '2029'], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] }, values: [], productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Inspection Date', type: 'string', barrierInput: '', barrierValues: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] }, values: [], productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Damper Accessible', type: 'string', barrierInput: '', barrierValues: ['Yes', 'No'], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] }, values: [], productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Damper Closes and fusable link ok', type: 'string', barrierInput: '', barrierValues: ['Yes', 'No'], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] }, values: [], productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Damper Installed Correctly', type: 'string', barrierInput: '', barrierValues: ['Yes', 'No'], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] }, values: [], productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Flanges or Retaining Angles Correct', type: 'string', barrierInput: '', barrierValues: ['Yes', 'No'], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] }, values: [], productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Barrier', type: 'string', barrierInput: '', barrierValues: ['Bulkhead', 'Ceiling', 'Floor', 'Wall', 'Riser'], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] }, values: [], productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'FRL', type: 'string', barrierInput: '', barrierValues: ['-/120-', '-/120/120', '-180/180', '-/60/60', '-/240/240', '-90/90', 'Smoke'], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] }, values: [], productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Substrate Type', type: 'string', barrierInput: '', barrierValues: ['Concrete Wall', 'Masonry Wall', 'Dincel', 'Hebel Wall', 'Fire Rated Plasterboard Wall', 'Speedpanel Wall', 'Hebel Powerpanel Wall'], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] }, values: [], productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Penetration Compliant', type: 'string', barrierInput: '', barrierValues: ['Yes', 'No'], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] }, values: [], productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Breakaway Connection', type: 'string', barrierInput: '', barrierValues: ['Yes', 'No'], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] }, values: [], productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Damper free from Corrosion', type: 'string', barrierInput: '', barrierValues: ['Yes', 'No'], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] }, values: [], productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Is this damper installed correctly', type: 'string', barrierInput: '', barrierValues: ['Yes', 'No'], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] }, values: [], productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Comments', type: 'string', barrierInput: '', barrierValues: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] }, values: [], productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Date of Repairs', type: 'string', barrierInput: '', barrierValues: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] }, values: [], productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] }
    ],
    'Installation/Penetration Register': [
      { name: 'Test ID', type: 'string', barrierInput: '', barrierValues: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] }, values: [], productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Sticker Number', type: 'string', barrierInput: '', barrierValues: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] }, values: [], productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Services', type: 'string', barrierInput: '', barrierValues: ['2 Pex Pipes', '1 PVC Pipes', '3 Copper Pipes'], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] }, values: [], productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Materials', type: 'string', barrierInput: '', barrierValues: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] }, values: [], productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Barrier', type: 'string', barrierInput: '', barrierValues: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] }, values: [], productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'FRL', type: 'string', barrierInput: '', barrierValues: ['-/120-', '-/120/120', '-180/180', '-/60/60', '-/240/240', '-90/90', 'Smoke'], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] }, values: [], productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Reference to Building Code', type: 'string', barrierInput: '', barrierValues: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] }, values: [], productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Location', type: 'string', barrierInput: '', barrierValues: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] }, values: [], productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Compliance', type: 'string', barrierInput: '', barrierValues: ['Pass', 'Fail'], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] }, values: [], productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Comments', type: 'string', barrierInput: '', barrierValues: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] }, values: [], productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Date', type: 'string', barrierInput: '', barrierValues: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] }, values: [], productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] }
    ],
    'Third Party Certification': [
      { name: 'Test ID', type: 'string', barrierInput: '', barrierValues: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] }, values: [], productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Sticker Number', type: 'string', barrierInput: '', barrierValues: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] }, values: [], productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Services', type: 'string', barrierInput: '', barrierValues: ['2 Pex Pipes', '1 PVC Pipes', '3 Copper Pipes'], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] }, values: [], productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Materials', type: 'string', barrierInput: '', barrierValues: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] }, values: [], productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Barrier', type: 'string', barrierInput: '', barrierValues: ['Bulkhead', 'Ceiling', 'Floor', 'Wall', 'Riser'], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] }, values: [], productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'FRL', type: 'string', barrierInput: '', barrierValues: ['-/120-', '-/120/120', '-180/180', '-/60/60', '-/240/240', '-90/90', 'Smoke'], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] }, values: [], productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Location', type: 'string', barrierInput: '', barrierValues: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] }, values: [], productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Comments', type: 'string', barrierInput: '', barrierValues: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] }, values: [], productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Trade', type: 'string', barrierInput: '', barrierValues: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] }, values: [], productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Compliance', type: 'string', barrierInput: '', barrierValues: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] }, values: [], productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Date Inspected', type: 'string', barrierInput: '', barrierValues: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] }, values: [], productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Inspector', type: 'string', barrierInput: '', barrierValues: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] }, values: [], productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Notes', type: 'string', barrierInput: '', barrierValues: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] }, values: [], productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Time', type: 'string', barrierInput: '', barrierValues: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] }, values: [], productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] },
      { name: 'Price', type: 'string', barrierInput: '', barrierValues: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] }, values: [], productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [] }
    ]
  };

  private apiUrl = 'https://vps.allpassiveservices.com.au/api/project/download/';
  private attributesApiUrl = 'https://vps.allpassiveservices.com.au/api/project/attributes/';
  private updateApiUrl = 'https://vps.allpassiveservices.com.au/api/updateProject/standard-attribute/';
  private productApiUrl = 'https://vps.allpassiveservices.com.au/api/product/list';
  private employeeApiUrl = 'https://vps.allpassiveservices.com.au/api/employees';
emp: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.projectId = params['id'] || null;
      if (this.projectId) {
        this.fetchProjectData(this.projectId);
        this.fetchProducts();
        this.fetchEmployees();
      } else {
        this.errorMessage = 'No project ID provided in route';
      }
    });
  }

  private fetchProjectData(projectId: string) {
    this.http.get<AttributeResponse>(`${this.attributesApiUrl}${projectId}`).subscribe({
      next: (response) => {
        console.log('Attributes Data:', response);
        const standardAttribute = response.data;
        this.projectData = {
          project: {} as any,
          hierarchy: {} as any,
          standardAttributes: [standardAttribute],
          instances: [],
          documents: [],
          reports: [],
          jobNotes: []
        };
        this.initializeForm(standardAttribute);
      },
      error: (error) => {
        console.error('Error fetching attributes data:', error);
        this.http.get<DownloadProject>(`${this.apiUrl}${projectId}`).subscribe({
          next: (data: DownloadProject) => {
            console.log('Project Data:', data);
            this.projectData = data;
            const standardAttribute = data.standardAttributes?.[0] || null;
            this.initializeForm(standardAttribute);
          },
          error: (error) => {
            console.error('Error fetching project data:', error);
            this.errorMessage = 'Failed to load project data';
          }
        });
      }
    });
  }

  private initializeForm(standardAttribute: StandardAttribute | null) {
    if (standardAttribute) {
      this.selectedTemplate = standardAttribute.templateName || '';
      this.selectedProductId = standardAttribute.productId || '';
      this.selectedApprovalDocumentIds = standardAttribute.approvalDocumentIds || [];
      this.selectedEmployeeIds = standardAttribute.assignedEmployees || [];
      this.attributes = this.initializeAttributes(standardAttribute);
      this.newAttributeValues = new Array(this.attributes.length).fill('');
    } else {
      this.selectedTemplate = '';
      this.selectedProductId = '';
      this.selectedApprovalDocumentIds = [];
      this.selectedEmployeeIds = [];
      this.attributes = [];
      this.newAttributeValues = [];
    }
  }

  private initializeAttributes(standardAttribute: StandardAttribute | null): Attribute[] {
    if (standardAttribute?.attributes?.length) {
      return standardAttribute.attributes.map(attr => ({
        name: attr.name,
        type: attr.type,
        values: Array.isArray(attr.value) ? attr.value.filter(val => val != null && val !== '') : (typeof attr.value === 'string' && attr.value ? [attr.value] : []),
        barrierInput: typeof attr.value === 'string' ? attr.value : '',
        barrierValues: Array.isArray(attr.value) ? attr.value.filter(val => val != null && val !== '') : [],
        editableBackOffice: attr.editableBackOffice || false,
        hideForMobileUser: attr.hideForMobileUser || false,
        conditionalAttribute: attr.conditionalAttribute || { isEnabled: false, approvalDocumentIds: [] },
        _id: attr._id,
        productId: '',
        approvalDocumentId: '',
        filteredApprovalDocuments: [],
        selectedApprovalDocuments: []
      }));
    }
    return this.predefinedTemplates[this.selectedTemplate]?.map(attr => ({
      ...attr,
      values: [...(attr.barrierValues || [])],
      barrierInput: attr.barrierInput || '',
      barrierValues: attr.barrierValues || [],
      editableBackOffice: attr.editableBackOffice || false,
      hideForMobileUser: attr.hideForMobileUser || false,
      conditionalAttribute: attr.conditionalAttribute || { isEnabled: false, approvalDocumentIds: [] },
      productId: attr.productId || '',
      approvalDocumentId: attr.approvalDocumentId || '',
      filteredApprovalDocuments: attr.filteredApprovalDocuments || [],
      selectedApprovalDocuments: attr.selectedApprovalDocuments || []
    })) || [];
  }

  private fetchProducts() {
    this.http.get<Product[]>(this.productApiUrl).subscribe({
      next: (products) => {
        this.products = products || [];
      },
      error: (error) => {
        console.error('Error fetching products:', error);
        this.products = [];
        this.errorMessage = 'Failed to load products';
      }
    });
  }

  private fetchEmployees() {
    this.http.get<Employee[]>(this.employeeApiUrl).subscribe({
      next: (employees) => {
        this.employees = employees || [];
      },
      error: (error) => {
        console.error('Error fetching employees:', error);
        this.employees = [];
        this.errorMessage = 'Failed to load employees';
      }
    });
  }

  toggleTemplateDropdown() {
    this.isTemplateDropdownOpen = !this.isTemplateDropdownOpen;
    this.isProductDropdownOpen = false;
    this.isApprovalDropdownOpen = false;
    this.isEmployeeDropdownOpen = false;
  }

  toggleProductDropdown() {
    this.isProductDropdownOpen = !this.isProductDropdownOpen;
    this.isTemplateDropdownOpen = false;
    this.isApprovalDropdownOpen = false;
    this.isEmployeeDropdownOpen = false;
  }

  toggleApprovalDropdown() {
    this.isApprovalDropdownOpen = !this.isApprovalDropdownOpen;
    this.isTemplateDropdownOpen = false;
    this.isProductDropdownOpen = false;
    this.isEmployeeDropdownOpen = false;
  }

  toggleEmployeeDropdown() {
    this.isEmployeeDropdownOpen = !this.isEmployeeDropdownOpen;
    this.isTemplateDropdownOpen = false;
    this.isProductDropdownOpen = false;
    this.isApprovalDropdownOpen = false;
  }

  selectTemplate(template: string) {
    this.selectedTemplate = template;
    this.isTemplateDropdownOpen = false;
    this.attributes = this.predefinedTemplates[template]?.map(attr => ({
      ...attr,
      values: [...(attr.barrierValues || [])],
      barrierInput: attr.barrierInput || '',
      barrierValues: attr.barrierValues || [],
      editableBackOffice: attr.editableBackOffice || false,
      hideForMobileUser: attr.hideForMobileUser || false,
      conditionalAttribute: attr.conditionalAttribute || { isEnabled: false, approvalDocumentIds: [] },
      productId: attr.productId || '',
      approvalDocumentId: attr.approvalDocumentId || '',
      filteredApprovalDocuments: attr.filteredApprovalDocuments || [],
      selectedApprovalDocuments: attr.selectedApprovalDocuments || []
    })) || [];
    this.newAttributeValues = new Array(this.attributes.length).fill('');
  }

  selectProduct(productId: string) {
    this.selectedProductId = productId;
    this.selectedApprovalDocumentIds = [];
    this.isProductDropdownOpen = false;
  }

  toggleApprovalDocument(documentId: string) {
    if (this.selectedApprovalDocumentIds.includes(documentId)) {
      this.selectedApprovalDocumentIds = this.selectedApprovalDocumentIds.filter(id => id !== documentId);
    } else {
      this.selectedApprovalDocumentIds = [...this.selectedApprovalDocumentIds, documentId];
    }
  }

  toggleEmployee(employeeId: string) {
    if (this.selectedEmployeeIds.includes(employeeId)) {
      this.selectedEmployeeIds = this.selectedEmployeeIds.filter(id => id !== employeeId);
    } else {
      this.selectedEmployeeIds = [...this.selectedEmployeeIds, employeeId];
    }
  }

  getProductName(productId: string): string {
    const product = this.products.find(p => p._id === productId);
    return product ? product.name : 'Select a product';
  }

  getApprovalDocumentNames(): string {
    if (!this.selectedProductId) return 'Select a product first';
    const product = this.products.find(p => p._id === this.selectedProductId);
    if (!product || !product.approvalDocuments || product.approvalDocuments.length === 0) {
      return 'No approval documents available';
    }
    const selectedNames = product.approvalDocuments
      .filter(doc => this.selectedApprovalDocumentIds.includes(doc._id))
      .map(doc => doc.name);
    return selectedNames.length > 0 ? selectedNames.join(', ') : 'Select approval documents';
  }

  getFilteredApprovalDocuments(): ApprovalDocument[] {
    const product = this.products.find(p => p._id === this.selectedProductId);
    return product && product.approvalDocuments ? product.approvalDocuments : [];
  }

  isApprovalDocumentSelected(documentId: string): boolean {
    return this.selectedApprovalDocumentIds.includes(documentId);
  }

  getSelectedEmployeeNames(): string[] {
    return this.employees
      .filter(emp => this.selectedEmployeeIds.includes(emp._id))
      .map(emp => emp.name);
  }
removeEmployeeByName(name: string) {
  const employee = this.employees.find(emp => emp.name === name);
  if (employee) {
    this.toggleEmployee(employee._id);
  }
}
  isEmployeeSelected(employeeId: string): boolean {
    return this.selectedEmployeeIds.includes(employeeId);
  }

  addAttributeValue(index: number) {
    if (this.newAttributeValues[index] && this.attributes[index]) {
      this.attributes[index].values = [...(this.attributes[index].values || []), this.newAttributeValues[index]];
      this.newAttributeValues[index] = '';
      this.newAttributeValues = [...this.newAttributeValues];
    }
  }

  removeAttribute(index: number) {
    if (this.attributes[index].name !== 'FD No.' || index !== 0) {
      this.attributes.splice(index, 1);
      this.newAttributeValues.splice(index, 1);
      this.newAttributeValues = [...this.newAttributeValues];
    }
  }

  removeAttributeValue(attrIndex: number, valueIndex: number) {
    if (this.attributes[attrIndex]?.values) {
      this.attributes[attrIndex].values.splice(valueIndex, 1);
      this.attributes = [...this.attributes];
    }
  }

  saveAndNext() {
    if (this.projectId && this.projectData?.standardAttributes?.[0]?._id) {
      const payload = {
        projectId: this.projectId,
        templateName: this.selectedTemplate,
        approvalDocumentIds: this.selectedApprovalDocumentIds,
        productId: this.selectedProductId,
        assignedEmployees: this.selectedEmployeeIds,
        attributes: this.attributes.map(attr => ({
          name: attr.name,
          type: attr.type,
          value: attr.type === 'list' ? attr.values : attr.values[0] || '',
          editableBackOffice: attr.editableBackOffice || false,
          hideForMobileUser: attr.hideForMobileUser || false,
          conditionalAttribute: attr.conditionalAttribute || { isEnabled: false, approvalDocumentIds: [] },
          _id: attr._id
        }))
      };

      this.http.put(`${this.updateApiUrl}${this.projectData.standardAttributes[0]._id}`, payload).subscribe({
        next: (response) => {
          console.log('Template updated successfully:', response);
          this.router.navigate(['/pages/updateproject3', this.projectId]);
        },
        error: (error) => {
          console.error('Error updating template:', error);
          this.errorMessage = error.error?.message || 'Failed to update template';
        }
      });
    } else {
      this.errorMessage = 'Project ID or standard attributes are missing';
    }
  }
}