export interface Employee {
  _id: string;
  name: string;
  username: string;
  email: string;
  profilePic: string;
  userType: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  error: boolean;
  message: string;
  token: string;
  employee: Employee;
}
