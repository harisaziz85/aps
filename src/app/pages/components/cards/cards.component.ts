import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

interface CountResponse {
  totalClientsCount: number;
  mobileUsersCount: number;
  totalProductsCount: number;
  totalProjectsCount: number;
}

@Component({
  selector: 'app-cards',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cards.component.html',
  styleUrls: ['./cards.component.css']
})
export class CardsComponent implements OnInit {
  cards = [
    {
      title: 'Projects',
      count: 0,
      svgContent: `
        <svg width="70" height="70" viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 12C0 5.37258 5.37258 0 12 0H58C64.6274 0 70 5.37258 70 12V58C70 64.6274 64.6274 70 58 70H12C5.37258 70 0 64.6274 0 58V12Z" fill="#FCEBE8"/>
          <path d="M18.8887 34.4446C22.0464 35.8135 27.702 37.7846 34.9998 37.7846C42.2976 37.7846 47.9531 35.8135 51.1109 34.4446" stroke="#0F0F0F" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M35 35.5557V40.5557" stroke="#0F0F0F" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M28.8887 25.5556V20.0001C28.8887 18.7734 29.8842 17.7778 31.1109 17.7778H38.8887C40.1153 17.7778 41.1109 18.7734 41.1109 20.0001V25.5556" stroke="#0F0F0F" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M46.6665 25.5557H23.3331C20.8785 25.5557 18.8887 27.5455 18.8887 30.0001V44.4446C18.8887 46.8992 20.8785 48.889 23.3331 48.889H46.6665C49.121 48.889 51.1109 46.8992 51.1109 44.4446V30.0001C51.1109 27.5455 49.121 25.5557 46.6665 25.5557Z" stroke="#0F0F0F" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        
      `,
      button: '+ Project',
      route: '/pages/project-building'
    },
    {
      title: 'Clients',
      count: 0,
      svgContent: `
        <svg width="70" height="70" viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M0 12C0 5.37258 5.37258 0 12 0H58C64.6274 0 70 5.37258 70 12V58C70 64.6274 64.6274 70 58 70H12C5.37258 70 0 64.6274 0 58V12Z" fill="#FCEBE8"/>
<path d="M42.4336 41.1111H48.8891" stroke="#0F0F0F" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M34.5088 25.3777L33.9954 24.6822C33.3665 23.8333 32.3732 23.3311 31.3154 23.3311H28.0754C27.2132 23.3311 26.3843 23.6666 25.7621 24.2644L21.6132 28.2644C21.4577 28.4133 21.2843 28.5377 21.0977 28.6355" stroke="#0F0F0F" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M21.1113 41.1111H23.9113C24.5847 41.1111 25.2224 41.4178 25.6447 41.9422L28.0513 44.94C29.3758 46.5889 31.678 47.0778 33.558 46.1067L40.8335 42.3445C43.3024 41.0689 44.0069 37.8645 42.3024 35.6711L38.6402 30.9556" stroke="#0F0F0F" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M48.9058 28.6399C48.7169 28.5421 48.5435 28.4177 48.388 28.2666L44.2391 24.2666C43.6169 23.6688 42.788 23.3333 41.9257 23.3333H37.9102C37.0124 23.3333 36.1524 23.6955 35.5235 24.3399L29.9791 30.0244C28.8724 31.1577 28.8835 32.971 30.0035 34.091C30.9969 35.0844 32.5591 35.2199 33.7102 34.4133L39.9991 30.0021" stroke="#0F0F0F" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M16.666 26.6665H18.8882C20.1149 26.6665 21.1105 27.6621 21.1105 28.8887V42.2221C21.1105 43.4487 20.1149 44.4443 18.8882 44.4443H16.666" stroke="#0F0F0F" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M53.3331 26.6665H51.1109C49.8842 26.6665 48.8887 27.6621 48.8887 28.8887V42.2221C48.8887 43.4487 49.8842 44.4443 51.1109 44.4443H53.3331" stroke="#0F0F0F" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
</svg>

      `,
      button: '+ Clients',
      route: '/pages/clients'
    },
    {
      title: 'Users',
      count: 0,
      svgContent: `
        <svg width="70" height="70" viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M0 12C0 5.37258 5.37258 0 12 0H58C64.6274 0 70 5.37258 70 12V58C70 64.6274 64.6274 70 58 70H12C5.37258 70 0 64.6274 0 58V12Z" fill="#FCEBE8"/>
<path d="M27.7784 33.3333C30.233 33.3333 32.2229 31.3435 32.2229 28.8889C32.2229 26.4343 30.233 24.4445 27.7784 24.4445C25.3238 24.4445 23.334 26.4343 23.334 28.8889C23.334 31.3435 25.3238 33.3333 27.7784 33.3333Z" stroke="#0F0F0F" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M36.3543 48.6044C37.5165 48.2156 38.1987 46.9511 37.7676 45.8067C36.2454 41.7667 32.3543 38.8911 27.781 38.8911C23.2076 38.8911 19.3165 41.7667 17.7943 45.8067C17.3632 46.9533 18.0454 48.2178 19.2076 48.6044C21.3454 49.3178 24.2765 50 27.7832 50C31.2898 50 34.2187 49.3178 36.3543 48.6044Z" stroke="#0F0F0F" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M41.6671 27.7778C44.1217 27.7778 46.1115 25.788 46.1115 23.3334C46.1115 20.8788 44.1217 18.8889 41.6671 18.8889C39.2125 18.8889 37.2227 20.8788 37.2227 23.3334C37.2227 25.788 39.2125 27.7778 41.6671 27.7778Z" stroke="#0F0F0F" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M43.3327 44.3933C46.106 44.2222 48.4527 43.6467 50.2416 43.0489C51.4038 42.66 52.086 41.3956 51.6549 40.2511C50.1327 36.2111 46.2416 33.3356 41.6683 33.3356C39.4971 33.3356 37.4794 33.9845 35.7949 35.0978" stroke="#0F0F0F" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
</svg>

      `,
      button: '+ Users',
      route: '/pages/all-users'
    },
    {
      title: 'Products',
      count: 0,
      svgContent: `
        <svg width="70" height="70" viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M0 12C0 5.37258 5.37258 0 12 0H58C64.6274 0 70 5.37258 70 12V58C70 64.6274 64.6274 70 58 70H12C5.37258 70 0 64.6274 0 58V12Z" fill="#FCEBE8"/>
<path d="M35 20V33.3333" stroke="#0F0F0F" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M44.4447 26.6666H25.5558C23.1012 26.6666 21.1113 28.6565 21.1113 31.1111V44.4444C21.1113 46.899 23.1012 48.8888 25.5558 48.8888H44.4447C46.8993 48.8888 48.8891 46.899 48.8891 44.4444V31.1111C48.8891 28.6565 46.8993 26.6666 44.4447 26.6666Z" stroke="#0F0F0F" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M21.666 28.9644L24.886 22.4711C25.6371 20.9578 27.1793 20 28.8682 20H41.1305C42.8193 20 44.3616 20.9578 45.1127 22.4711L48.3327 28.9667" stroke="#0F0F0F" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M26.666 43.3334H31.1105" stroke="#0F0F0F" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
</svg>

      `,
      button: '+ Products',
      route: '/pages/products'
    }
  ];

