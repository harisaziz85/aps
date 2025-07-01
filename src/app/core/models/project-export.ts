export interface ProjectExport {
_id: string;
  projectName: string;
  project: {
    _id: string;
    projectName: string;
    imageUrl: string | null;
    buildingName: string;
    subProjects: string[];
    isArchive: boolean;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    __v: number;
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
  };
  hierarchy: any | null;
  standardAttributes: {
    _id: string;
    projectId: string;
    templateName: string;
    approvalDocumentId: string;
    productId: string;
    assignedEmployees: string[];
    attributes: {
      conditionalAttribute: {
        isEnabled: boolean;
      };
      name: string;
      type: string;
      value: string;
      editableBackOffice: boolean;
      hideForMobileUser: boolean;
      _id: string;
    }[];
    createdAt: string;
    updatedAt: string;
    __v: number;
  }[];
  instances: any[];
  documents: any[];
  reports: any[];
}