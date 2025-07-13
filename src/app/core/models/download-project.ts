export interface DownloadProject {
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
  imageUrl: string | null;
  subProjects: string[];
  submittedForApprovalBy: string[];
  isArchive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
  standardAttributes?: Array<{
    _id: string;
    projectId: string;
    templateName: string;
    approvalDocumentIds: string[];
    approvalDocumentNames?: string[]; // Added to store approval document names
    productId: string;
    productName?: string; // Added to store product name
    assignedEmployees: string[];
    employeeNames?: string[]; // Added to store employee names
    attributes: Array<{
      conditionalAttribute: {
        isEnabled: boolean;
        approvalDocumentIds: string[];
      };
      name: string;
      type: string;
      value: string;
      editableBackOffice: boolean;
      hideForMobileUser: boolean;
      _id: string;
    }>;
    createdAt: string;
    updatedAt: string;
    __v: number;
  }>;
  instances?: Array<{
    _id: string;
    projectId: string;
    hierarchyLevelId: string;
    hierarchyName: string;
    subProjectCategory: string;
    createdBy: string;
    attributes: Array<{
      conditionalAttribute: {
        isEnabled: boolean;
        productId: string | null;
        approvalDocumentIds: string[];
      };
      name: string;
      type: string;
      value: string;
      selectedValue: string;
      editableBackOffice: boolean;
      hideForMobileUser: boolean;
      _id: string;
    }>;
    instanceNumber: number;
    photos: Array<{
      url: string;
      category: string;
      _id: string;
    }>;
    createdAt: string;
    updatedAt: string;
    __v: number;
  }>;
  documents?: any[];
  reports?: any[];
  jobNotes?: Array<{
    _id: string;
    title: string;
    employeeId: {
      _id: string;
      name: string;
    };
    createdAt: string;
    __v: number;
  }>;
  hierarchy: {
    _id: string;
    projectId: string;
    levels: Array<{
      name: string;
      _id: string;
    }>;
    createdAt: string;
    updatedAt: string;
    __v: number;
  };
}