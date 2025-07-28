import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Modal } from 'bootstrap';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
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
  Photos: string[];
  Comments: string;
}

interface Product {
  _id: string;
  name: string;
  approvalDocuments: {
    _id: string;
    name: string;
    fileUrl: string;
    createdAt: string;
    __v: number;
  }[];
  createdAt: string;
  updatedAt: string;
  __v: number;
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
  selectedAttributes: { [key: string]: any } = {};
  products: Product[] = [];
  selectedApprovalDocuments: { name: string; fileUrl: string }[] = [];
  coverLetterData: ProjectReport['coverLetter'] = {
    address: '123 Main St, Suite 200, New York, NY, 10001',
    date: new Date().toISOString().split('T')[0],
    buildingName: 'Tower A',
    reportTitle: 'N/A',
    additionalInfo: 'N/A',
    clientName: 'Mehtab',
    fileUrl: '/uploads/1752585290123-129536.jpg',
    inspectionOverview: { totalItems: '0', passedItems: '0', failedItems: '0', tbcItems: '0' }
  };
  isModalOpen: boolean = false;
  projectData: any = null;
  subCategoryOptions: string[] = [];
  selectedSubCategories: string[] = [];
  hierarchyLevels: string[] = [];
  attributeOptions: { [key: string]: string[] } = {
    'FRL': [],
    'Barrier': [],
    'Installer': [],
    'Inspector': [],
    'Safety Measures': [],
    'Relevance to Building Code': [],
    'Compliance': []
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.projectId = params['id'] || '6887287840564909e64091fd'; // Use provided projectId
      this.serviceProjectId = this.projectId;

      if (this.projectId) {
        this.fetchProjectReports(this.projectId);
        this.fetchProjectAttributes(this.projectId);
        this.fetchCoverLetterData(this.projectId);
        this.fetchProjectData(this.projectId);
        this.fetchProducts();
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

    ['Report Type', 'Product Name', 'Approval', 'Building', 'Level', 'Item #', 'Test Reference', 
     'Location', 'FRL', 'Barrier', 'Description', 'Installer', 'Inspector', 'Safety Measures', 
     'Relevance to Building Code', 'Compliance', 'Comments', 'Notes', 'Time', 'Price Excluding GST', 
     'Price', 'Sticker No', 'Test ID', 'Service', 'Separate Report', 'Email Notification', 
     'Penetration', 'Joints', 'Fire Dampers', 'Fire Doors', 'Fire Windows', 'Service Penetration'].forEach(field => {
      this.selectedAttributes[field] = field === 'Separate Report' || field === 'Email Notification' ? false : '';
    });
    this.selectedAttributes['Report Type'] = 'standard'; // Default to standard
  }

  ngAfterViewInit() {
    if (this.rightModal?.nativeElement) {
      this.rightModalInstance = new Modal(this.rightModal.nativeElement, { backdrop: 'static', keyboard: false });
      if (this.isModalOpen) {
        this.openRightModal();
      }
    } else {
      console.error('Right modal element not found');
    }
  }

  fetchProducts() {
    this.http.get<Product[]>('https://vps.allpassiveservices.com.au/api/product/list')
      .subscribe({
        next: (response) => {
          this.products = response;
          const defaultProductId = '6882a3f040564909e63f7772'; // From API response
          const defaultProduct = this.products.find(product => product._id === defaultProductId);
          this.selectedAttributes['Product Name'] = defaultProduct ? defaultProduct.name : '';
          this.updateApprovalDocuments();
        },
        error: (err) => {
          this.errorMessage = 'Failed to load products. Please try again later.';
          console.error('Error fetching products:', err);
        }
      });
  }

  updateApprovalDocuments() {
    const selectedProductName = this.selectedAttributes['Product Name'];
    const selectedProduct = this.products.find(product => product.name === selectedProductName);
    this.selectedApprovalDocuments = selectedProduct ? selectedProduct.approvalDocuments.map(doc => ({
      name: doc.name,
      fileUrl: this.convertToProxyUrl(doc.fileUrl)
    })) : [];
    this.selectedAttributes['Approval'] = '';
  }

  fetchProjectData(projectId: string) {
    this.http.get<any>(`https://vps.allpassiveservices.com.au/api/project/download/${projectId}`)
      .subscribe({
        next: (response) => {
          if (response) {
            this.projectData = response;
            if (response.reports?.length > 0) {
              this.coverLetterData = response.reports[response.reports.length - 1].coverLetter || this.coverLetterData;
              if (this.coverLetterData?.fileUrl) {
                this.coverLetterData.fileUrl = this.convertToProxyUrl(this.coverLetterData.fileUrl);
              }
            }
            // Set project image from API response
            if (response.project?.imageUrl) {
              this.coverLetterData.fileUrl = this.convertToProxyUrl(response.project.imageUrl);
            }
            this.subCategoryOptions = response.project?.subProjects || [];
            this.selectedSubCategories = response.project?.subProjects || [];
            this.selectedAttributes['Sub-category'] = this.selectedSubCategories[0] || 'N/A';
            this.hierarchyLevels = response.hierarchy?.levels?.map((level: any) => level.name) || [];
            this.selectedAttributes['Building'] = response.project?.buildingName || 'N/A';
            this.selectedAttributes['Level'] = this.hierarchyLevels.length > 0 ? this.hierarchyLevels[0] : 'N/A';
            
            if (response.standardAttributes?.length > 0) {
              response.standardAttributes.forEach((attr: any) => {
                attr.attributes.forEach((a: any) => {
                  if (a.name === 'FRL' && Array.isArray(a.value)) {
                    this.attributeOptions['FRL'] = a.value;
                    this.selectedAttributes['FRL'] = a.value[0] || 'N/A';
                  } else if (a.name === 'Compliance' && Array.isArray(a.value)) {
                    this.attributeOptions['Compliance'] = a.value;
                    this.selectedAttributes['Compliance'] = a.value[0] || 'N/A';
                  } else if (a.name === 'Barrier') {
                    this.attributeOptions['Barrier'] = [a.value];
                    this.selectedAttributes['Barrier'] = a.value || 'N/A';
                  } else if (a.name === 'Installer') {
                    this.attributeOptions['Installer'] = [a.value];
                    this.selectedAttributes['Installer'] = a.value || 'N/A';
                  } else if (a.name === 'Inspector') {
                    this.attributeOptions['Inspector'] = [a.value];
                    this.selectedAttributes['Inspector'] = a.value || 'N/A';
                  } else if (a.name === 'Safety Measures') {
                    this.attributeOptions['Safety Measures'] = [a.value];
                    this.selectedAttributes['Safety Measures'] = a.value || 'N/A';
                  } else if (a.name === 'Reference to Building Code') {
                    this.attributeOptions['Relevance to Building Code'] = [a.value];
                    this.selectedAttributes['Relevance to Building Code'] = a.value || 'N/A';
                  }
                });
              });
            }

            if (this.projectData?.documents?.length > 0) {
              this.projectData.documents = this.projectData.documents.map((doc: any) => ({
                ...doc,
                files: doc.files?.map((file: any) => ({
                  ...file,
                  documentUrl: this.convertToProxyUrl(file.documentUrl)
                }))
              }));
            }
            if (this.projectData?.instances?.length > 0) {
              this.projectData.instances = this.projectData.instances.map((instance: any) => ({
                ...instance,
                photos: instance.photos?.map((p: any) => ({
                  ...p,
                  url: this.convertToProxyUrl(p.url)
                }))
              }));
            }
          }
        },
        error: (err) => {
          this.errorMessage = 'Failed to load project data. Please try again later.';
          console.error('Error fetching project data:', err);
        }
      });
  }

  fetchProjectReports(projectId: string) {
    this.http.get<{ data: ProjectReport[] }>(`https://vps.allpassiveservices.com.au/api/project/reports/${projectId}`)
      .subscribe({
        next: (response) => {
          if (response?.data) {
            this.reports = response.data;
            if (this.reports.length > 0) {
              this.coverLetterData = this.reports[this.reports.length - 1].coverLetter || this.coverLetterData;
              if (this.coverLetterData?.fileUrl) {
                this.coverLetterData.fileUrl = this.convertToProxyUrl(this.coverLetterData.fileUrl);
              }
            }
          }
        },
        error: (err) => {
          this.errorMessage = 'Failed to load project reports. Please try again later.';
          console.error('Error fetching reports:', err);
        }
      });
  }

  fetchProjectAttributes(projectId: string) {
    this.http.get<any>(`https://vps.allpassiveservices.com.au/api/project/attributes/${projectId}`)
      .subscribe({
        next: (response) => {
          if (response?.data) {
            this.projectAttributes = response.data;
          }
        },
        error: (err) => {
          this.errorMessage = 'Failed to load project attributes. Please try again later.';
          console.error('Error fetching attributes:', err);
        }
      });
  }

  fetchCoverLetterData(projectId: string) {
    this.http.get<any>(`https://vps.allpassiveservices.com.au/api/project/coverletter/${projectId}`)
      .subscribe({
        next: (response) => {
          if (response?.data?.coverLetter) {
            this.coverLetterData = {
              address: response.data.coverLetter.address || '123 Main St, Suite 200, New York, NY, 10001',
              date: response.data.coverLetter.date || new Date().toISOString().split('T')[0],
              buildingName: response.data.coverLetter.buildingName || 'Tower A',
              reportTitle: response.data.coverLetter.reportTitle || 'N/A',
              additionalInfo: response.data.coverLetter.additionalInfo || 'N/A',
              clientName: response.data.coverLetter.clientName || 'Mehtab',
              fileUrl: this.convertToProxyUrl(response.data.coverLetter.fileUrl || '/Uploads/1752585290123-129536.jpg'),
              inspectionOverview: {
                totalItems: response.data.coverLetter.inspectionOverview?.totalItems || '0',
                passedItems: response.data.coverLetter.inspectionOverview?.passedItems || '0',
                failedItems: response.data.coverLetter.inspectionOverview?.failedItems || '0',
                tbcItems: response.data.coverLetter.inspectionOverview?.tbcItems || '0'
              }
            };
          }
        },
        error: (err) => {
          console.error('Error fetching cover letter data:', err);
        }
      });
  }

  private convertToProxyUrl(url: string): string {
    if (!url || url === 'N/A') {
      return '/assets/placeholder.png';
    }

    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const baseUrl = isLocal
      ? 'http://localhost:4200'
      : 'https://aps-app-frontend.vercel.app';

    const serverDomains = [
      'https://vps.allpassiveservices.com.au',
      'http://95.111.223.104:8000'
    ];

    let convertedUrl = url;
    for (const domain of serverDomains) {
      if (url.startsWith(domain)) {
        const path = url.replace(domain, '').replace(/^\/uploads\//, '/');
        convertedUrl = `${baseUrl}/uploads${path}`;
        return convertedUrl;
      }
    }

    if (url.startsWith('/uploads/')) {
      return `${baseUrl}${url}`;
    }

    if (url.startsWith('/assets/')) {
      return url;
    }

    return '/assets/placeholder.png';
  }

  getAttributeValue(attributeName: string): string {
    if (!this.projectAttributes || !this.projectAttributes.attributes) {
      return 'N/A';
    }
    const attr = this.projectAttributes.attributes.find((a: any) => a.name === attributeName);
    if (attr) {
      return Array.isArray(attr.value) ? attr.value[0] || 'N/A' : attr.value || 'N/A';
    }
    return 'N/A';
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
      if (field !== 'Separate Report' && field !== 'Email Notification' && field !== 'Report Type') {
        this.selectedAttributes[field] = checked ? (this.attributeOptions[field]?.[0] || this.getAttributeValue(field)) : '';
      } else if (field === 'Separate Report' || field === 'Email Notification') {
        this.selectedAttributes[field] = checked;
      }
    });
  }

