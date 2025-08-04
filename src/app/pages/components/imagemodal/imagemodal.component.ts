import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

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

interface PhotoUpdateResponse {
  instanceId: string;
  photoId: string;
  category: string;
  url: string;
}

@Component({
  selector: 'app-imagemodal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './imagemodal.component.html',
  styleUrls: ['./imagemodal.component.css']
})
export class ImageModalComponent implements AfterViewInit, OnChanges {
  @Input() isOpen: boolean = false;
  @Input() imageUrl: string = '';
  @Input() instanceId: string = '';
  @Input() photoId: string = '';
  @Input() category: string = '';
  @Output() close = new EventEmitter<PhotoUpdateResponse | null>();

  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('image') imageRef!: ElementRef<HTMLImageElement>;

  ctx!: CanvasRenderingContext2D;
  private isDrawing = false;
  private startX = 0;
  private startY = 0;
  private currentX = 0;
  private currentY = 0;
  private drawings: Drawing[] = [];
  private scaleX = 1;
  private scaleY = 1;
  imageLoaded = false;
  currentTool: 'circle' | 'line' | 'text' | 'arrow' = 'circle';
  color: string = '#000000';
  lineWidth: number = 2;
  textInput: string = '';
  isEditMode: boolean = false;

  constructor(private http: HttpClient) {}

  ngAfterViewInit() {
    setTimeout(() => {
      if (this.imageUrl && this.isOpen) {
        this.loadImage();
      }
    }, 100);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['imageUrl'] && this.imageUrl) {
      console.log('Image URL changed:', this.imageUrl);
      this.imageLoaded = false;
      this.drawings = [];
      setTimeout(() => {
        this.loadImage();
      }, 100);
    }

