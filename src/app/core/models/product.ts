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
  approvalDocuments: { _id: string; name: string; fileUrl: string; createdAt: string; __v: number }[]; // Array of document IDs
  createdAt: string;
  updatedAt: string;
  __v: number;
}