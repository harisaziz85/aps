import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../enviornment/environment';
import { ProjectExport } from '../models/project-export';

interface CountResponse {
  totalClientsCount: number;
  mobileUsersCount: number;
  totalProductsCount: number;
  totalProjectsCount: number;
}

export interface Employee {
  _id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  employeeId: string;
  profilePic: string;
  userType: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface LoginResponse {
  error: boolean;
  message: string;
  token: string;
  employee: Employee;
}

export interface ProfileResponse {
  error: boolean;
  message: string;
  profile: Employee;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = environment.apiUrl;
  private tokenKey = 'auth_token';
  private userKey = 'user_data';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/auth/admin-signin`, {
      username,
      password
    }).pipe(
      tap(response => {
        if (response && response.token) {
          console.log('AuthService: Login successful, storing token:', response.token);
          this.setToken(response.token);
          this.setUserData(response.employee);
        } else {
          console.error('AuthService: No token received in login response:', response);
        }
      })
    );
  }

  forgetPassword(email: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/auth/forget-password`, { email });
  }

  verifyOtp(email: string, verificationCode: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/auth/verify-otp`, {
      email,
      verificationCode
    });
  }

  resetPassword(data: { email: string; newPassword: string; confirmPassword: string }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/auth/reset-password`, data);
  }

  getProfile(): Observable<ProfileResponse> {
    const token = this.getToken();
    console.log('AuthService: Fetching profile with token:', token ? 'Present' : 'Missing');
    return this.http.get<ProfileResponse>(`${this.baseUrl}/auth/profile`, {
      headers: { Authorization: `${token}` }
    });
  }

  updateProfile(data: FormData): Observable<ProfileResponse> {
    const token = this.getToken();
    console.log('AuthService: Updating profile with token:', token ? 'Present' : 'Missing');
    return this.http.put<ProfileResponse>('https://vps.allpassiveservices.com.au/api/auth/admin/profile', data, {
      headers: {
        Authorization: `${token}`
      }
    }).pipe(
      tap(response => {
        if (!response.error && response.profile) {
          console.log('AuthService: Profile updated successfully:', response.profile);
          this.setUserData(response.profile);
        } else {
          console.error('AuthService: Profile update failed:', response.message);
        }
      })
    );
  }

  exportProject(projectId: string): Observable<ProjectExport> {
    const token = this.getToken();
    console.log('AuthService: Exporting project with ID:', projectId, 'and token:', token ? 'Present' : 'Missing');
    return this.http.get<ProjectExport>(`${this.baseUrl}/exchangeData/export/${projectId}`, {
      headers: { Authorization: `${token}` }
    }).pipe(
      catchError(this.handleError)
    );
  }

  getCounts(): Observable<CountResponse> {
    const token = this.getToken();
    console.log('AuthService: Fetching counts with token:', token ? 'Present' : 'Missing');
    return this.http.get<CountResponse>(`${this.baseUrl}/admin/count`);
  }

  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
    console.log('AuthService: Token stored in localStorage:', token);
  }

  getToken(): string | null {
    const token = localStorage.getItem(this.tokenKey);
    console.log('AuthService: Retrieved token from localStorage:', token);
    return token;
  }

  setUserData(userData: any): void {
    localStorage.setItem(this.userKey, JSON.stringify(userData));
    console.log('AuthService: User data stored in localStorage:', userData);
  }

  getUserData(): any {
    const userData = localStorage.getItem(this.userKey);
    return userData ? JSON.parse(userData) : null;
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    return !!token;
  }

  logout(): void {
    console.log('AuthService: Logging out, clearing localStorage');
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.router.navigate(['/auth/signin']);
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    console.error('AuthService: Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}