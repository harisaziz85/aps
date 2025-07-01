export interface Client {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  clientProfile?: string;
  ongoing?: number;
  completed?: number;
}

export interface Project {
  _id: string;
  name: string;
  status: 'todo' | 'inprogress' | 'completed';
}