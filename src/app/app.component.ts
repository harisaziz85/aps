import { Component,ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.css',
  encapsulation: ViewEncapsulation.None  
})
export class AppComponent {
  title = 'asp';
}
