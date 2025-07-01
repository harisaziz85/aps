export interface ProjectResponse {
  instances: InstanceResponse[];
  projectId: string;
  projectName: string;
  buildingName: string;
  imageUrl?: string | null;
  address?: string;
  client?: {
    clientId: string;
    clientName: string;
    clientPhone: string;
  };
  clientName?: string;
  date?: string;
  buildingType?: string;
  assignedEmployees?: Array<{
    employeeId?: string;
    name?: string;
    image?: string;
  } | null>;
  reports?: any[];
  subProjects?: Array<{
    hierarchyLevelId: string;
    hierarchyName: string;
    totalInstances: number;
    instances: Array<{
      instanceId: string;
      instanceName: string;
      subProjectCategory: string;
    }>;
  }>;
  status?: string;
  project?: any;
  hierarchyLevels?: Array<{ // Added for hierarchy level images
    hierarchyLevelId: string;
    name: string;
    imageUrl?: string | null;
  }>;
}
export interface InstanceResponse {
  name: string | undefined;
  instanceId: string;
  comments: string;
  status: string;
  type: string;
  location: string;
  _id: string;
  projectId: string;
  hierarchyLevelId: string;
  hierarchyName: string; // Used as hierarchyLevelName in generateReport
  subProjectCategory: string;
  createdBy: string;
  attributes: Array<{
    conditionalAttribute: {
      isEnabled: boolean;
      productId: string | null;
      approvalDocumentId: string | null;
    };
    name: string;
    type: string;
    value: string | string[];
    selectedValue: string;
    editableBackOffice: boolean;
    hideForMobileUser: boolean;
    _id: string;
    location?: string;
    plan?: string;
    substrate?: string;
    frl?: string;
    comments?: string;
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
  instanceName?: string;
}

export interface Marker {
  label: string;
  _id: string;
  position: {
    x: number;
    y: number;
  };
  style: {
    textSize: number;
  };
  createdBy: string;
  title: string;
  instanceId: string;
  createdAt: string;
}

export interface Document {
  _id: string;
  documentName: string;
  documentUrl: string;
  version: number;
  documentType: string;
  projectId: string;
  hierarchyLevel: string;
  markers: Marker[];
}

export interface AttributeTemplate {
  _id: string;
  projectId: string;
  templateName: string;
  approvalDocumentId: string;
  productId: string;
  assignedEmployees: string[];
  attributes: Array<{
    conditionalAttribute: {
      isEnabled: boolean;
    };
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

export interface AttributeTemplateResponse {
  message: string;
  data: AttributeTemplate;
}