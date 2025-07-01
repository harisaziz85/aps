import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-svg-icons',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './svg-icons.component.html',
})
export class SvgIconsComponent {
  @Input() icon: string = '';
  @Input() size: string = '24'; // Only number (not '24px')
}
