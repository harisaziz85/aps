import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-image-editor',
  templateUrl: './image-editor.component.html',
  styleUrls: ['./image-editor.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class ImageEditorComponent {
  @ViewChild('imageCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  private image = new Image();
  private rotation = 0;
  private isDragging = false;
  private startX = 0;
  private startY = 0;
  private endX = 0;
  private endY = 0;
  drawingMode: 'none' | 'circle' | 'line' | 'text' | 'arrow' = 'none';
  strokeColor = '#ff0000';
  fontSize = 20;
  currentText = '';
  lineWidth = 2;
  showModal = false;
  showDropdown = false;
  private textPosition: { x: number; y: number } | null = null;
  private shapes: any[] = [];

  get imageSrc(): string {
    return this.image.src;
  }

  ngAfterViewInit() {
    this.initializeCanvas();
  }

  private initializeCanvas() {
    if (this.canvasRef && this.canvasRef.nativeElement) {
      this.ctx = this.canvasRef.nativeElement.getContext('2d')!;
      if (!this.ctx) {
        console.error('Failed to get 2D context for canvas');
        return;
      }
      this.setupCanvasEvents();
      if (this.image.src) {
        this.resizeCanvas();
        this.drawImage();
      }
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.image.src = e.target!.result as string;
        this.image.onload = () => {
          console.log('Image loaded:', this.image.src);
          this.shapes = [];
          this.rotation = 0;
          this.drawingMode = 'none';
          this.currentText = '';
          this.textPosition = null;
          this.showDropdown = false;
          this.resizeCanvas();
          this.drawImage();
        };
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  openModal() {
    if (this.image.src) {
      console.log('Opening modal, imageSrc:', this.image.src);
      this.showModal = true;
      setTimeout(() => {
        this.initializeCanvas();
      }, 100);
    } else {
      console.warn('No image source available to open modal');
    }
  }

  handleEditOption(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    const value = selectElement.value;
    if (value === 'rotate') {
      this.rotate(90);
      selectElement.value = ''; // Reset dropdown to default
      this.showDropdown = false;
    } else if (value === 'circle' || value === 'line' || value === 'text' || value === 'arrow') {
      this.setDrawingMode(value as 'circle' | 'line' | 'text' | 'arrow');
      this.showDropdown = true;
    }
  }

  closeModal() {
    console.log('Closing modal');
    this.showModal = false;
    this.showDropdown = false;
    this.drawingMode = 'none';
    this.currentText = '';
    this.textPosition = null;
    this.drawImage();
  }

  saveChanges() {
    console.log('Saving changes');
    this.closeModal();
  }

  private resizeCanvas() {
    const canvas = this.canvasRef.nativeElement;
    if (this.image.width && this.image.height) {
      canvas.width = this.image.width;
      canvas.height = this.image.height;
      console.log('Canvas resized:', canvas.width, canvas.height);
    } else {
      console.warn('Image dimensions not available for resizing');
    }
  }

  setDrawingMode(mode: 'none' | 'circle' | 'line' | 'text' | 'arrow') {
    this.drawingMode = mode;
    this.isDragging = false;
    this.textPosition = null;
    this.currentText = '';
  }

  private getCanvasCoordinates(x: number, y: number): { x: number; y: number } {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const rad = (this.rotation * Math.PI) / 180;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    let canvasX = (x - rect.left) * scaleX;
    let canvasY = (y - rect.top) * scaleY;

    const tx = canvasX - centerX;
    const ty = canvasY - centerY;
    const rotatedX = tx * Math.cos(-rad) - ty * Math.sin(-rad);
    const rotatedY = tx * Math.sin(-rad) + ty * Math.cos(-rad);
    return {
      x: rotatedX + centerX,
      y: rotatedY + centerY
    };
  }

  private drawArrowHead(x: number, y: number, angle: number) {
    const arrowSize = 10;
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(
      x - arrowSize * Math.cos(angle - Math.PI / 6),
      y - arrowSize * Math.sin(angle - Math.PI / 6)
    );
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(
      x - arrowSize * Math.cos(angle + Math.PI / 6),
      y - arrowSize * Math.sin(angle + Math.PI / 6)
    );
    this.ctx.stroke();
  }

  drawImage() {
    if (!this.ctx) {
      console.error('Canvas context not available');
      return;
    }
    const canvas = this.canvasRef.nativeElement;
    this.ctx.save();
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);

    this.ctx.translate(canvas.width / 2, canvas.height / 2);
    this.ctx.rotate((this.rotation * Math.PI) / 180);
    this.ctx.translate(-canvas.width / 2, -canvas.height / 2);

    if (this.image.complete && this.image.src) {
      this.ctx.drawImage(this.image, 0, 0);
      console.log('Image drawn on canvas');
    } else {
      console.warn('Image not ready for drawing');
    }

    this.shapes.forEach(shape => {
      this.ctx.save();
      this.ctx.strokeStyle = shape.color;
      this.ctx.lineWidth = shape.lineWidth;
      if (shape.type === 'circle') {
        this.ctx.beginPath();
        const radius = Math.sqrt(
          Math.pow(shape.endX - shape.startX, 2) + Math.pow(shape.endY - shape.startY, 2)
        );
        this.ctx.arc(shape.startX, shape.startY, radius, 0, 2 * Math.PI);
        this.ctx.stroke();
      } else if (shape.type === 'line') {
        this.ctx.beginPath();
        this.ctx.moveTo(shape.startX, shape.startY);
        this.ctx.lineTo(shape.endX, shape.endY);
        this.ctx.stroke();
      } else if (shape.type === 'arrow') {
        this.ctx.beginPath();
        this.ctx.moveTo(shape.startX, shape.startY);
        this.ctx.lineTo(shape.endX, shape.endY);
        this.ctx.stroke();
        const angle = Math.atan2(shape.endY - shape.startY, shape.endX - shape.startX);
        this.drawArrowHead(shape.endX, shape.endY, angle);
      } else if (shape.type === 'text') {
        this.ctx.font = `${shape.fontSize}px Arial`;
        this.ctx.fillStyle = shape.color;
        this.ctx.fillText(shape.text, shape.x, shape.y);
      }
      this.ctx.restore();
    });

    if (this.textPosition && this.drawingMode === 'text') {
      this.ctx.save();
      this.ctx.font = `${this.fontSize}px Arial`;
      this.ctx.fillStyle = this.strokeColor;
      this.ctx.fillText(this.currentText, this.textPosition.x, this.textPosition.y);
      this.ctx.restore();
    }

    this.ctx.restore();
  }

  rotate(degrees: number) {
    this.rotation = (this.rotation + degrees) % 360;
    this.drawImage();
  }

  private setupCanvasEvents() {
    const canvas = this.canvasRef.nativeElement;

    canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      const transformed = this.getCanvasCoordinates(e.clientX, e.clientY);
      this.startX = transformed.x;
      this.startY = transformed.y;

      if (this.drawingMode === 'text') {
        this.textPosition = { x: this.startX, y: this.startY };
        this.currentText = '';
        this.isDragging = false;
        canvas.focus();
      }
    });

    canvas.addEventListener('mousemove', (e) => {
      if (this.isDragging && (this.drawingMode === 'circle' || this.drawingMode === 'line' || this.drawingMode === 'arrow')) {
        const transformed = this.getCanvasCoordinates(e.clientX, e.clientY);
        this.endX = transformed.x;
        this.endY = transformed.y;

        this.drawImage();

        this.ctx.save();
        this.ctx.strokeStyle = this.strokeColor;
        this.ctx.lineWidth = this.lineWidth;

        this.ctx.translate(canvas.width / 2, canvas.height / 2);
        this.ctx.rotate((this.rotation * Math.PI) / 180);
        this.ctx.translate(-canvas.width / 2, -canvas.height / 2);

        if (this.drawingMode === 'circle') {
          this.ctx.beginPath();
          const radius = Math.sqrt(
            Math.pow(this.endX - this.startX, 2) + Math.pow(this.endY - this.startY, 2)
          );
          this.ctx.arc(this.startX, this.startY, radius, 0, 2 * Math.PI);
          this.ctx.stroke();
        } else if (this.drawingMode === 'line') {
          this.ctx.beginPath();
          this.ctx.moveTo(this.startX, this.startY);
          this.ctx.lineTo(this.endX, this.endY);
          this.ctx.stroke();
        } else if (this.drawingMode === 'arrow') {
          this.ctx.beginPath();
          this.ctx.moveTo(this.startX, this.startY);
          this.ctx.lineTo(this.endX, this.endY);
          this.ctx.stroke();
          const angle = Math.atan2(this.endY - this.startY, this.endX - this.startX);
          this.drawArrowHead(this.endX, this.endY, angle);
        }
        this.ctx.restore();
      }
    });

    canvas.addEventListener('mouseup', () => {
      if (this.isDragging && (this.drawingMode === 'circle' || this.drawingMode === 'line' || this.drawingMode === 'arrow')) {
        this.shapes.push({
          type: this.drawingMode,
          startX: this.startX,
          startY: this.startY,
          endX: this.endX,
          endY: this.endY,
          color: this.strokeColor,
          lineWidth: this.lineWidth
        });
        this.isDragging = false;
        this.drawImage();
      }
    });

    canvas.addEventListener('keydown', (e) => {
      if (this.drawingMode === 'text' && this.textPosition) {
        if (e.key === 'Enter') {
          if (this.currentText) {
            this.shapes.push({
              type: 'text',
              text: this.currentText,
              x: this.textPosition.x,
              y: this.textPosition.y,
              color: this.strokeColor,
              fontSize: this.fontSize
            });
            this.currentText = '';
            this.textPosition = null;
            this.drawingMode = 'none';
            this.showDropdown = false;
          }
          this.drawImage();
        } else if (e.key === 'Backspace') {
          this.currentText = this.currentText.slice(0, -1);
          this.drawImage();
        } else if (e.key.length === 1) {
          this.currentText += e.key;
          this.drawImage();
        }
        e.preventDefault();
      }
    });
  }
}