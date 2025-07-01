export interface ArchiveProject {
  projectId: string;
  projectName: string;
  buildingName: string;
  status: string;
  client: {
    clientId: string | null;
    clientName: string;
    clientPhone?: string;
  };
  assignedEmployees: (string | { imageUrl: string; _id: string; name: string } | null)[];
  subProjects: string;
}