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
  private brightness = 1;
  private rotation = 0;
  private isDragging = false;
  private startX = 0;
  private startY = 0;
  private endX = 0;
  private endY = 0;
  drawingMode: 'none' | 'circle' | 'line' | 'text' = 'none';
  strokeColor = '#ff0000';
  fontSize = 20;
  textInput = '';
  lineWidth = 2;
  constrainToSquare = false;
  showModal = false;
  private textPosition: { x: number; y: number } | null = null;
  private shapes: any[] = [];
  private history: { imageSrc: string; shapes: any[]; rotation: number; brightness: number }[] = [];
  private historyLimit = 20;

  get canUndo(): boolean {
    return this.history.length > 1;
  }

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
          this.history = [];
          this.rotation = 0;
          this.brightness = 1;
          this.saveState();
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
      }, 100); // Increased delay to ensure modal DOM is ready
    } else {
      console.warn('No image source available to open modal');
    }
  }

  closeModal() {
    console.log('Closing modal');
    this.showModal = false;
    this.drawImage();
  }

  saveChanges() {
    console.log('Saving changes');
    this.saveState();
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

  private saveState() {
    this.history.push({
      imageSrc: this.image.src,
      shapes: JSON.parse(JSON.stringify(this.shapes)),
      rotation: this.rotation,
      brightness: this.brightness
    });
    if (this.history.length > this.historyLimit) {
      this.history.shift();
    }
  }

  undo() {
    if (this.history.length > 1) {
      this.history.pop();
      const previousState = this.history[this.history.length - 1];
      this.image.src = previousState.imageSrc;
      this.shapes = JSON.parse(JSON.stringify(previousState.shapes));
      this.rotation = previousState.rotation;
      this.brightness = previousState.brightness;
      this.image.onload = () => {
        console.log('Undo: Image reloaded');
        this.resizeCanvas();
        this.drawImage();
      };
    }
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

    this.ctx.filter = `brightness(${this.brightness * 100}%)`;

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
      } else if (shape.type === 'text') {
        this.ctx.font = `${shape.fontSize}px Arial`;
        this.ctx.fillStyle = shape.color;
        this.ctx.fillText(shape.text, shape.x, shape.y);
      }
      this.ctx.restore();
    });

    this.ctx.restore();
  }

  rotate(degrees: number) {
    this.rotation = (this.rotation + degrees) % 360;
    this.saveState();
    this.drawImage();
  }

  crop() {
    const canvas = this.canvasRef.nativeElement;
    const width = Math.abs(this.endX - this.startX);
    const height = Math.abs(this.endY - this.startY);
    const sx = Math.min(this.startX, this.endX);
    const sy = Math.min(this.startY, this.endY);

    if (width <= 0 || height <= 0) {
      console.warn('Invalid crop dimensions');
      return;
    }

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d')!;

    tempCtx.drawImage(
      this.image,
      sx, sy, width, height,
      0, 0, width, height
    );

    this.image.src = tempCanvas.toDataURL();
    this.image.onload = () => {
      console.log('Crop: Image reloaded');
      this.rotation = 0;
      this.shapes = [];
      this.saveState();
      this.resizeCanvas();
      this.drawImage();
    };
  }

  adjustBrightness(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input) {
      this.brightness = parseFloat(input.value);
      this.saveState();
      this.drawImage();
    }
  }

  changeDrawingMode() {
    this.isDragging = false;
    this.textPosition = null;
  }

  addText() {
    if (this.textPosition && this.textInput) {
      this.shapes.push({
        type: 'text',
        text: this.textInput,
        x: this.textPosition.x,
        y: this.textPosition.y,
        color: this.strokeColor,
        fontSize: this.fontSize
      });
      this.textInput = '';
      this.textPosition = null;
      this.saveState();
      this.drawImage();
    }
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
        this.isDragging = false;
      }
    });

    canvas.addEventListener('mousemove', (e) => {
      if (this.isDragging && this.drawingMode !== 'text') {
        const transformed = this.getCanvasCoordinates(e.clientX, e.clientY);
        this.endX = transformed.x;
        this.endY = transformed.y;

        if (this.drawingMode === 'none' && this.constrainToSquare) {
          const width = Math.abs(this.endX - this.startX);
          this.endY = this.startY + (this.endX > this.startX ? width : -width);
        }

        this.drawImage();

        this.ctx.save();
        this.ctx.strokeStyle = this.drawingMode === 'none' ? 'red' : this.strokeColor;
        this.ctx.lineWidth = this.drawingMode === 'none' ? 2 : this.lineWidth;

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
        } else if (this.drawingMode === 'none') {
          this.ctx.strokeRect(
            this.startX,
            this.startY,
            this.endX - this.startX,
            this.endY - this.startY
          );
        }
        this.ctx.restore();
      }
    });

    canvas.addEventListener('mouseup', () => {
      if (this.isDragging && this.drawingMode !== 'text') {
        if (this.drawingMode === 'circle' || this.drawingMode === 'line') {
          this.shapes.push({
            type: this.drawingMode,
            startX: this.startX,
            startY: this.startY,
            endX: this.endX,
            endY: this.endY,
            color: this.strokeColor,
            lineWidth: this.lineWidth
          });
          this.saveState();
        } else if (this.drawingMode === 'none') {
          this.crop();
        }
        this.isDragging = false;
        this.drawImage();
      }
    });
  }
}