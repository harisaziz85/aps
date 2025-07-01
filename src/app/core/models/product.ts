export interface ApprovalDocument {
  _id: string;
  name: string;
  fileUrl: string;
  createdAt: string;
  __v: number;
}

export interface Product {
  _id: string;
  name: string;
  approvalDocuments: string[]; // Array of document IDs
  createdAt: string;
  updatedAt: string;
  __v: number;
}