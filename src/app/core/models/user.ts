export interface User {
  _id: string;
  name: string;
  username: string;
  password?: string;
  email: string;
  phone?: string;
  employeeId: string;
  profilePic?: string;
  userType: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
  passwordResetExpires?: string;
  passwordResetToken?: string;
}