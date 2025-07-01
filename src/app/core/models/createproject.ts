export interface Project {
  projectName: string;
  imageUrl?: string | null;
  buildingName: string;
  subProjects: string[];
  address: {
    line1: string;
    line2?: string;
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
    clientId?: string;
    name: string;
    contactPerson: string;
    phone: string;
  };
  isArchive: boolean;
  createdBy?: string;
  _id?: string;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}