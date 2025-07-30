import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Drawing {
  type: 'circle' | 'line' | 'text' | 'arrow';
  startX: number;
  startY: number;
  endX?: number;
  endY?: number;
  radius?: number;
  text?: string;
  color: string;
  lineWidth: number;
}

@Component({
  selector: 'app-imagemodal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './imagemodal.component.html',
  styleUrls: ['./imagemodal.component.css']
})
export class ImageModalComponent implements AfterViewInit {
  @Input() isOpen: boolean = false;
  @Input() imageUrl: string = '';
  @Output() close = new EventEmitter<void>();

  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('image') imageRef!: ElementRef<HTMLImageElement>;

  private ctx!: CanvasRenderingContext2D;
  private isDrawing = false;
  private startX = 0;
  private startY = 0;
  private currentX = 0;
  private currentY = 0;
  private drawings: Drawing[] = [];
  currentTool: 'circle' | 'line' | 'text' | 'arrow' = 'circle';
  color: string = '#000000';
  lineWidth: number = 2;
  textInput: string = '';
  isDropdownOpen: boolean = false;
  isToolSelected: boolean = false;

  ngAfterViewInit() {
    this.initCanvas();
  }

  initCanvas() {
    const canvas = this.canvasRef.nativeElement;
    const image = this.imageRef.nativeElement;
    canvas.width = image.width;
    canvas.height = image.height;
    this.ctx = canvas.getContext('2d')!;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.redrawCanvas();
  }

  redrawCanvas() {
    this.ctx.clearRect(0, 0, this.canvasRef.nativeElement.width, this.canvasRef.nativeElement.height);
    this.ctx.drawImage(this.imageRef.nativeElement, 0, 0);

    this.drawings.forEach(drawing => {
      this.ctx.beginPath();
      this.ctx.strokeStyle = drawing.color;
      this.ctx.fillStyle = drawing.color;
      this.ctx.lineWidth = drawing.lineWidth;

      if (drawing.type === 'circle' && drawing.radius) {
        this.ctx.arc(drawing.startX, drawing.startY, drawing.radius, 0, 2 * Math.PI);
        this.ctx.stroke();
      } else if (drawing.type === 'line' && drawing.endX && drawing.endY) {
        this.ctx.moveTo(drawing.startX, drawing.startY);
        this.ctx.lineTo(drawing.endX, drawing.endY);
        this.ctx.stroke();
      } else if (drawing.type === 'text' && drawing.text) {
        this.ctx.font = '20px Arial';
        this.ctx.fillText(drawing.text, drawing.startX, drawing.startY);
      } else if (drawing.type === 'arrow' && drawing.endX && drawing.endY) {
        this.drawArrow(drawing.startX, drawing.startY, drawing.endX, drawing.endY);
      }
      this.ctx.closePath();
    });
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  setTool(tool: 'circle' | 'line' | 'text' | 'arrow') {
    this.currentTool = tool;
    this.isToolSelected = true;
    this.isDropdownOpen = false;
    if (tool === 'text') {
      this.textInput = prompt('Enter text:') || '';
    }
  }

  updateColor() {
    this.ctx.strokeStyle = this.color;
    this.ctx.fillStyle = this.color;
  }

  startDrawing(event: MouseEvent) {
    this.isDrawing = true;
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    this.startX = event.clientX - rect.left;
    this.startY = event.clientY - rect.top;
    this.currentX = this.startX;
    this.currentY = this.startY;
    if (this.currentTool === 'text') {
      this.drawings.push({
        type: 'text',
        startX: this.startX,
        startY: this.startY,
        text: this.textInput,
        color: this.color,
        lineWidth: this.lineWidth
      });
      this.redrawCanvas();
      this.isDrawing = false;
    }
  }

  draw(event: MouseEvent) {
    if (!this.isDrawing) return;
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    this.currentX = event.clientX - rect.left;
    this.currentY = event.clientY - rect.top;

    this.redrawCanvas();
    this.ctx.beginPath();
    this.ctx.strokeStyle = this.color;
    this.ctx.lineWidth = this.lineWidth;

    if (this.currentTool === 'circle') {
      const radius = Math.sqrt(Math.pow(this.currentX - this.startX, 2) + Math.pow(this.currentY - this.startY, 2));
      this.ctx.arc(this.startX, this.startY, radius, 0, 2 * Math.PI);
      this.ctx.stroke();
    } else if (this.currentTool === 'line') {
      this.ctx.moveTo(this.startX, this.startY);
      this.ctx.lineTo(this.currentX, this.currentY);
      this.ctx.stroke();
    } else if (this.currentTool === 'arrow') {
      this.drawArrow(this.startX, this.startY, this.currentX, this.currentY);
    }
    this.ctx.closePath();
  }

  drawArrow(fromX: number, fromY: number, toX: number, toY: number) {
    const headLength = 10;
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);
    this.ctx.moveTo(fromX, fromY);
    this.ctx.lineTo(toX, toY);
    this.ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
    this.ctx.moveTo(toX, toY);
    this.ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
    this.ctx.stroke();
  }

  stopDrawing() {
    if (this.isDrawing && this.currentTool !== 'text') {
      this.drawings.push({
        type: this.currentTool,
        startX: this.startX,
        startY: this.startY,
        endX: this.currentX,
        endY: this.currentY,
        radius: this.currentTool === 'circle' ? Math.sqrt(Math.pow(this.currentX - this.startX, 2) + Math.pow(this.currentY - this.startY, 2)) : undefined,
        color: this.color,
        lineWidth: this.lineWidth
      });
      this.isDrawing = false;
      this.redrawCanvas();
    }
  }

  undo() {
    this.drawings.pop();
    this.redrawCanvas();
  }

  saveImage() {
    const link = document.createElement('a');
    link.download = 'edited-image.png';
    link.href = this.canvasRef.nativeElement.toDataURL();
    link.click();
  }

  closeModal() {
    this.close.emit();
    document.body.style.overflow = 'auto';
  }
}