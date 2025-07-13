import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Modal } from 'bootstrap';
import jsPDF from 'jspdf';
// import { NavbarComponent } from "../components/navbar/navbar.component";
import { PagesModule } from "../pages.module";
import { NavbarComponent } from "../components/navbar/navbar.component";
import { TopbarComponent } from '../components/topbar/topbar.component';
import { FootComponent } from "../components/foot/foot.component";

interface ProjectReport {
  coverLetter: {
    reportTitle: string;
  };
}

interface CoverLetterData {
  address: string;
  date: string;
  buildingName: string;
  reportTitle: string;
  additionalInfo: string;
  clientName: string;
  inspectionOverview: {
    totalItems: string;
    passedItems: string;
    failedItems: string;
    tbcItems: string;
  };
}

interface TableRow {
  'Ref No': string;
  Location: string;
  Plan: string;
  Type: string;
  Substrate: string;
  FRL: string;
  Result: string;
  Photos: string;
  Comments: string;
}

@Component({
  selector: 'app-update-step5',
  standalone: true,
  templateUrl: './update-step5.component.html',
  styleUrls: ['./update-step5.component.css'],
  imports: [CommonModule, FormsModule, NavbarComponent, TopbarComponent, FootComponent]
})
export class UpdateStep5Component implements OnInit, AfterViewInit {
  @ViewChild('rightModal') rightModal!: ElementRef;
  projectId: string | null = null;
  serviceProjectId: string | null = null;
  reports: ProjectReport[] = [];
  errorMessage: string | null = null;
  projectAttributes: any = {};
  private rightModalInstance: Modal | null = null;
  selectedAttributes: { [key: string]: boolean } = {};
  coverLetterData: CoverLetterData = {
    address: 'N/A',
    date: new Date().toISOString().split('T')[0],
    buildingName: 'N/A',
    reportTitle: 'N/A',
    additionalInfo: 'N/A',
    clientName: 'N/A',
    inspectionOverview: { totalItems: 'N/A', passedItems: 'N/A', failedItems: 'N/A', tbcItems: 'N/A' }
  };
  isModalOpen: boolean = false;
  projectData: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.projectId = params['id'] || null;
      this.serviceProjectId = this.projectId;

