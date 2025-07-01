import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { RouterLink, Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-slider',
  templateUrl: './slider.component.html',
  standalone: true,
  imports: [CommonModule, RouterLink],
  styleUrls: ['./slider.component.css'],
})
export class SliderComponent implements AfterViewInit, OnDestroy {
  activeButton: string = 'button1'; // Default active button
  bgSlideWidth: number = 0; // Width of the background slide
  bgSlideTransform: string = 'translateX(0px)'; // Transform for positioning
  private routerSubscription: Subscription;

  @ViewChild('button1') button1!: ElementRef;
  @ViewChild('button2') button2!: ElementRef;

  constructor(private router: Router) {
    // Subscribe to router events to update slide on navigation
    this.routerSubscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        // Set active button based on current route
        if (event.url.includes('/pages/approval-documents')) {
          this.activeButton = 'button2';
        } else if (event.url.includes('/pages/products')) {
          this.activeButton = 'button1';
        }
        // Update slide after view is initialized
        setTimeout(() => this.updateSlide(), 0);
      }
    });
  }

  ngAfterViewInit() {
    // Set initial width and position
    this.updateSlide();
  }

  ngOnDestroy() {
    // Clean up subscription
    this.routerSubscription.unsubscribe();
  }

  setActive(button: string) {
    this.activeButton = button;
    this.updateSlide();
  }

  updateSlide() {
    if (this.button1 && this.button2) {
      // Get the active button
      const activeBtn = this.activeButton === 'button1' ? this.button1 : this.button2;

      // Set the width of the bg-slide
      this.bgSlideWidth = activeBtn.nativeElement.offsetWidth;

      // Calculate the position (offsetLeft relative to the container)
      const offsetLeft = activeBtn.nativeElement.offsetLeft;
      this.bgSlideTransform = `translateX(${offsetLeft}px)`;
    }
  }
}