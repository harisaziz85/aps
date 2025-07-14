import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Modal } from 'bootstrap';
import jsPDF from 'jspdf';
import { NavbarComponent } from '../components/navbar/navbar.component';
import { TopbarComponent } from '../components/topbar/topbar.component';
import { FootComponent } from '../components/foot/foot.component';

interface ProjectReport {
  coverLetter: {
    reportTitle: string;
    address: string;
    date: string;
    buildingName: string;
    additionalInfo: string;
    clientName: string;
    inspectionOverview: {
      totalItems: string;
      passedItems: string;
      failedItems: string;
      tbcItems: string;
    };
    fileUrl: string;
  };
  _id: string;
  projectId: string;
  instanceId: string | null;
  createdAt: string;
  updatedAt: string;
  __v: number;
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
  coverLetterData: ProjectReport['coverLetter'] = {
    address: 'N/A',
    date: new Date().toISOString().split('T')[0],
    buildingName: 'N/A',
    reportTitle: 'N/A',
    additionalInfo: 'N/A',
    clientName: 'N/A',
    fileUrl: 'N/A',
    inspectionOverview: { totalItems: '0', passedItems: '0', failedItems: '0', tbcItems: '0' }
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
      this.projectId = params['id'] || '68346cc0b9c8f8893e6873b7';
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
          if (response.reports?.length > 0) {
            this.coverLetterData = response.reports[response.reports.length - 1].coverLetter;
          }
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
          if (this.reports.length > 0) {
            this.coverLetterData = this.reports[this.reports.length - 1].coverLetter;
          }
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
              fileUrl: response.data.coverLetter.fileUrl || 'N/A',
              inspectionOverview: {
                totalItems: response.data.coverLetter.inspectionOverview?.totalItems || '0',
                passedItems: response.data.coverLetter.inspectionOverview?.passedItems || '0',
                failedItems: response.data.coverLetter.inspectionOverview?.failedItems || '0',
                tbcItems: response.data.coverLetter.inspectionOverview?.tbcItems || '0'
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
    const imageWidth = 80; // Adjusted from 250px
    const imageHeight = 80; // Adjusted from 250px
    const photoImageHeight = 30;
    const baseRowHeight = 30;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const contentWidth = pageWidth - 2 * margin;

    // Add Project Name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(`Project Name: ${this.projectData?.project?.projectName || 'N/A'}`, margin, yOffset);
    yOffset += lineHeight * 2;

    // Add Client Name
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text(`Client Name: ${this.projectData?.project?.clientInfo?.name || this.coverLetterData?.clientName || 'N/A'}`, margin, yOffset);
    yOffset += lineHeight * 2;

    // Format Address
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
      : this.coverLetterData?.address || 'N/A';

    // Add Address, Building Name, and Report Title side by side with Report Cover Image
    if (this.coverLetterData?.fileUrl && this.coverLetterData.fileUrl !== 'N/A') {
      try {
        const imgData = await this.getImageData(this.coverLetterData.fileUrl);
        doc.addImage(imgData, 'PNG', margin, yOffset, imageWidth, imageHeight);
        
        // Add text next to image
        const textX = margin + imageWidth + 10;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.text(`Address: ${address}`, textX, yOffset + 10);
        doc.text(`Building Name: ${this.projectData?.project?.buildingName || this.coverLetterData?.buildingName || 'N/A'}`, textX, yOffset + 20);
        doc.text(`Report Title: ${this.coverLetterData?.reportTitle || 'N/A'}`, textX, yOffset + 30);
        yOffset += imageHeight + lineHeight;
      } catch (error) {
        console.error('Error loading report cover image:', error);
        doc.setFontSize(10);
        doc.setTextColor(255, 0, 0);
        doc.text('Failed to load report cover image', margin, yOffset);
        doc.setTextColor(0, 0, 0);
        // Add text without image
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.text(`Address: ${address}`, margin, yOffset + 10);
        doc.text(`Building Name: ${this.projectData?.project?.buildingName || this.coverLetterData?.buildingName || 'N/A'}`, margin, yOffset + 20);
        doc.text(`Report Title: ${this.coverLetterData?.reportTitle || 'N/A'}`, margin, yOffset + 30);
        yOffset += imageHeight + lineHeight;
      }
    } else {
      // Add text without image
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.text(`Address: ${address}`, margin, yOffset);
      doc.text(`Building Name: ${this.projectData?.project?.buildingName || this.coverLetterData?.buildingName || 'N/A'}`, margin, yOffset + 10);
      doc.text(`Report Title: ${this.coverLetterData?.reportTitle || 'N/A'}`, margin, yOffset + 20);
      yOffset += 40 + lineHeight;
    }

    // Add Inspection Report Overview
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Inspection Report Overview', margin, yOffset);
    yOffset += lineHeight;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text(`Number of Items: ${this.coverLetterData?.inspectionOverview?.totalItems || '0'}`, margin, yOffset);
    yOffset += lineHeight;
    doc.text(`Number of PASS: ${this.coverLetterData?.inspectionOverview?.passedItems || '0'}`, margin, yOffset);
    yOffset += lineHeight;
    doc.text(`Number of FAIL: ${this.coverLetterData?.inspectionOverview?.failedItems || '0'}`, margin, yOffset);
    yOffset += lineHeight;
    doc.text(`Number of TBC: ${this.coverLetterData?.inspectionOverview?.tbcItems || '0'}`, margin, yOffset);
    yOffset += lineHeight * 2;

    // Add Additional Information Box
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Additional Information:', margin, yOffset);
    yOffset += lineHeight;
    const boxWidth = contentWidth;
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

    // Add Hierarchy Document Images (100% width)
    if (this.projectData?.documents?.length > 0) {
      for (const docItem of this.projectData.documents) {
        if (docItem.files?.length > 0) {
          for (const file of docItem.files) {
            if (yOffset + imageHeight + lineHeight > pageHeight - margin) {
              doc.addPage();
              yOffset = 20;
            }
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(12);
            doc.text(`Document Image: ${file.documentName || 'N/A'}`, margin, yOffset);
            yOffset += lineHeight;
            try {
              const imgData = await this.getImageData(file.documentUrl);
              doc.addImage(imgData, 'PNG', margin, yOffset, contentWidth, imageHeight);
              yOffset += imageHeight + lineHeight;
            } catch (error) {
              console.error(`Error loading document image ${file.documentName}:`, error);
              doc.setFontSize(10);
              doc.setTextColor(255, 0, 0);
              doc.text(`Failed to load document image: ${file.documentName || 'N/A'}`, margin, yOffset);
              doc.setTextColor(0, 0, 0);
              yOffset += lineHeight * 2;
            }
          }
        }
      }
    } else {
      doc.setFontSize(10);
      doc.text('No document images available', margin, yOffset);
      yOffset += lineHeight * 2;
    }

    // Add Attributes Table
    if (yOffset + lineHeight * 3 > pageHeight - margin) {
      doc.addPage();
      yOffset = 20;
    }

    const headers = ['Ref No', 'Location', 'Plan', 'Type', 'Substrate', 'FRL', 'Result', 'Photos', 'Comments'];
    const columnWidths = [20, 30, 30, 20, 20, 20, 20, 30, 30];
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

    // Prepare table data from instances or fallback to standardAttributes
    const tableData: TableRow[] = [];
    let index = 1;
    if (this.projectData?.instances?.length > 0) {
      for (const instance of this.projectData.instances) {
        const row: TableRow = {
          'Ref No': index.toString(),
          'Location': instance.hierarchyName || this.projectData?.hierarchy?.levels?.[0]?.name || 'N/A',
          'Plan': 'N/A',
          'Type': instance.subProjectCategory || this.projectData?.project?.subProjects?.join(', ') || 'N/A',
          'Substrate': 'N/A',
          'FRL': 'N/A',
          'Result': 'N/A',
          'Photos': instance.photos?.length > 0 ? `${instance.photos.length} photo(s)` : 'N/A',
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
    } else {
      tableData.push({
        'Ref No': '1',
        'Location': this.projectData?.hierarchy?.levels?.[0]?.name || 'N/A',
        'Plan': 'N/A',
        'Type': this.projectData?.project?.subProjects?.join(', ') || 'N/A',
        'Substrate': this.getAttributeValue('Materials'),
        'FRL': this.getAttributeValue('FRL'),
        'Result': this.getAttributeValue('Compliance'),
        'Photos': 'N/A',
        'Comments': this.getAttributeValue('Comments')
      });
    }

    // Draw table rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    let tableEndY = yOffset;
    for (const row of tableData) {
      const instance = this.projectData?.instances?.[index - 2] || {};
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