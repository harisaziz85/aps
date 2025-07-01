import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
@Component({
  selector: 'app-foot',
  standalone: true,
  templateUrl: './foot.component.html',
    imports: [RouterModule],
  styleUrl: './foot.component.css'
})
export class FootComponent {
  isActive: boolean = false;

  setActive() {
      this.isActive = true;
  }
  
}