  addSubCategory(category: string) {
    if (category && !this.selectedSubCategories.includes(category)) {
      this.selectedSubCategories = [category];
      this.selectedAttributes['Sub-category'] = category;
    }
  }

  removeSubCategory(category: string, field: string) {
    this.selectedSubCategories = this.selectedSubCategories.filter(item => item !== category);
    this.selectedAttributes[field] = this.selectedSubCategories[0] || 'N/A';
  }

  async generateReport() {
    const margin = 10;
    const lineHeight = 10;
    const imageWidth = 52.92;
    const imageHeight = 52.92;
    const docImageHeight = 132.29;
    const photoImageHeight = 30;
    const baseRowHeight = 30;
    const pageWidth = 297;
    const pageHeight = 420;
    const contentWidth = pageWidth - 2 * margin;
    const bottomMargin = 40;
    const logoWidth = 40;
    const logoHeight = 20;
    const clientNameMarginBottom = 10.58;
    const headerHeight = 10;
    const headers = ['Ref No', 'Location', 'Plan', 'Type', 'Substrate', 'FRL', 'Result', 'Photos', 'Comments'];
    const columnWidths = [20, 30, 40, 30, 30, 20, 20, 45, 42];

    if (this.selectedAttributes['Report Type'] === 'excel') {
      const tableData: TableRow[] = [];
      let index = 1;
      if (this.projectData?.instances?.length > 0) {
        for (const instance of this.projectData.instances) {
          const row: TableRow = {
            'Ref No': index.toString(),
            'Location': instance.hierarchyName || this.projectData?.hierarchy?.levels?.[0]?.name || 'N/A',
            'Plan': 'N/A',
            'Type': instance.subProjectCategory || this.selectedSubCategories[0] || 'N/A',
            'Substrate': 'N/A',
            'FRL': this.selectedAttributes['FRL'] || 'N/A',
            'Result': this.selectedAttributes['Compliance'] || 'N/A',
            'Photos': instance.photos?.map((p: any) => p.url) || [],
            'Comments': this.selectedAttributes['Comments'] || 'N/A'
          };
          if (instance.attributes) {
            instance.attributes.forEach((attr: any) => {
              if (attr.name === 'Materials') row['Substrate'] = attr.selectedValue || attr.value || 'N/A';
            });
          }
          tableData.push(row);
          index++;
        }
      } else {
        tableData.push({
          'Ref No': '1',
          'Location': this.projectData?.hierarchy?.levels?.[0]?.name || this.getAttributeValue('Location'),
          'Plan': 'N/A',
          'Type': this.selectedSubCategories[0] || this.getAttributeValue('Sub-category'),
          'Substrate': this.getAttributeValue('Materials'),
          'FRL': this.selectedAttributes['FRL'] || this.getAttributeValue('FRL'),
          'Result': this.selectedAttributes['Compliance'] || this.getAttributeValue('Compliance'),
          'Photos': [],
          'Comments': this.selectedAttributes['Comments'] || this.getAttributeValue('Comments')
        });
      }

      const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(tableData);
      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Report');
      XLSX.writeFile(wb, 'ASP_Report.xlsx');
    } else {
      const doc = new jsPDF({ format: 'a3' });
      let yOffset = margin;
      const maxContentHeight = pageHeight - margin - bottomMargin;

      const checkPageBreak = (requiredHeight: number) => {
        if (yOffset + requiredHeight > maxContentHeight) {
          doc.addPage();
          yOffset = margin;
          return true;
        }
        return false;
      };

      try {
        // Add logo
        const logoUrl = '/images/logo.png';
        const logoData = await this.getImageData(logoUrl);
        if (logoData) {
          const logoX = pageWidth - margin - logoWidth;
          checkPageBreak(logoHeight + lineHeight);
          doc.addImage(logoData, 'PNG', logoX, yOffset, logoWidth, logoHeight);
          yOffset += logoHeight + lineHeight;
        } else {
          console.error('Logo image not loaded:', logoUrl);
          checkPageBreak(lineHeight * 2);
          doc.setFontSize(10);
          doc.setTextColor(255, 0, 0);
          doc.text('Failed to load logo image', pageWidth - margin - 40, yOffset + 10);
          doc.setTextColor(0, 0, 0);
          yOffset += logoHeight + lineHeight;
        }

        // Add project name
        checkPageBreak(lineHeight);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text(`Project Name: ${this.projectData?.project?.projectName || 'N/A'}`, margin, yOffset);
        yOffset += lineHeight;

        // Add client name
        checkPageBreak(lineHeight + clientNameMarginBottom);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(`Client Name: ${this.projectData?.project?.clientInfo?.name || this.coverLetterData?.clientName || 'N/A'}`, margin, yOffset);
        yOffset += lineHeight + clientNameMarginBottom;

        // Add project image and details
        const textX = 105.6;
        checkPageBreak(lineHeight + imageHeight + lineHeight);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Site Logo : ', margin, yOffset);
        yOffset += lineHeight;

        // Use dynamic project image from projectData or coverLetterData
        const projectImageUrl = this.projectData?.project?.imageUrl
          ? this.convertToProxyUrl(this.projectData.project.imageUrl)
          : this.coverLetterData?.fileUrl || '/assets/placeholder.png';
        
        const imgData = await this.getImageData(projectImageUrl);
        if (imgData) {
          doc.addImage(imgData, 'PNG', margin, yOffset, imageWidth, imageHeight);
        } else {
          console.error(`Project image not loaded: ${projectImageUrl}`);
          doc.setFontSize(10);
          doc.setTextColor(255, 0, 0);
          doc.text('Failed to load project image', margin, yOffset);
          doc.setTextColor(0, 0, 0);
        }
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.text(`Address: ${this.coverLetterData?.address || this.projectData?.project?.address?.line1 || '123 Main St, Suite 200, New York, NY, 10001'}`, textX, yOffset + 10);
        doc.text(`Building Name: ${this.projectData?.project?.buildingName || this.coverLetterData?.buildingName || 'N/A'}`, textX, yOffset + 20);
        doc.text(`Report Title: ${this.coverLetterData?.reportTitle || 'N/A'}`, textX, yOffset + 30);
        yOffset += imageHeight + lineHeight;

        yOffset += 13.2;

        // Add inspection overview and additional info
        const overviewX = margin;
        const additionalInfoX = 105.6;
        const columnWidth = (contentWidth - 10) / 2;
        const additionalInfo = this.coverLetterData?.additionalInfo || 'N/A';
        const tempDoc = new jsPDF();
        tempDoc.setFont('helvetica', 'normal');
        tempDoc.setFontSize(12);
        const textLines = tempDoc.splitTextToSize(additionalInfo, columnWidth - 10);
        const textHeight = textLines.length * lineHeight;
        const boxHeight = textHeight + 10;
        const overviewHeight = lineHeight * 2;
        checkPageBreak(Math.max(overviewHeight, lineHeight + boxHeight) + lineHeight * 3);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('Inspection Report Overview', overviewX, yOffset);
        let overviewYOffset = yOffset + lineHeight * 0.5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.text('Number of Items:', overviewX, overviewYOffset);
        doc.text(`${this.coverLetterData?.inspectionOverview?.totalItems || '0'}`, overviewX + 35, overviewYOffset);
        overviewYOffset += lineHeight * 0.5;
        doc.text('Number of', overviewX, overviewYOffset);
        doc.setTextColor(92, 201, 110);
        doc.text('PASS:', overviewX + 20 + 1.06, overviewYOffset);
        doc.setTextColor(0, 0, 0);
        doc.text(`${this.coverLetterData?.inspectionOverview?.passedItems || '0'}`, overviewX + 35, overviewYOffset);
        overviewYOffset += lineHeight * 0.5;
        doc.text('Number of', overviewX, overviewYOffset);
        doc.setTextColor(228, 66, 52);
        doc.text('FAIL:', overviewX + 20 + 1.06, overviewYOffset);
        doc.setTextColor(0, 0, 0);
        doc.text(`${this.coverLetterData?.inspectionOverview?.failedItems || '0'}`, overviewX + 35, overviewYOffset);
        overviewYOffset += lineHeight * 0.5;
        doc.text('Number of', overviewX, overviewYOffset);
        doc.setTextColor(128, 128, 128);
        doc.text('TBC:', overviewX + 20 + 1.06, overviewYOffset);
        doc.setTextColor(0, 0, 0);
        doc.text(`${this.coverLetterData?.inspectionOverview?.tbcItems || '0'}`, overviewX + 35, overviewYOffset);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setLineWidth(0.5);
        doc.rect(additionalInfoX, yOffset, columnWidth, boxHeight);
        doc.text('Additional Information:', additionalInfoX + 5, yOffset + 8);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.text(textLines, additionalInfoX + 5, yOffset + 8 + lineHeight);

        yOffset += Math.max(overviewHeight, lineHeight + boxHeight) + lineHeight * 3;

        // Add document images
        if (this.projectData?.documents?.length > 0) {
          for (const docItem of this.projectData.documents) {
            if (docItem.files?.length > 0) {
              for (const file of docItem.files) {
                checkPageBreak(lineHeight + docImageHeight + lineHeight);
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(12);
                doc.text(`Document Image: ${file.documentName || 'N/A'}`, margin, yOffset);
                yOffset += lineHeight;
                const imgData = await this.getImageData(file.documentUrl);
                if (imgData) {
                  doc.addImage(imgData, 'PNG', margin, yOffset, contentWidth, docImageHeight);
                  yOffset += docImageHeight + lineHeight;
                } else {
                  console.error(`Document image not loaded: ${file.documentUrl}`);
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
          checkPageBreak(lineHeight * 2);
          doc.setFontSize(10);
          doc.text('No document images available', margin, yOffset);
          yOffset += lineHeight * 2;
        }

        // Prepare table data
        const tableData: TableRow[] = [];
        let index = 1;
        if (this.projectData?.instances?.length > 0) {
          for (const instance of this.projectData.instances) {
            const row: TableRow = {
              'Ref No': index.toString(),
              'Location': instance.hierarchyName || this.projectData?.hierarchy?.levels?.[0]?.name || 'N/A',
              'Plan': 'N/A',
              'Type': instance.subProjectCategory || this.selectedSubCategories[0] || 'N/A',
              'Substrate': 'N/A',
              'FRL': this.selectedAttributes['FRL'] || 'N/A',
              'Result': this.selectedAttributes['Compliance'] || 'N/A',
              'Photos': instance.photos?.map((p: any) => p.url) || [],
              'Comments': this.selectedAttributes['Comments'] || 'N/A'
            };
            if (instance.attributes) {
              instance.attributes.forEach((attr: any) => {
                if (attr.name === 'Materials') row['Substrate'] = attr.selectedValue || attr.value || 'N/A';
              });
            }
            tableData.push(row);
            index++;
          }
        } else {
          tableData.push({
            'Ref No': '1',
            'Location': this.projectData?.hierarchy?.levels?.[0]?.name || this.getAttributeValue('Location'),
            'Plan': 'N/A',
            'Type': this.selectedSubCategories[0] || this.getAttributeValue('Sub-category'),
            'Substrate': this.getAttributeValue('Substrate Type') || 'N/A', // Updated to match API
            'FRL': this.selectedAttributes['FRL'] || this.getAttributeValue('FRL'),
            'Result': this.selectedAttributes['Compliance'] || this.getAttributeValue('Penetration Compliant') || 'N/A', // Updated to match API
            'Photos': [],
            'Comments': this.selectedAttributes['Comments'] || this.getAttributeValue('Comments')
          });
        }

        // Add table
        checkPageBreak(lineHeight * 3 + headerHeight);
        yOffset += lineHeight * 3;
        const tableX = margin;
        const tableStartY = yOffset;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        let xOffset = tableX;
        headers.forEach((header, index) => {
          doc.setFillColor(0, 0, 0);
          doc.rect(xOffset, yOffset, columnWidths[index], headerHeight, 'F');
          doc.setTextColor(255, 255, 255);
          const headerLines = doc.splitTextToSize(header, columnWidths[index] - 4);
          doc.text(headerLines, xOffset + columnWidths[index] / 2, yOffset + 8, { align: 'center' });
          doc.setLineWidth(0.2);
          doc.setDrawColor(255, 255, 255);
          doc.rect(xOffset, yOffset, columnWidths[index], headerHeight);
          xOffset += columnWidths[index];
        });
        doc.setTextColor(0, 0, 0);
        yOffset += headerHeight;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        let tableEndY = yOffset;
        for (const row of tableData) {
          const commentsText = row['Comments'] || 'N/A';
          const commentsLines = doc.splitTextToSize(commentsText, columnWidths[headers.indexOf('Comments')] - 4);
          const commentsHeight = commentsLines.length * 6;
          const photosHeight = row['Photos'].length > 0 ? photoImageHeight : 6;
          const rowHeight = Math.max(baseRowHeight, commentsHeight, photosHeight);

          checkPageBreak(rowHeight);
          const rowStartY = yOffset;
          xOffset = tableX;
          for (const header of headers) {
            const colIndex = headers.indexOf(header);
            if (header === 'Plan' && this.projectData?.documents?.[0]?.files?.[0]?.documentUrl) {
              const imgData = await this.getImageData(this.projectData.documents[0].files[0].documentUrl);
              if (imgData) {
                const imgWidth = columnWidths[colIndex] - 4;
                const imgHeight = Math.min(photoImageHeight - 4, rowHeight - 4);
                doc.addImage(imgData, 'PNG', xOffset + 2, yOffset + 2, imgWidth, imgHeight);
              } else {
                console.error(`Plan image not loaded: ${this.projectData.documents[0].files[0].documentUrl}`);
                doc.setTextColor(255, 0, 0);
                doc.text('Failed to load plan image', xOffset + 2, yOffset + 8);
                doc.setTextColor(0, 0, 0);
              }
            } else if (header === 'Photos' && row['Photos'].length > 0) {
              const imgData = await this.getImageData(row['Photos'][0]);
              if (imgData) {
                const imgWidth = columnWidths[colIndex] - 4;
                const imgHeight = Math.min(photoImageHeight - 4, rowHeight - 4);
                doc.addImage(imgData, 'PNG', xOffset + 2, yOffset + 2, imgWidth, imgHeight);
              } else {
                console.error(`Photo not loaded: ${row['Photos'][0]}`);
                doc.setTextColor(255, 0, 0);
                doc.text('Failed to load photo', xOffset + 2, yOffset + 8);
                doc.setTextColor(0, 0, 0);
              }
            } else if (header === 'Result') {
              const cellText = row[header] || 'N/A';
              const cellLines = doc.splitTextToSize(cellText, columnWidths[colIndex] - 4);
              const textHeight = cellLines.length * 6;
              const yCenter = yOffset + (rowHeight - textHeight) / 2 + 2;
              if (cellText.toUpperCase() === 'PASS') {
                doc.setTextColor(92, 201, 110);
              } else if (cellText.toUpperCase() === 'FAIL') {
                doc.setTextColor(228, 66, 52);
              } else if (cellText.toUpperCase() === 'TBC') {
                doc.setTextColor(128, 128, 128);
              } else {
                doc.setTextColor(0, 0, 0);
              }
              doc.text(cellLines, xOffset + columnWidths[colIndex] / 2, yCenter, { align: 'center' });
              doc.setTextColor(0, 0, 0);
            } else if (header === 'Comments') {
              const cellLines = doc.splitTextToSize(row[header] || 'N/A', columnWidths[colIndex] - 4);
              const textHeight = cellLines.length * 6;
              const yCenter = yOffset + (rowHeight - textHeight) / 2 + 2;
              doc.text(cellLines, xOffset + columnWidths[colIndex] / 2, yCenter, { align: 'center' });
            } else if (header !== 'Photos') {
              const cellText = row[header as keyof TableRow] || 'N/A';
              const cellLines = doc.splitTextToSize(cellText as string, columnWidths[colIndex] - 4);
              const textHeight = cellLines.length * 6;
              const yCenter = yOffset + (rowHeight - textHeight) / 2 + 2;
              doc.text(cellLines, xOffset + columnWidths[colIndex] / 2, yCenter, { align: 'center' });
            }
            doc.setLineWidth(0.2);
            doc.setDrawColor(0, 0, 0);
            doc.rect(xOffset, yOffset, columnWidths[colIndex], rowHeight);
            xOffset += columnWidths[colIndex];
          }
          yOffset += rowHeight;
          tableEndY = yOffset;
        }

        doc.setLineWidth(0.5);
        doc.setDrawColor(0, 0, 0);
        doc.rect(tableX, tableStartY, contentWidth, tableEndY - tableStartY);

        doc.save('ASP_Report.pdf');
      } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Failed to generate PDF. Check console for details.');
      }
    }
  }

  private async getImageData(url: string): Promise<string | null> {
    const fallbackImageUrl = '/assets/placeholder.png';
    try {
      const response = await this.http.get(url, {
        headers: new HttpHeaders({
          'Accept': 'image/*',
          'Cache-Control': 'no-cache'
        }),
        responseType: 'blob'
      }).toPromise();

      if (!response) {
        throw new Error('No response received');
      }

      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve(reader.result as string);
        };
        reader.onerror = () => {
          console.error(`Failed to read blob for ${url}`);
          reject('Failed to read blob');
        };
        reader.readAsDataURL(response);
      });
    } catch (error) {
      console.error(`Error fetching image ${url}:`, error);
      try {
        const fallbackResponse = await this.http.get(fallbackImageUrl, {
          headers: new HttpHeaders({
            'Accept': 'image/*',
            'Cache-Control': 'no-cache'
          }),
          responseType: 'blob'
        }).toPromise();

        if (!fallbackResponse) {
          throw new Error('No response for fallback image');
        }

        return await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            resolve(reader.result as string);
          };
          reader.onerror = () => {
            console.error(`Failed to read fallback blob for ${fallbackImageUrl}`);
            reject('Failed to read fallback blob');
          };
          reader.readAsDataURL(fallbackResponse);
        });
      } catch (fallbackError) {
        console.error(`Failed to load fallback image ${fallbackImageUrl}:`, fallbackError);
        return null;
      }
    }
  }
}