  loading = false;
  error: string | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    const token = this.authService.getToken();
    console.log('CardsComponent: Initial token check', { token: token ? 'Present' : 'Missing' });
    if (token) {
      console.log('CardsComponent: Token found, fetching counts');
      this.fetchCounts();
    } else {
      console.warn('CardsComponent: No token found. Redirecting to login.');
      this.error = 'Please log in to view counts.';
      this.router.navigate(['/auth/signin']);
    }
  }

  fetchCounts(): void {
    this.loading = true;
    this.error = null;
    console.log('CardsComponent: Fetching counts via AuthService');

    this.authService.getCounts().subscribe({
      next: (response: CountResponse) => {
        console.log('CardsComponent: Counts fetched successfully:', response);
        this.cards[0].count = response.totalProjectsCount || 0;
        this.cards[1].count = response.totalClientsCount || 0;
        this.cards[2].count = response.mobileUsersCount || 0;
        this.cards[3].count = response.totalProductsCount || 0;
        this.loading = false;
      },
      error: (error) => {
        console.error('CardsComponent: Error fetching counts:', {
          status: error.status,
          statusText: error.statusText,
          url: error.url,
          message: error.message,
          error: error.error
        });
        this.error = error.status === 401
          ? 'Authentication failed: Please log in again.'
          : 'Failed to load counts. Please try again or contact support.';
        this.cards.forEach(card => (card.count = 0));
        this.loading = false;
      }
    });
  }

  getSafeSvg(svg: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }
}