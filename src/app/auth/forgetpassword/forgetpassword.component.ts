import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-forgetpassword',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './forgetpassword.component.html',
  styleUrls: ['./forgetpassword.component.css'],
})
export class ForgetpasswordComponent {
  errorMessage: string | null = null;
  isLoading: boolean = false;

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit(event: Event) {
    event.preventDefault();
    this.errorMessage = null;
    this.isLoading = true;

    const emailInput = (event.target as HTMLFormElement).querySelector('#email') as HTMLInputElement;
    const email = emailInput.value.trim();

    if (email) {
      this.authService.forgetPassword(email).subscribe({
        next: (res) => {
          if (res.status) {
            // Store email in localStorage for redundancy
            localStorage.setItem('resetEmail', email);
            // Navigate to pin-verification with email as query param
            this.router.navigate(['/pin-varification'], { queryParams: { email } });
          } else {
            this.errorMessage = res.message || 'Email not found in our database.';
            this.isLoading = false;
          }
        },
        error: (err) => {
          console.error('API error:', err);
          this.errorMessage = 'Something went wrong. Please try again.';
          this.isLoading = false;
        },
      });
    } else {
      this.errorMessage = 'Please enter a valid email address.';
      this.isLoading = false;
    }
  }

  goToFlogin() {
    this.router.navigate(['']);
  }
}