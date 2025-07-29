import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-image-editor',
  template: `
    <div class="image-editor-container">
      <input type="file" accept="image/*" (change)="onFileSelected($event)">
      <div class="canvas-container">
        <canvas #imageCanvas></canvas>
      </div>
      <div class="controls">
        <button (click)="rotate(90)">Rotate 90°</button>
        <button (click)="crop()">Crop Selection</button>
        <label>Brightness: 
          <input type="range" min="0" max="2" step="0.1" value="1" 
                 (input)="adjustBrightness($event)">
        </label>
        <button (click)="download()">Download</button>
      </div>
      <div class="drawing-controls">
        <label>Tool:
          <select [(ngModel)]="drawingMode" (change)="changeDrawingMode()">
            <option value="none">None</option>
            <option value="circle">Circle</option>
            <option value="line">Line</option>
            <option value="text">Text</option>
          </select>
        </label>
        <label>Color:
          <input type="color" [(ngModel)]="strokeColor">
        </label>
        <label>Line Width:
          <input type="number" min="1" max="20" [(ngModel)]="lineWidth">
        </label>
        <label *ngIf="drawingMode === 'text'">Font Size:
          <input type="number" min="10" max="100" [(ngModel)]="fontSize">
        </label>
        <label *ngIf="drawingMode === 'text'">Text:
          <input type="text" [(ngModel)]="textInput" placeholder="Enter text">
        </label>
        <button *ngIf="drawingMode === 'text'" (click)="addText()">Add Text</button>
      </div>
    </div>

    <style>
      .image-editor-container {
        padding: 20px;
        max-width: 800px;
        margin: 0 auto;
      }
      .canvas-container {
        border: 1px solid #ccc;
        margin: 20px 0;
      }
      canvas {
        max-width: 100%;
      }
      .controls, .drawing-controls {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        margin-bottom: 10px;
      }
      button {
        padding: 8px 16px;
        cursor: pointer;
      }
      input, select {
        padding: 5px;
      }
    </style>
  `,
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
  private textPosition: { x: number; y: number } | null = null;
  private shapes: any[] = [];

  ngAfterViewInit() {
    this.ctx = this.canvasRef.nativeElement.getContext('2d')!;
    this.setupCanvasEvents();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.image.src = e.target!.result as string;
        this.image.onload = () => {
          this.shapes = []; // Clear shapes when new image is loaded
          this.drawImage();
        };
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  drawImage() {
    const canvas = this.canvasRef.nativeElement;
    canvas.width = this.image.width;
    canvas.height = this.image.height;
    
    this.ctx.save();
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Apply rotation
    this.ctx.translate(canvas.width / 2, canvas.height / 2);
    this.ctx.rotate((this.rotation * Math.PI) / 180);
    this.ctx.translate(-canvas.width / 2, -canvas.height / 2);
    
    // Apply brightness
    this.ctx.filter = `brightness(${this.brightness * 100}%)`;
    
    this.ctx.drawImage(this.image, 0, 0);
    
    // Draw saved shapes
    this.shapes.forEach(shape => {
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
    });
    
    this.ctx.restore();
  }

  rotate(degrees: number) {
    this.rotation = (this.rotation + degrees) % 360;
    this.drawImage();
  }

  crop() {
    const canvas = this.canvasRef.nativeElement;
    const width = Math.abs(this.endX - this.startX);
    const height = Math.abs(this.endY - this.startY);
    const sx = Math.min(this.startX, this.endX);
    const sy = Math.min(this.startY, this.endY);

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
      this.rotation = 0;
      this.shapes = []; // Clear shapes after crop
      this.drawImage();
    };
  }

  adjustBrightness(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input) {
      this.brightness = parseFloat(input.value);
      this.drawImage();
    }
  }

  download() {
    const canvas = this.canvasRef.nativeElement;
    const link = document.createElement('a');
    link.download = 'edited-image.png';
    link.href = canvas.toDataURL();
    link.click();
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
      this.drawImage();
    }
  }

  private setupCanvasEvents() {
    const canvas = this.canvasRef.nativeElement;
    
    canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      const rect = canvas.getBoundingClientRect();
      this.startX = e.clientX - rect.left;
      this.startY = e.clientY - rect.top;
      
      if (this.drawingMode === 'text') {
        this.textPosition = { x: this.startX, y: this.startY };
        this.isDragging = false;
      }
    });

    canvas.addEventListener('mousemove', (e) => {
      if (this.isDragging && this.drawingMode !== 'text') {
        const rect = canvas.getBoundingClientRect();
        this.endX = e.clientX - rect.left;
        this.endY = e.clientY - rect.top;
        
        this.drawImage();
        this.ctx.strokeStyle = this.strokeColor;
        this.ctx.lineWidth = this.lineWidth;
        
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
        } else {
          // Draw crop rectangle
          this.ctx.strokeStyle = 'red';
          this.ctx.lineWidth = 2;
          this.ctx.strokeRect(
            this.startX,
            this.startY,
            this.endX - this.startX,
            this.endY - this.startY
          );
        }
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
        }
        this.isDragging = false;
        this.drawImage();
      }
    });
  }
}