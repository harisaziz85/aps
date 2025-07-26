import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../enviornment/environment';
import { ProjectExport } from '../models/project-export';
import { ToastrService } from 'ngx-toastr'; // ✅ Toastr import

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
    private router: Router,
    private toastr: ToastrService // ✅ Injected
  ) {}

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/auth/admin-signin`, {
      username,
      password
    }).pipe(
      tap(response => {
        if (response && response.token) {
          this.setToken(response.token);
          this.setUserData(response.employee);
          this.toastr.success('Login successful!', 'Success');
        } else {
          this.toastr.error('Login failed. Token not received.', 'Error');
        }
      }),
      catchError(error => {
        this.toastr.error('Login failed. Please check your credentials.', 'Error');
        return throwError(() => error);
      })
    );
  }

  forgetPassword(email: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/auth/forget-password`, { email }).pipe(
      tap(() => this.toastr.success('Password reset link sent to your email.', 'Success')),
      catchError(error => {
        this.toastr.error('Failed to send reset link.', 'Error');
        return throwError(() => error);
      })
    );
  }

  verifyOtp(email: string, verificationCode: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/auth/verify-otp`, {
      email,
      verificationCode
    }).pipe(
      tap(() => this.toastr.success('OTP verified successfully.', 'Success')),
      catchError(error => {
        this.toastr.error('Invalid or expired OTP.', 'Error');
        return throwError(() => error);
      })
    );
  }

  resetPassword(data: { email: string; newPassword: string; confirmPassword: string }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/auth/reset-password`, data).pipe(
      tap(() => this.toastr.success('Password reset successfully.', 'Success')),
      catchError(error => {
        this.toastr.error('Failed to reset password.', 'Error');
        return throwError(() => error);
      })
    );
  }

  getProfile(): Observable<ProfileResponse> {
    const token = this.getToken();
    return this.http.get<ProfileResponse>(`${this.baseUrl}/auth/profile`, {
      headers: { Authorization: `${token}` }
    });
  }

  updateProfile(data: FormData): Observable<ProfileResponse> {
    const token = this.getToken();
    return this.http.put<ProfileResponse>('https://vps.allpassiveservices.com.au/api/auth/admin/profile', data, {
      headers: {
        Authorization: `${token}`
      }
    }).pipe(
      tap(response => {
        if (!response.error && response.profile) {
          this.setUserData(response.profile);
          this.toastr.success('Profile updated successfully.', 'Success');
        } else {
          this.toastr.error('Failed to update profile.', 'Error');
        }
      }),
      catchError(error => {
        this.toastr.error('Error occurred while updating profile.', 'Error');
        return throwError(() => error);
      })
    );
  }

  exportProject(projectId: string): Observable<ProjectExport> {
    const token = this.getToken();
    return this.http.get<ProjectExport>(`${this.baseUrl}/exchangeData/export/${projectId}`, {
      headers: { Authorization: `${token}` }
    }).pipe(
      catchError(error => {
        this.toastr.error('Failed to export project.', 'Error');
        return this.handleError(error);
      })
    );
  }

  getCounts(): Observable<CountResponse> {
    const token = this.getToken();
    return this.http.get<CountResponse>(`${this.baseUrl}/admin/count`);
  }

  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  setUserData(userData: any): void {
    localStorage.setItem(this.userKey, JSON.stringify(userData));
  }

  getUserData(): any {
    const userData = localStorage.getItem(this.userKey);
    return userData ? JSON.parse(userData) : null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.toastr.info('You have been logged out.', 'Info');
    this.router.navigate(['/auth/signin']);
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    this.toastr.error(errorMessage, 'HTTP Error');
    return throwError(() => new Error(errorMessage));
  }
}
