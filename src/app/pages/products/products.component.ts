import { Component, OnInit, HostListener } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ProductService } from '../../core/services/product.service';
import { ApprovalDocumentsService } from '../../core/services/document.service';
import { Product } from '../../core/models/product';
import { Document } from '../../core/models/document';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FootComponent } from '../components/foot/foot.component';
import { TopbarComponent } from '../components/topbar/topbar.component';
import { SliderComponent } from '../components/slider/slider.component';
import { SvgIconsComponent } from '../../shared/svg-icons/svg-icons.component';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule, FootComponent, TopbarComponent, SliderComponent, SvgIconsComponent],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css']
})
export class ProductsComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  documents: Document[] = [];
  isModalOpen = false;
  isDropdownOpen = false;
  selectedDocuments: string[] = [];
  productName: string = '';
  searchQuery: string = '';
  isLoading: boolean = false;
  isSaving: boolean = false;
  private pendingRequests: number = 0;
  selectedProductIds: string[] = [];
  isConfirmationModalOpen: boolean = false;

  constructor(
    private sanitizer: DomSanitizer,
    private productService: ProductService,
    private approvalDocumentsService: ApprovalDocumentsService
  ) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.custom-dropdown') && !target.closest('.dropdown-menu')) {
      this.isDropdownOpen = false;
    }
  }

  ngOnInit() {
    this.isLoading = true;
    this.pendingRequests = 2;
    this.loadProducts();
    this.loadDocuments();
  }

  loadProducts() {
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.products = products;
        this.filteredProducts = products;
        console.log('Loaded products:', products);
        this.checkLoadingComplete();
      },
      error: (error) => {
        console.error('Failed to load products', error);
        alert('Failed to load products; please try again.');
        this.checkLoadingComplete();
      }
    });
  }

  loadDocuments() {
    this.approvalDocumentsService.getDocuments().subscribe({
      next: (documents) => {
        this.documents = documents;
        console.log('Loaded documents:', documents);
        if (documents.length === 0) {
          alert('No approval documents available. Please upload documents first.');
        }
        this.checkLoadingComplete();
      },
      error: (error) => {
        console.error('Failed to load documents', error);
        alert('Failed to load approval documents; please try again.');
        this.checkLoadingComplete();
      }
    });
  }

  private checkLoadingComplete() {
    this.pendingRequests--;
    if (this.pendingRequests === 0) {
      this.isLoading = false;
    }
  }

  filterProducts() {
    const query = this.searchQuery.trim().toLowerCase();
    if (query) {
      this.filteredProducts = this.products.filter(product =>
        product.name.toLowerCase().includes(query)
      );
    } else {
      this.filteredProducts = this.products;
    }
    console.log('Filtered products:', this.filteredProducts);
  }

  openModal() {
    this.isModalOpen = true;
    this.productName = '';
    this.selectedDocuments = [];
    this.isDropdownOpen = false;
    console.log('Modal opened, selectedDocuments reset:', this.selectedDocuments);
  }

  closeModal() {
    this.isModalOpen = false;
    this.isDropdownOpen = false;
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
    console.log('Dropdown toggled, isDropdownOpen:', this.isDropdownOpen);
  }

  toggleDocumentSelection(docId: string) {
    if (!this.selectedDocuments.includes(docId)) {
      this.selectedDocuments.push(docId);
      console.log('Selected document:', docId, 'Current selectedDocuments:', this.selectedDocuments);
    } else {
      this.selectedDocuments = this.selectedDocuments.filter(id => id !== docId);
      console.log('Removed document:', docId, 'Current selectedDocuments:', this.selectedDocuments);
    }
  }

  removeDocument(docId: string) {
    this.selectedDocuments = this.selectedDocuments.filter(id => id !== docId);
    console.log('Removed document:', docId, 'Current selectedDocuments:', this.selectedDocuments);
  }

  getDocumentName(docId: string): string {
    if (!this.documents || this.documents.length === 0) {
      console.warn('Documents array is empty or undefined');
      return 'No Documents Available';
    }
    const doc = this.documents.find(d => d._id === docId);
    return doc ? doc.name : 'Document Not Found';
  }

  getDocumentUrl(docId: string): string {
    if (!this.documents || this.documents.length === 0) {
      console.warn('Documents array is empty or undefined');
      return '';
    }
    const doc = this.documents.find(d => d._id === docId);
    return doc ? doc.fileUrl : '';
  }

  downloadDocument(docId: string) {
    const doc = this.documents.find(d => d._id === docId);
    if (!doc) {
      console.warn(`Document with ID ${docId} not found`);
      alert('Document not found');
      return;
    }

    const link = document.createElement('a');
    link.href = doc.fileUrl;
    link.download = doc.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    console.log(`Initiated download for document: ${doc.name}`);
  }

  createProduct() {
    if (!this.productName.trim()) {
      alert('Product name is required');
      console.log('Validation failed: Product name is empty');
      return;
    }

    if (this.selectedDocuments.length === 0) {
      alert('At least one approval document is required');
      console.log('Validation failed: selectedDocuments is empty');
      return;
    }

    this.isSaving = true;
    const productData = {
      name: this.productName,
      approvalDocumentIds: this.selectedDocuments
    };

    console.log('Creating product with data:', productData);

    this.productService.createProduct(productData).subscribe({
      next: (newProduct) => {
        this.products.push(newProduct);
        this.filteredProducts = this.products;
        this.isSaving = false;
        this.closeModal();
        alert('Product created successfully');
        console.log('Product created:', newProduct);
        window.location.reload();
      },
      error: (error) => {
        this.isSaving = false;
        console.error('Failed to create product', error);
        alert(error.message || 'Failed to create product; please try again.');
      }
    });
  }

  toggleProductSelection(productId: string) {
    if (this.selectedProductIds.includes(productId)) {
      this.selectedProductIds = this.selectedProductIds.filter(id => id !== productId);
    } else {
      this.selectedProductIds.push(productId);
    }
    console.log('Selected product IDs:', this.selectedProductIds);
  }

  clearSelection() {
    this.selectedProductIds = [];
    console.log('Selection cleared, selectedProductIds:', this.selectedProductIds);
  }

  openConfirmationModal() {
    this.isConfirmationModalOpen = true;
    console.log('Confirmation modal opened');
  }

  closeConfirmationModal() {
    this.isConfirmationModalOpen = false;
    console.log('Confirmation modal closed');
  }

  deleteProducts() {
    if (this.selectedProductIds.length === 0) {
      alert('No products selected for deletion');
      console.log('No products selected for deletion');
      return;
    }

    const deleteData = { ids: this.selectedProductIds };
    console.log('Deleting products with data:', deleteData);

    this.productService.deleteProducts(deleteData).subscribe({
      next: () => {
        this.products = this.products.filter(p => !this.selectedProductIds.includes(p._id));
        this.filteredProducts = this.filteredProducts.filter(p => !this.selectedProductIds.includes(p._id));
        this.selectedProductIds = [];
        this.closeConfirmationModal();
        alert('Product(s) deleted successfully');
        console.log('Products deleted successfully');
        window.location.reload();
      },
      error: (error) => {
        console.error('Failed to delete products', error);
        alert(error.message || 'Failed to delete product(s); please try again.');
        this.closeConfirmationModal();
      }
    });
  }

  downloadProductAsPDF(product: Product) {
    console.log('Generating PDF for product:', { name: product.name, approvalDocuments: product.approvalDocuments });
    console.log('Documents available:', this.documents.length, this.documents);
    if (!this.documents || this.documents.length === 0) {
      console.warn('No documents loaded');
      alert('No documents available. Please ensure documents are loaded.');
      return;
    }
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Product Details', 10, 10);
    doc.setFontSize(12);
    doc.text(`Product Name: ${product.name}`, 10, 20);
    doc.text('Approval Documents:', 10, 30);

    let yPosition = 40;
    if (!product.approvalDocuments || product.approvalDocuments.length === 0) {
      console.warn(`No approval documents for product: ${product.name}`);
      doc.text('No approval documents associated.', 10, yPosition);
    } else {
      product.approvalDocuments.forEach((docId, index) => {
        const docName = this.getDocumentName(docId);
        doc.text(`${index + 1}. ${docName}`, 10, yPosition);
        yPosition += 10;
      });
    }

    doc.save(`${product.name}_details.pdf`);
    console.log(`Downloaded PDF for product: ${product.name}`);
  }
}