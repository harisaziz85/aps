import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-pinvar',
  templateUrl: './pinvar.component.html',
  styleUrls: ['./pinvar.component.css']
})
export class PinvarComponent implements OnInit {
  countdown = 60;
  otpInputs: string[] = ['', '', '', ''];
  email: string = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Retrieve email from route parameters
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';
      if (!this.email) {
        alert('No email provided. Please try again.');
        this.router.navigate(['/forgot-password']);
      } else {
        this.startTimer();
      }
    });
  }

  moveToNext(event: any, index: number) {
    const input = event.target;
    this.otpInputs[index] = input.value;

    if (input.value.length === 1 && index < 3) {
      input.nextElementSibling?.focus();
    }
  }

  get fullOtp(): string {
    return this.otpInputs.join('');
  }

  startTimer() {
    const interval = setInterval(() => {
      if (this.countdown > 0) {
        this.countdown--;
      } else {
        clearInterval(interval);
      }
    }, 1000);
  }

  onSubmitOtp() {
    if (this.fullOtp.length !== 4) {
      alert('Please enter the full 4-digit code.');
      return;
    }

    this.authService.verifyOtp(this.email, this.fullOtp).subscribe({
      next: (res) => {
        console.log('OTP verified:', res);
        this.router.navigate(['/new-password'], { queryParams: { email: this.email } });
      },
      error: (err) => {
        console.error('OTP verification failed:', err);
        alert('Invalid OTP or error verifying. Please try again.');
      }
    });
  }


}