import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();
  console.log('Interceptor: Processing request', { 
    url: req.url, 
    token: token ? 'Present' : 'Missing' 
  });

  let authReq = req;
  const publicRoutes = [
    '/auth/signin',
    '/auth/forget-password',
    '/auth/verify-otp',
    '/auth/reset-password'
  ];

  const isPublicRoute = publicRoutes.some(route => req.url.includes(route));

  if (token && !isPublicRoute) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `${token}`
      }
    });
    console.log('Interceptor: Added Authorization header', {
      url: req.url,
      authorization: authReq.headers.get('Authorization'),
      allHeaders: authReq.headers.keys().reduce((acc, key) => ({
        ...acc,
        [key]: authReq.headers.get(key)
      }), {})
    });
  } else {
    console.log('Interceptor: No token or public route, proceeding without auth headers', { 
      url: req.url,
      isPublicRoute 
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error('Interceptor: HTTP error', {
        url: req.url,
        status: error.status,
        statusText: error.statusText,
        message: error.message,
        error: error.error
      });
      if (error.status === 401 && !isPublicRoute) {
        console.warn('Interceptor: 401 Unauthorized, redirecting to login');
        authService.logout();
        router.navigate(['/auth/signin'], { queryParams: { sessionExpired: true } });
      }
      return throwError(() => error);
    })
  );
};