import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LoginResponse } from '../../../app/core/models/auth';
import { faUser, faLock, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonModule } from '@angular/common';

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

  constructor(private authService: AuthService, private router: Router) {}

  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }

  onLogin() {
    this.errorMsg = ''; // Clear previous error to ensure it shows only once
    this.isLoading = true;

    this.authService.login(this.username, this.password).subscribe({
      next: (res: LoginResponse) => {
        if (!res.error) {
          console.log('LoginComponent: Login successful, navigating to dashboard');
          setTimeout(() => {
            this.isLoading = false;
            this.router.navigate(['/pages/dashboard']);
          }, 0); // Delay set to 0 milliseconds
        } else {
          this.isLoading = false;
          this.errorMsg = res.message || 'Invalid username or password.';
          console.warn('LoginComponent: Login failed', res.message);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMsg = 'Login failed. Please check your credentials.';
        console.error('LoginComponent: Login error', err);
      }
    });
  }

  goToForgetPassword() {
    this.router.navigate(['forget-password']);
  }
}