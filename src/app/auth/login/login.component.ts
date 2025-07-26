import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LoginResponse } from '../../../app/core/models/auth';
import { faUser, faLock, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: true,
  imports: [FormsModule, FontAwesomeModule, CommonModule]
})
export class LoginComponent {
  faUser = faUser;
  faLock = faLock;
  faEye = faEye;
  faEyeSlash = faEyeSlash;

  passwordVisible = false;
  username: string = '';
  password: string = '';
  errorMsg: string = '';
  isLoading: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }

  onLogin() {
    this.errorMsg = '';
    this.isLoading = true;

    this.authService.login(this.username, this.password).subscribe({
      next: (res: LoginResponse) => {
        if (!res.error) {
          console.log('LoginComponent: Login successful, navigating to dashboard');
          this.toastr.success('Login successful!', 'Welcome');
          setTimeout(() => {
            this.isLoading = false;
            this.router.navigate(['/pages/dashboard']);
          }, 0);
        } else {
          this.isLoading = false;
          this.errorMsg = res.message || 'Invalid username or password.';
          this.toastr.error(this.errorMsg, 'Login Failed');
          console.warn('LoginComponent: Login failed', res.message);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMsg = 'Login failed. Please check your credentials.';
        this.toastr.error(this.errorMsg, 'Login Failed');
        console.error('LoginComponent: Login error', err);
      }
    });
  }

  goToForgetPassword() {
    this.router.navigate(['forget-password']);
  }
}