      if (this.projectId) {
        this.fetchProjectReports(this.projectId);
        this.fetchProjectAttributes(this.projectId);
        this.fetchCoverLetterData(this.projectId);
        this.fetchProjectData(this.projectId);
      }
    });

    this.route.queryParams.subscribe(queryParams => {
      const openModal = queryParams['openModal'];
      const from = queryParams['from'];
      if (openModal === 'true' || from === 'coverletter') {
        this.isModalOpen = true;
        setTimeout(() => this.openRightModal(), 0);
      }
    });
  }

  ngAfterViewInit() {
    if (this.rightModal) {
      this.rightModalInstance = new Modal(this.rightModal.nativeElement, { backdrop: 'static', keyboard: false });
      if (this.isModalOpen) {
        this.openRightModal();
      }
    }
  }

  fetchProjectData(projectId: string) {
    this.http.get<any>(`https://aspbackend-production.up.railway.app/api/project/download/${projectId}`)
      .subscribe({
        next: (response) => {
          this.projectData = response;
        },
        error: (error) => {
          this.errorMessage = 'Failed to load project data. Please try again later.';
          console.error('Error fetching project data:', error);
        }
      });
  }

  fetchProjectReports(projectId: string) {
    this.http.get<{ data: ProjectReport[] }>(`https://vps.allpassiveservices.com.au/api/project/reports/${projectId}`)
      .subscribe({
        next: (response) => {
          this.reports = response.data;
        },
        error: (error) => {
          this.errorMessage = 'Failed to load project reports. Please try again later.';
          console.error('Error fetching reports:', error);
        }
      });
  }

  fetchProjectAttributes(projectId: string) {
    this.http.get<any>(`https://vps.allpassiveservices.com.au/api/project/attributes/${projectId}`)
      .subscribe({
        next: (response) => {
          this.projectAttributes = response.data;
          ['Report Type', 'Sub-category', 'Penetration', 'Product Name', 'Approval', 'Building', 'Level', 'Item #', 'Test Reference', 'Location', 'FRL', 'Barrier', 'Description', 'Date', 'Installer', 'Inspector', 'Safety Measures', 'Relevance to Building Code', 'Compliance', 'Comments', 'Notes', 'Price', 'Report Data', 'Report Attachment', 'Separate Report', 'Email Notification', 'Cover Letter', 'Sticker No', 'Test ID', 'Service'].forEach(field => {
            this.selectedAttributes[field] = false;
          });
        },
        error: (error) => {
          this.errorMessage = 'Failed to load project attributes. Please try again later.';
          console.error('Error fetching attributes:', error);
        }
      });
  }

  fetchCoverLetterData(projectId: string) {
    this.http.get<any>(`https://vps.allpassiveservices.com.au/api/project/coverletter/${projectId}`)
      .subscribe({
        next: (response) => {
          if (response.data?.coverLetter) {
            this.coverLetterData = {
              address: response.data.coverLetter.address || 'N/A',
              date: response.data.coverLetter.date || new Date().toISOString().split('T')[0],
              buildingName: response.data.coverLetter.buildingName || 'N/A',
              reportTitle: response.data.coverLetter.reportTitle || 'N/A',
              additionalInfo: response.data.coverLetter.additionalInfo || 'N/A',
              clientName: response.data.coverLetter.clientName || 'N/A',
              inspectionOverview: {
                totalItems: response.data.coverLetter.inspectionOverview?.totalItems || 'N/A',
                passedItems: response.data.coverLetter.inspectionOverview?.passedItems || 'N/A',
                failedItems: response.data.coverLetter.inspectionOverview?.failedItems || 'N/A',
                tbcItems: response.data.coverLetter.inspectionOverview?.tbcItems || 'N/A'
              }
            };
          }
        },
        error: (error) => {
          console.error('Error fetching cover letter data:', error);
        }
      });
  }

  getAttributeValue(attributeName: string): string {
    if (!this.projectAttributes || !this.projectAttributes.attributes) {
      return 'N/A';
    }
    const attr = this.projectAttributes.attributes.find((a: any) => a.name === attributeName);
    return attr ? (Array.isArray(attr.value) ? attr.value.join(', ') : attr.value || 'N/A') : 'N/A';
  }

  openRightModal() {
    if (this.rightModalInstance) {
      this.rightModalInstance.show();
      this.isModalOpen = true;
    } else {
      console.error('Modal instance not available');
    }
  }

  closeRightModal() {
    if (this.rightModalInstance) {
      this.rightModalInstance.hide();
      this.isModalOpen = false;
    }
  }

  goToStep4() {
    if (this.projectId) {
      this.router.navigate(['/pages/updateproject4', this.projectId]);
    }
  }

  goToCoverLetter() {
    if (this.rightModalInstance) {
      this.rightModalInstance.hide();
    }
    if (this.projectId) {
      this.router.navigate(['/pages/coverletter'], {
        queryParams: {
          projectId: this.projectId,
          from: 'coverletter',
          returnTo: 'updateproject5'
        }
      });
    }
  }

  toggleSelectAll(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    Object.keys(this.selectedAttributes).forEach(field => {
      this.selectedAttributes[field] = checked;
    });
  }

  async generateReport() {
    const doc = new jsPDF();
    const margin = 10;
    let yOffset = 20;
    const lineHeight = 10;
    const imageWidth = 250; // Updated image width
    const imageHeight = 250; // Updated image height
    const photoImageHeight = 30;
    const baseRowHeight = 30;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Add Project Name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(`Project Name: ${this.projectData?.project?.projectName || 'N/A'}`, margin, yOffset);
    yOffset += lineHeight * 2;

    // Add Client Name
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text(`Client Name: ${this.projectData?.project?.clientInfo?.name || 'N/A'}`, margin, yOffset);
    yOffset += lineHeight * 2;

    // Add Project Image
    if (this.projectData?.project?.imageUrl) {
      try {
        const imgData = await this.getImageData(this.projectData.project.imageUrl);
        doc.addImage(imgData, 'PNG', margin, yOffset, imageWidth, imageHeight);
        yOffset += imageHeight + lineHeight; // Move yOffset below image
      } catch (error) {
        console.error('Error loading project image:', error);
        doc.setFontSize(10);
        doc.setTextColor(255, 0, 0);
        doc.text('Failed to load project image', margin, yOffset);
        doc.setTextColor(0, 0, 0);
        yOffset += lineHeight * 2;
      }
    } else {
      doc.setFontSize(10);
      doc.text('No project image available', margin, yOffset);
      yOffset += lineHeight * 2;
    }

    // Format Address from project/download API
    const address = this.projectData?.project?.address
      ? [
          this.projectData.project.address.line1,
          this.projectData.project.address.line2,
          this.projectData.project.address.city,
          this.projectData.project.address.state,
          this.projectData.project.address.zip
        ]
          .filter(Boolean)
          .join(', ')
      : 'N/A';

    // Add Address, Building Name, and Report Title
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text(`Address: ${address}`, margin, yOffset);
    yOffset += lineHeight;
    doc.text(`Building Name: ${this.projectData?.project?.buildingName || 'N/A'}`, margin, yOffset);
    yOffset += lineHeight;
    doc.text(`Report Title: ${this.coverLetterData?.reportTitle || 'N/A'}`, margin, yOffset);
    yOffset += lineHeight * 2;

    // Add Inspection Report Overview
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Inspection Report Overview', margin, yOffset);
    yOffset += lineHeight;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text(`Number of Items: ${this.coverLetterData?.inspectionOverview?.totalItems || 'N/A'}`, margin, yOffset);
    yOffset += lineHeight;
    doc.text(`Number of PASS: ${this.coverLetterData?.inspectionOverview?.passedItems || 'N/A'}`, margin, yOffset);
    yOffset += lineHeight;
    doc.text(`Number of FAIL: ${this.coverLetterData?.inspectionOverview?.failedItems || 'N/A'}`, margin, yOffset);
    yOffset += lineHeight;
    doc.text(`Number of TBC: ${this.coverLetterData?.inspectionOverview?.tbcItems || 'N/A'}`, margin, yOffset);
    yOffset += lineHeight * 2;

    // Add Additional Information Box
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Additional Information:', margin, yOffset);
    yOffset += lineHeight;

    // Draw a bordered box for additionalInfo
    const boxWidth = pageWidth - 2 * margin;
    const additionalInfo = this.coverLetterData?.additionalInfo || 'N/A';
    const textLines = doc.splitTextToSize(additionalInfo, boxWidth - 10);
    const textHeight = textLines.length * lineHeight;
    const boxHeight = textHeight + 10;
    doc.setLineWidth(0.5);
    doc.rect(margin, yOffset, boxWidth, boxHeight);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text(textLines, margin + 5, yOffset + 8);
    yOffset += boxHeight + lineHeight;

    // Add Hierarchy Document Images
    if (this.projectData?.documents?.length > 0) {
      for (const docItem of this.projectData.documents) {
        if (docItem.files?.length > 0) {
          for (const file of docItem.files) {
            // Start a new page for each image
            doc.addPage();
            yOffset = 20;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(12);
            doc.text(`Document Image: ${file.documentName || 'N/A'}`, margin, yOffset);
            yOffset += lineHeight;
            try {
              const imgData = await this.getImageData(file.documentUrl);
              doc.addImage(imgData, 'PNG', margin, yOffset, imageWidth, imageHeight);
            } catch (error) {
              console.error(`Error loading document image ${file.documentName}:`, error);
              doc.setFontSize(10);
              doc.setTextColor(255, 0, 0);
              doc.text(`Failed to load document image: ${file.documentName || 'N/A'}`, margin, yOffset);
              doc.setTextColor(0, 0, 0);
            }
            yOffset += imageHeight + lineHeight;
          }
        }
      }
    }

    // Add Attributes Table
    if (yOffset + lineHeight * 3 > pageHeight - margin) {
      doc.addPage();
      yOffset = 20;
    }

    // Define table structure
    const headers = ['Ref No', 'Location', 'Plan', 'Type', 'Substrate', 'FRL', 'Result', 'Photos', 'Comments'];
    const columnWidths = [20, 20, 30, 20, 20, 20, 20, 30, 30];
    const tableX = margin;
    const headerHeight = 10;
    const tableStartY = yOffset;

    // Draw table headers
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    let xOffset = tableX;
    headers.forEach((header, index) => {
      doc.text(header, xOffset + 1, yOffset + 8);
      doc.setLineWidth(0.5);
      doc.rect(xOffset, yOffset, columnWidths[index], headerHeight);
      xOffset += columnWidths[index];
    });
    yOffset += headerHeight + 2;

    // Prepare table data from instances
    const tableData: TableRow[] = [];
    let index = 1;
    if (this.projectData?.instances?.length > 0) {
      for (const instance of this.projectData.instances) {
        const row: TableRow = {
          'Ref No': index.toString(),
          'Location': instance.hierarchyName || 'N/A',
          'Plan': 'N/A',
          'Type': instance.subProjectCategory || 'N/A',
          'Substrate': 'N/A',
          'FRL': 'N/A',
          'Result': 'N/A',
          'Photos': 'N/A',
          'Comments': 'N/A'
        };
        if (instance.attributes) {
          instance.attributes.forEach((attr: any) => {
            if (attr.name === 'Materials') row['Substrate'] = attr.selectedValue || attr.value || 'N/A';
            if (attr.name === 'FRL') row['FRL'] = attr.selectedValue || attr.value || 'N/A';
            if (attr.name === 'Compliance') row['Result'] = attr.selectedValue || attr.value || 'N/A';
            if (attr.name === 'Comments') row['Comments'] = attr.selectedValue || attr.value || 'N/A';
          });
        }
        tableData.push(row);
        index++;
      }
    }

    // Draw table rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    let tableEndY = yOffset;
    for (const row of tableData) {
      const instance = this.projectData.instances[index - 2];
      const photoCount = instance.photos?.length || 0;
      const rowHeight = baseRowHeight + (photoCount * photoImageHeight);

      if (yOffset + rowHeight > pageHeight - margin) {
        doc.addPage();
        yOffset = 20;
      }

      const rowStartY = yOffset;
      xOffset = tableX;
      for (const header of headers) {
        const colIndex = headers.indexOf(header);
        if (header === 'Plan' && this.projectData?.documents?.[0]?.files?.[0]?.documentUrl) {
          try {
            const imgData = await this.getImageData(this.projectData.documents[0].files[0].documentUrl);
            doc.addImage(imgData, 'PNG', xOffset + 1, yOffset + 2, columnWidths[colIndex] - 2, baseRowHeight - 4);
          } catch (error) {
            console.error('Error loading plan image:', error);
            doc.setTextColor(255, 0, 0);
            doc.text('Failed to load plan image', xOffset + 1, yOffset + 8);
            doc.setTextColor(0, 0, 0);
          }
        } else if (header === 'Photos' && instance.photos?.length > 0) {
          let photoYOffset = yOffset + 2;
          for (const photo of instance.photos) {
            try {
              const imgData = await this.getImageData(photo.url);
              doc.addImage(imgData, 'PNG', xOffset + 1, photoYOffset, columnWidths[colIndex] - 2, photoImageHeight - 4);
              photoYOffset += photoImageHeight;
            } catch (error) {
              console.error('Error loading photo:', error);
              doc.setTextColor(255, 0, 0);
              doc.text('Failed to load photo', xOffset + 1, photoYOffset + 8);
              doc.setTextColor(0, 0, 0);
              photoYOffset += photoImageHeight;
            }
          }
        } else if (header === 'Photos' && (!instance.photos || instance.photos.length === 0)) {
          doc.text('N/A', xOffset + 1, yOffset + 8);
        } else {
          const cellText = row[header as keyof TableRow] || 'N/A';
          const cellLines = doc.splitTextToSize(cellText, columnWidths[colIndex] - 2);
          doc.text(cellLines, xOffset + 1, yOffset + 8);
        }
        doc.setLineWidth(0.2);
        doc.rect(xOffset, yOffset, columnWidths[colIndex], rowHeight);
        xOffset += columnWidths[colIndex];
      }

      yOffset += rowHeight;
      tableEndY = yOffset;
    }

    // Draw outer table border
    doc.setLineWidth(0.5);
    const tableWidth = columnWidths.reduce((a, b) => a + b, 0);
    doc.rect(tableX, tableStartY, tableWidth, tableEndY - tableStartY);

    // Save the PDF
    doc.save(`${this.projectId}_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  private async getImageData(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } else {
          reject('Failed to create canvas context');
        }
      };
      img.onerror = () => reject('Failed to load image');
      img.src = url;
    });
  }
}