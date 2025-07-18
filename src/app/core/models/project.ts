export interface Client {
  clientId: string | null; // Allow null to match API response (e.g., project ID 683ad27af122893193965b4b)
  clientName: string;
}

export interface Employee {
  image?: string;
  _id?: string;
  name?: string;
}

export interface Project {
  jobNotes: string;
  _id: string;
  projectAdministration: any;
  projectId: string;
  projectName: string;
  buildingName: string;
  status: string;
  client: Client;
assignedEmployees: (Employee | string | null)[];
  subProjects: string;
}

export interface ProjectResponse {
  imageUrl(arg0: string, imageUrl: any): unknown;
  clientName: string;
  buildingName: string;
  projectName: string;
  error: any;
  message(arg0: string, message: any): unknown;
  projects: Project[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalProjects: number;
    projectsPerPage: number;
  };
}

export interface ProjectDisplay {
  id: string;
  name: string;
  building: string;
  status: string;
  assignee: string[];
  description: string;
}