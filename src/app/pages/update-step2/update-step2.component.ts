import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from "../components/navbar/navbar.component";
import { TopbarComponent } from '../components/topbar/topbar.component';
import { FootComponent } from "../components/foot/foot.component";

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
  attributes: Attribute[];
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
  serviceProjectId: string | null = null;
  projectData: DownloadProject | null = null;
  errorMessage: string | null = null;
  selectedTemplate: string = '';
  selectedProductId: string = '';
  selectedProductNameId: string = '';
  selectedApprovalDocumentIds: string[] = [];
  selectedEmployeeIds: string[] = [];
  templateOptions: string[] = ['Penetration', 'Joints', 'Fire Dampers', 'Fire Doors', 'Fire Windows', 'Service Penetration', 'Annual Inspection', 'Scoping', 'Installation/Penetration Register', 'Third Party Certification'];
  products: Product[] = [];
  employees: Employee[] = [];
  isTemplateDropdownOpen: boolean = false;
  isProductDropdownOpen: boolean = false;
  isApprovalDropdownOpen: boolean = false;
  isEmployeeDropdownOpen: boolean = false;
  isProductNameDropdownOpen: boolean = false;
  attributes: Attribute[] = [];
  newAttributeValues: string[] = [];

  predefinedTemplates: { [key: string]: Attribute[] } = {
    'Scoping': [
      { name: 'Barrier', type: 'string', barrierInput: '', barrierValues: ['Bulkhead', 'Ceiling', 'Floor', 'Wall', 'Riser'], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [], values: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] } },
      { name: 'Services', type: 'string', barrierInput: '', barrierValues: ['2 Pex Pipes', '1 PVC Pipes', '3 Copper Pipes'], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [], values: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] } },
      { name: 'Materials', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [], values: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] } },
      { name: 'FRL', type: 'string', barrierInput: '', barrierValues: ['-/120-', '-/120/120', '-180/180', '-/60/60', '-/240/240', '-90/90', 'Smoke'], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [], values: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] } },
      { name: 'Location', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [], values: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] } },
      { name: 'Comments', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [], values: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] } },
      { name: 'Date', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [], values: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] } },
      { name: 'Inspector', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [], values: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] } },
      { name: 'Notes', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [], values: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] } },
      { name: 'Time', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [], values: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] } },
      { name: 'Price', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [], values: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] } },
      { name: 'Additional Requirements', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false , hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [], values: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] } }
    ],
    'Annual Inspection': [
      { name: 'Services', type: 'string', barrierInput: '', barrierValues: ['2 Pex Pipes', '1 PVC Pipes', '3 Copper Pipes'], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [], values: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] } },
      { name: 'Materials', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [], values: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] } },
      { name: 'Barrier', type: 'string', barrierInput: '', barrierValues: ['Bulkhead', 'Ceiling', 'Floor', 'Wall', 'Riser'], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [], values: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] } },
      { name: 'FRL', type: 'string', barrierInput: '', barrierValues: ['-/120-', '-/120/120', '-180/180', '-/60/60', '-/240/240', '-90/90', 'Smoke'], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [], values: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] } },
      { name: 'Location', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [], values: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] } },
      { name: 'Comments', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [], values: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] } },
      { name: 'Safety Measures', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [], values: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] } },
      { name: 'Relevance to Building Code', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [], values: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] } },
      { name: 'Compliance', type: 'string', barrierInput: '', barrierValues: ['Pass', 'Fail'], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [], values: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] } },
      { name: 'Date Inspected', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [], values: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] } },
      { name: 'Inspector', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [], values: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] } },
      { name: 'Date', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [], values: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] } },
      { name: 'Time', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [], values: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] } },
      { name: 'Price', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [], values: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] } }
    ],
    'Fire Dampers': [
      { name: 'FD No.', type: 'list', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [], values: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] } },
      { name: 'Location', type: 'list', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [], values: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] } },
      { name: 'Year Inspected', type: 'string', barrierInput: '', barrierValues: ['2025', '2026', '2027', '2028', '2029'], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [], values: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] } },
      { name: 'Inspection Date', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [], values: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] } },
      { name: 'Damper Accessible', type: 'string', barrierInput: '', barrierValues: ['Yes', 'No'], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [], values: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] } },
      { name: 'Damper Closes and fusable link ok', type: 'string', barrierInput: '', barrierValues: ['Yes', 'No'], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [], values: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] } },
      { name: 'Damper Installed Correctly', type: 'string', barrierInput: '', barrierValues: ['Yes', 'No'], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [], values: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] } },
      { name: 'Flanges or Retaining Angles Correct', type: 'string', barrierInput: '', barrierValues: ['Yes', 'No'], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [], values: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] } },
      { name: 'Barrier', type: 'string', barrierInput: '', barrierValues: ['Bulkhead', 'Ceiling', 'Floor', 'Wall', 'Riser'], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [], values: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] } },
      { name: 'FRL', type: 'string', barrierInput: '', barrierValues: ['-/120-', '-/120/120', '-180/180', '-/60/60', '-/240/240', '-90/90', 'Smoke'], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [], values: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] } },
      { name: 'Substrate Type', type: 'string', barrierInput: '', barrierValues: ['Concrete Wall', 'Masonry Wall', 'Dincel', 'Hebel Wall', 'Fire Rated Plasterboard Wall', 'Speedpanel Wall', 'Hebel Powerpanel Wall'], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [], values: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] } },
      { name: 'Penetration Compliant', type: 'string', barrierInput: '', barrierValues: ['Yes', 'No'], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [], values: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] } },
      { name: 'Breakaway Connection', type: 'string', barrierInput: '', barrierValues: ['Yes', 'No'], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [], values: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] } },
      { name: 'Damper free from Corrosion', type: 'string', barrierInput: '', barrierValues: ['Yes', 'No'], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [], values: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] } },
      { name: 'Is this damper installed correctly', type: 'string', barrierInput: '', barrierValues: ['Yes', 'No'], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [], values: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] } },
      { name: 'Comments', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [], values: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] } },
      { name: 'Date of Repairs', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [], values: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] } }
    ],
    'Installation/Penetration Register': [
      { name: 'Test ID', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [], values: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] } },
      { name: 'Sticker Number', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [], values: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] } },
      { name: 'Services', type: 'string', barrierInput: '', barrierValues: ['2 Pex Pipes', '1 PVC Pipes', '3 Copper Pipes'], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [], values: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] } },
      { name: 'Materils', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [], values: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] } },
      { name: 'Barrier', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [], values: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] } },
      { name: 'FRL', type: 'string', barrierInput: '', barrierValues: ['-/120-', '-/120/120', '-180/180', '-/60/60', '-/240/240', '-90/90', 'Smoke'], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [], values: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] } },
      { name: 'Reference to Building Code', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [], values: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] } },
      { name: 'Location', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [], values: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] } },
      { name: 'Compliance', type: 'string', barrierInput: '', barrierValues: ['Pass', 'Fail'], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [], values: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] } },
      { name: 'Comments', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [], values: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] } },
      { name: 'Date', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [], values: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] } }
    ],
    'Third Party Certification': [
      { name: 'Test ID', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [], values: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] } },
      { name: 'Sticker Number', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [], values: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] } },
      { name: 'Services', type: 'string', barrierInput: '', barrierValues: ['2 Pex Pipes', '1 PVC Pipes', '3 Copper Pipes'], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [], values: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] } },
      { name: 'Materials', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [], values: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] } },
      { name: 'Barrier', type: 'string', barrierInput: '', barrierValues: ['Bulkhead', 'Ceiling', 'Floor', 'Wall', 'Riser'], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [], values: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] } },
      { name: 'FRL', type: 'string', barrierInput: '', barrierValues: ['-/120-', '-/120/120', '-180/180', '-/60/60', '-/240/240', '-90/90', 'Smoke'], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [], values: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] } },
      { name: 'Location', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [], values: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] } },
      { name: 'Comments', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [], values: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] } },
      { name: 'Trade', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [], values: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] } },
      { name: 'Compliance', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [], values: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] } },
      { name: 'Date Inspected', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [], values: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] } },
      { name: 'Inspector', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [], values: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] } },
      { name: 'Notes', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [], values: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] } },
      { name: 'Time', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [], values: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] } },
      { name: 'Price', type: 'string', barrierInput: '', barrierValues: [], editableInBackOffice: false, hideForMobile: false, isConditional: false, productId: '', approvalDocumentId: '', filteredApprovalDocuments: [], selectedApprovalDocuments: [], values: [], editableBackOffice: false, hideForMobileUser: false, conditionalAttribute: { isEnabled: false, approvalDocumentIds: [] } }
    ]
  };

  private apiUrl = 'https://aspbackend-production.up.railway.app/api/project/download/';
  private attributesApiUrl = 'https://vps.allpassiveservices.com.au/api/project/attributes/';
  private updateApiUrl = 'https://aspbackend-production.up.railway.app/api/updateProject/standard-attribute/';
  private productApiUrl = 'https://aspbackend-production.up.railway.app/api/product/list';
  private employeeApiUrl = 'https://aspbackend-production.up.railway.app/api/employees';

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
        if (standardAttribute) {
          this.selectedTemplate = standardAttribute.templateName || '';
          this.selectedProductId = standardAttribute.productId || '';
          this.selectedApprovalDocumentIds = standardAttribute.approvalDocumentIds || [];
          this.selectedEmployeeIds = standardAttribute.assignedEmployees || [];
          this.selectedProductNameId = standardAttribute.productId || '';
          
          // Initialize attributes with API data or predefined template
          this.attributes = this.initializeAttributes(standardAttribute);
          this.newAttributeValues = new Array(this.attributes.length).fill('');
        }
      },
      error: (error) => {
        console.error('Error fetching attributes data:', error);
        this.http.get<DownloadProject>(`${this.apiUrl}${projectId}`).subscribe({
          next: (data: DownloadProject) => {
            console.log('Project Data:', data);
            this.projectData = data;
            if (data.standardAttributes && data.standardAttributes.length > 0) {
              this.selectedTemplate = data.standardAttributes[0].templateName || '';
              this.selectedProductId = data.standardAttributes[0].productId || '';
              this.selectedApprovalDocumentIds = data.standardAttributes[0].approvalDocumentIds || [];
              this.selectedEmployeeIds = data.standardAttributes[0].assignedEmployees || [];
              this.selectedProductNameId = data.standardAttributes[0].productId || '';
              this.attributes = this.initializeAttributes(data.standardAttributes[0]);
              this.newAttributeValues = new Array(this.attributes.length).fill('');
            } else {
              this.updateAttributes();
            }
          },
          error: (error) => {
            console.error('Error fetching project data:', error);
            this.errorMessage = 'Failed to load project data';
          }
        });
      }
    });
  }

  private initializeAttributes(standardAttribute: StandardAttribute): Attribute[] {
    // If API provides attributes and they are valid, use them
    if (standardAttribute.attributes && standardAttribute.attributes.length > 0) {
      return standardAttribute.attributes.map(attr => ({
        ...attr,
        values: attr.values || [],
        barrierValues: attr.barrierValues || [],
        editableBackOffice: attr.editableBackOffice || false,
        hideForMobileUser: attr.hideForMobileUser || false,
        conditionalAttribute: attr.conditionalAttribute || { isEnabled: false, approvalDocumentIds: [] },
        barrierInput: attr.barrierInput || '',
        editableInBackOffice: attr.editableInBackOffice || false,
        hideForMobile: attr.hideForMobile || false,
        isConditional: attr.isConditional || false,
        productId: attr.productId || '',
        approvalDocumentId: attr.approvalDocumentId || '',
        filteredApprovalDocuments: attr.filteredApprovalDocuments || [],
        selectedApprovalDocuments: attr.selectedApprovalDocuments || []
      }));
    }
    // Fallback to predefined template attributes if API attributes are empty
    return this.predefinedTemplates[this.selectedTemplate]?.map(attr => ({
      ...attr,
      values: [...(attr.barrierValues || [])],
      barrierInput: attr.barrierInput || '',
      barrierValues: attr.barrierValues || [],
      editableBackOffice: attr.editableBackOffice || false,
      hideForMobileUser: attr.hideForMobileUser || false,
      conditionalAttribute: attr.conditionalAttribute || { isEnabled: false, approvalDocumentIds: [] },
      editableInBackOffice: attr.editableInBackOffice || false,
      hideForMobile: attr.hideForMobile || false,
      isConditional: attr.isConditional || false,
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
    this.isProductNameDropdownOpen = false;
  }

  toggleProductDropdown() {
    this.isProductDropdownOpen = !this.isProductDropdownOpen;
    this.isTemplateDropdownOpen = false;
    this.isApprovalDropdownOpen = false;
    this.isEmployeeDropdownOpen = false;
    this.isProductNameDropdownOpen = false;
  }

  toggleApprovalDropdown() {
    this.isApprovalDropdownOpen = !this.isApprovalDropdownOpen;
    this.isTemplateDropdownOpen = false;
    this.isProductDropdownOpen = false;
    this.isEmployeeDropdownOpen = false;
    this.isProductNameDropdownOpen = false;
  }

  toggleEmployeeDropdown() {
    this.isEmployeeDropdownOpen = !this.isEmployeeDropdownOpen;
    this.isTemplateDropdownOpen = false;
    this.isProductDropdownOpen = false;
    this.isApprovalDropdownOpen = false;
    this.isProductNameDropdownOpen = false;
  }

  toggleProductNameDropdown() {
    this.isProductNameDropdownOpen = !this.isProductNameDropdownOpen;
    this.isTemplateDropdownOpen = false;
    this.isProductDropdownOpen = false;
    this.isApprovalDropdownOpen = false;
    this.isEmployeeDropdownOpen = false;
  }

  selectTemplate(template: string) {
    this.selectedTemplate = template;
    this.isTemplateDropdownOpen = false;
    this.updateAttributes();
  }

  private updateAttributes() {
    if (this.selectedTemplate && this.predefinedTemplates[this.selectedTemplate]) {
      this.attributes = this.predefinedTemplates[this.selectedTemplate].map(attr => ({
        ...attr,
        values: [...(attr.barrierValues || [])],
        barrierInput: attr.barrierInput || '',
        barrierValues: attr.barrierValues || [],
        editableBackOffice: attr.editableBackOffice || false,
        hideForMobileUser: attr.hideForMobileUser || false,
        conditionalAttribute: attr.conditionalAttribute || { isEnabled: false, approvalDocumentIds: [] },
        editableInBackOffice: attr.editableInBackOffice || false,
        hideForMobile: attr.hideForMobile || false,
        isConditional: attr.isConditional || false,
        productId: attr.productId || '',
        approvalDocumentId: attr.approvalDocumentId || '',
        filteredApprovalDocuments: attr.filteredApprovalDocuments || [],
        selectedApprovalDocuments: attr.selectedApprovalDocuments || []
      }));
      this.newAttributeValues = new Array(this.attributes.length).fill('');
    } else {
      this.attributes = [];
      this.newAttributeValues = [];
    }
  }

  selectProduct(productId: string) {
    this.selectedProductId = productId;
    this.selectedApprovalDocumentIds = [];
    this.isProductDropdownOpen = false;
  }

  selectProductName(productId: string) {
    this.selectedProductNameId = productId;
    this.isProductNameDropdownOpen = false;
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
    this.attributes.splice(index, 1);
    this.newAttributeValues.splice(index, 1);
    this.newAttributeValues = [...this.newAttributeValues];
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
          values: attr.values || [],
          barrierInput: attr.barrierInput || '',
          barrierValues: attr.barrierValues || [],
          editableBackOffice: attr.editableBackOffice || false,
          hideForMobileUser: attr.hideForMobileUser || false,
          conditionalAttribute: attr.conditionalAttribute || { isEnabled: false, approvalDocumentIds: [] },
          editableInBackOffice: attr.editableInBackOffice || false,
          hideForMobile: attr.hideForMobile || false,
          isConditional: attr.isConditional || false,
          productId: attr.productId || '',
          approvalDocumentId: attr.approvalDocumentId || '',
          filteredApprovalDocuments: attr.filteredApprovalDocuments || [],
          selectedApprovalDocuments: attr.selectedApprovalDocuments || []
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

  getCombinedAttributes(index: number): string {
    if (index !== 0 || this.attributes.length <= 1) return '';
    return this.attributes
      .slice(1)
      .map(attr => attr.name)
      .join(', ');
  }

  removeBadge(index: number) {
    if (this.attributes[index] && this.attributes[index].values) {
      this.attributes[index].values.splice(index, 1);
      this.attributes = [...this.attributes];
    }
  }
}