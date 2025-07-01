import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    console.log('AuthGuard: User is authenticated, allowing access to route:', state.url);
    return true;
  } else {
    console.warn('AuthGuard: User is not authenticated, redirecting to login');
    router.navigate(['/auth/signin'], { queryParams: { returnUrl: state.url } });
    return false;
  }
};