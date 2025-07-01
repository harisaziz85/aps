import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-newpassword',
  standalone: true,
  imports: [CommonModule, FormsModule, FaIconComponent],
  templateUrl: './newpassword.component.html',
  styleUrls: ['./newpassword.component.css']
})
export class NewpasswordComponent implements OnInit {
  faEye = faEye;
  faEyeSlash = faEyeSlash;

  passwordVisible = false;
  passwordVisible1 = false;
  newPassword = '';
  confirmPassword = '';
  email = '';
  errorMessage: string | null = null;
  isLoading = false;

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    // Retrieve email from query parameters
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || localStorage.getItem('resetEmail') || '';
      if (!this.email) {
        alert('No email provided. Please try again.');
        this.router.navigate(['/forgot-password']);
      }
    });
  }

  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }

  togglePasswordVisibility1() {
    this.passwordVisible1 = !this.passwordVisible1;
  }

  onSubmit(event: Event) {
    event.preventDefault();
    this.errorMessage = null;
    this.isLoading = true;

    // Validate passwords
    if (!this.newPassword || !this.confirmPassword) {
      this.errorMessage = 'Please enter both password fields.';
      this.isLoading = false;
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match!';
      this.isLoading = false;
      return;
    }

    if (this.newPassword.length < 8) {
      this.errorMessage = 'Password must be at least 8 characters long.';
      this.isLoading = false;
      return;
    }

    const body = {
      email: this.email,
      newPassword: this.newPassword,
      confirmPassword: this.confirmPassword
    };

    this.authService.resetPassword(body).subscribe({
      next: (res) => {
        alert('Password reset successful!');
        // Clear localStorage
        localStorage.removeItem('resetEmail');
        localStorage.removeItem('verificationCode');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Password reset failed:', err);
        this.errorMessage = err.error?.message || 'Failed to reset password. Please try again.';
        this.isLoading = false;
      }
    });
  }
}