    if (changes['isOpen'] && this.isOpen && this.imageUrl) {
      console.log('Modal opened');
      setTimeout(() => {
        if (!this.imageLoaded) {
          this.loadImage();
        }
      }, 100);
    }
  }

  loadImage() {
    const image = this.imageRef.nativeElement;
    this.imageLoaded = false;
    this.drawings = [];

    const canvasImage = new Image();
    canvasImage.crossOrigin = 'anonymous';
    canvasImage.onload = () => {
      console.log('Image loaded successfully with CORS');
      image.src = this.imageUrl;
      this.imageLoaded = true;
      this.initCanvas(canvasImage);
    };

    canvasImage.onerror = (error) => {
      console.warn('CORS failed, loading without CORS');
      canvasImage.crossOrigin = '';
      canvasImage.onload = () => {
        console.log('Image loaded without CORS (export may fail)');
        image.src = this.imageUrl;
        this.imageLoaded = true;
        this.initCanvas(canvasImage);
      };
      canvasImage.onerror = (error) => {
        console.error('Failed to load image:', error);
        alert('Failed to load image. Please check the image URL.');
        this.createPlaceholderCanvas();
      };
      canvasImage.src = this.imageUrl;
    };

    canvasImage.src = this.imageUrl;
  }

  initCanvas(canvasImage: HTMLImageElement) {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) {
      console.error('Canvas element not found');
      return;
    }

    canvas.width = 600;
    canvas.height = 600;

    if (canvasImage.naturalWidth && canvasImage.naturalHeight) {
      this.scaleX = 600 / canvasImage.naturalWidth;
      this.scaleY = 600 / canvasImage.naturalHeight;
    } else {
      this.scaleX = 1;
      this.scaleY = 1;
    }

    this.ctx = canvas.getContext('2d')!;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    this.redrawCanvas(canvasImage);
  }

  createPlaceholderCanvas() {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;

    canvas.width = 600;
    canvas.height = 600;
    this.ctx = canvas.getContext('2d')!;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    this.ctx.fillStyle = '#f0f0f0';
    this.ctx.fillRect(0, 0, 600, 600);
    this.ctx.fillStyle = '#666';
    this.ctx.font = '20px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Image Preview', 300, 300);
  }

  redrawCanvas(canvasImage?: HTMLImageElement) {
    if (!this.ctx) return;

    this.ctx.clearRect(0, 0, 600, 600);

    if (canvasImage && canvasImage.complete) {
      try {
        this.ctx.drawImage(canvasImage, 0, 0, 600, 600);
      } catch (error) {
        console.error('Failed to draw image on canvas:', error);
        this.ctx.fillStyle = '#f0f0f0';
        this.ctx.fillRect(0, 0, 600, 600);
      }
    }

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

  toggleEditMode() {
    this.isEditMode = !this.isEditMode;
  }

  setTool(tool: 'circle' | 'line' | 'text' | 'arrow') {
    this.currentTool = tool;
    if (tool === 'text') {
      this.textInput = prompt('Enter text:') || '';
    }
  }

  updateColor() {
    this.ctx.strokeStyle = this.color;
    this.ctx.fillStyle = this.color;
  }

  startDrawing(event: MouseEvent) {
    if (!this.isEditMode) return;

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
      this.redrawCanvas(this.imageRef.nativeElement);
      this.isDrawing = false;
    }
  }

  draw(event: MouseEvent) {
    if (!this.isDrawing || !this.isEditMode) return;

    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    this.currentX = event.clientX - rect.left;
    this.currentY = event.clientY - rect.top;

    this.redrawCanvas(this.imageRef.nativeElement);
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
      this.redrawCanvas(this.imageRef.nativeElement);
    }
  }

  undo() {
    this.drawings.pop();
    this.redrawCanvas(this.imageRef.nativeElement);
  }

  saveImage() {
    const canvas = this.canvasRef.nativeElement;
    const image = this.imageRef.nativeElement;

    // Create a temporary canvas to combine image and drawings
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 600;
    tempCanvas.height = 600;
    const tempCtx = tempCanvas.getContext('2d')!;

    try {
      // Draw the background image
      tempCtx.drawImage(image, 0, 0, 600, 600);

      // Draw all annotations
      this.drawings.forEach(drawing => {
        tempCtx.beginPath();
        tempCtx.strokeStyle = drawing.color;
        tempCtx.fillStyle = drawing.color;
        tempCtx.lineWidth = drawing.lineWidth;

        if (drawing.type === 'circle' && drawing.radius) {
          tempCtx.arc(drawing.startX, drawing.startY, drawing.radius, 0, 2 * Math.PI);
          tempCtx.stroke();
        } else if (drawing.type === 'line' && drawing.endX && drawing.endY) {
          tempCtx.moveTo(drawing.startX, drawing.startY);
          tempCtx.lineTo(drawing.endX, drawing.endY);
          tempCtx.stroke();
        } else if (drawing.type === 'text' && drawing.text) {
          tempCtx.font = '20px Arial';
          tempCtx.fillText(drawing.text, drawing.startX, drawing.startY);
        } else if (drawing.type === 'arrow' && drawing.endX && drawing.endY) {
          this.drawArrowOnContext(tempCtx, drawing.startX, drawing.startY, drawing.endX, drawing.endY);
        }
        tempCtx.closePath();
      });

      // Export the combined image
      tempCanvas.toBlob((blob) => {
        if (blob) {
          this.uploadImage(blob);
        } else {
          this.handleSaveError('Failed to generate image blob');
        }
      }, 'image/png');
    } catch (error) {
      console.error('Failed to save image with background:', error);
      this.saveDrawingsOnly();
    }
  }

  private saveDrawingsOnly() {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 600;
    tempCanvas.height = 600;
    const tempCtx = tempCanvas.getContext('2d')!;

    tempCtx.fillStyle = '#ffffff';
    tempCtx.fillRect(0, 0, 600, 600);

    this.drawings.forEach(drawing => {
      tempCtx.beginPath();
      tempCtx.strokeStyle = drawing.color;
      tempCtx.fillStyle = drawing.color;
      tempCtx.lineWidth = drawing.lineWidth;

      if (drawing.type === 'circle' && drawing.radius) {
        tempCtx.arc(drawing.startX, drawing.startY, drawing.radius, 0, 2 * Math.PI);
        tempCtx.stroke();
      } else if (drawing.type === 'line' && drawing.endX && drawing.endY) {
        tempCtx.moveTo(drawing.startX, drawing.startY);
        tempCtx.lineTo(drawing.endX, drawing.endY);
        tempCtx.stroke();
      } else if (drawing.type === 'text' && drawing.text) {
        tempCtx.font = '20px Arial';
        tempCtx.fillText(drawing.text, drawing.startX, drawing.startY);
      } else if (drawing.type === 'arrow' && drawing.endX && drawing.endY) {
        this.drawArrowOnContext(tempCtx, drawing.startX, drawing.startY, drawing.endX, drawing.endY);
      }
      tempCtx.closePath();
    });

    try {
      tempCanvas.toBlob((blob) => {
        if (blob) {
          console.log('Saving annotations only (original image could not be included due to CORS)');
          this.uploadImage(blob);
        } else {
          this.handleSaveError('Failed to save annotations');
        }
      }, 'image/png');
    } catch (error) {
      this.handleSaveError('Failed to save annotations');
    }
  }

  private drawArrowOnContext(ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number) {
    const headLength = 10;
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);

    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
  }

  private uploadImage(blob: Blob) {
    const formData = new FormData();
    formData.append('instanceId', this.instanceId);
    formData.append('photo', blob, 'edited-image.png');
    formData.append('category', this.category);
    formData.append('photoId', this.photoId);

    this.http.post('https://vps.allpassiveservices.com.au/api/project-instance/update-photo', formData).subscribe({
      next: (response: any) => {
        console.log('Photo updated successfully:', response);
        const updateResponse: PhotoUpdateResponse = {
          instanceId: this.instanceId,
          photoId: this.photoId,
          category: this.category,
          url: response.url || this.imageUrl
        };
        this.close.emit(updateResponse);
        document.body.style.overflow = 'auto';
      },
      error: (error) => {
        console.error('Failed to update photo:', error);
        alert('Failed to update photo. Please try again.');
        this.close.emit(null);
      }
    });
  }

  private handleSaveError(message: string = 'Unable to save the edited image due to cross-origin restrictions') {
    alert(`${message}. The annotations have been saved separately. Please contact support if needed.`);
    this.close.emit(null);
  }

  closeModal() {
    this.close.emit(null);
    document.body.style.overflow = 'auto';
  }
}