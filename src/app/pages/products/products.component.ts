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
import { ToastrService } from 'ngx-toastr';
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
  isDeleteModalOpen = false;
  isDropdownOpen = false;
  selectedDocuments: string[] = [];
  productName: string = '';
  searchQuery: string = '';
  isLoading: boolean = false;
  isSaving: boolean = false;
  private pendingRequests: number = 0;
  selectedProductIds: string[] = [];
  selectedProduct: Product | null = null;

  constructor(
    private sanitizer: DomSanitizer,
    private productService: ProductService,
    private approvalDocumentsService: ApprovalDocumentsService,
    private toastr: ToastrService
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
        this.toastr.error('Failed to load products. Please try again.', 'Error');
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
          this.toastr.warning('No approval documents available. Please upload documents first.', 'Warning');
        }
        this.checkLoadingComplete();
      },
      error: (error) => {
        console.error('Failed to load documents', error);
        this.toastr.error('Failed to load approval documents. Please try again.', 'Error');
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
    this.toastr.info('Products filtered', 'Info');
  }

  openModal() {
    this.selectedProduct = null;
    this.productName = '';
    this.selectedDocuments = [];
    this.isModalOpen = true;
    this.isDropdownOpen = false;
    console.log('Create modal opened, selectedDocuments reset:', this.selectedDocuments);
  }

  openUpdateModal(product: Product) {
    this.selectedProduct = product;
    this.productName = product.name;
    this.selectedDocuments = product.approvalDocuments.map(doc => doc._id);
    this.isModalOpen = true;
    this.isDropdownOpen = false;
    console.log('Update modal opened for product:', product);
  }

  closeModal() {
    this.isModalOpen = false;
    this.isDropdownOpen = false;
    this.selectedProduct = null;
    this.productName = '';
    this.selectedDocuments = [];
  }

  openDeleteModal() {
    if (this.selectedProductIds.length === 0) {
      this.toastr.error('No products selected for deletion', 'Error');
      console.log('No products selected for deletion');
      return;
    }
    this.isDeleteModalOpen = true;
    console.log('Delete modal opened');
  }

  closeDeleteModal() {
    this.isDeleteModalOpen = false;
    this.toastr.info('Product deletion cancelled', 'Info');
    console.log('Delete modal closed');
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
    this.toastr.info('Document removed from selection', 'Info');
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
      this.toastr.error('Document not found', 'Error');
      return;
    }

    const link = document.createElement('a');
    link.href = doc.fileUrl;
    link.download = doc.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    console.log(`Initiated download for document: ${doc.name}`);
    this.toastr.success(`Downloaded document: ${doc.name}`, 'Success');
  }

  saveProduct() {
    if (!this.productName.trim()) {
      this.toastr.error('Product name is required', 'Validation Error');
      console.log('Validation failed: Product name is empty');
      return;
    }

    if (this.selectedDocuments.length === 0) {
      this.toastr.error('At least one approval document is required', 'Validation Error');
      console.log('Validation failed: selectedDocuments is empty');
      return;
    }

    this.isSaving = true;
    const productData = {
      name: this.productName,
      approvalDocumentIds: this.selectedDocuments
    };

    if (this.selectedProduct) {
      // Update existing product
      console.log('Updating product with data:', productData);
      this.productService.updateProduct(this.selectedProduct._id, productData).subscribe({
        next: (updatedProduct) => {
          const index = this.products.findIndex(p => p._id === updatedProduct._id);
          if (index !== -1) {
            this.products[index] = updatedProduct;
            this.filteredProducts = this.products;
          }
          this.isSaving = false;
          this.closeModal();
          this.toastr.success('Product updated successfully', 'Success');
          console.log('Product updated:', updatedProduct);
          window.location.reload();
        },
        error: (error) => {
          this.isSaving = false;
          console.error('Failed to update product', error);
          this.toastr.error(error.message || 'Failed to update product. Please try again.', 'Error');
        }
      });
    } else {
      // Create new product
      console.log('Creating product with data:', productData);
      this.productService.createProduct(productData).subscribe({
        next: (newProduct) => {
          this.products.push(newProduct);
          this.filteredProducts = this.products;
          this.isSaving = false;
          this.closeModal();
          this.toastr.success('Product created successfully', 'Success');
          console.log('Product created:', newProduct);
          window.location.reload();
        },
        error: (error) => {
          this.isSaving = false;
          console.error('Failed to create product', error);
          this.toastr.error(error.message || 'Failed to create product. Please try again.', 'Error');
        }
      });
    }
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

  confirmDeleteProducts() {
    this.openDeleteModal();
  }

  deleteProducts() {
    const deleteData = { ids: this.selectedProductIds };
    console.log('Deleting products with data:', deleteData);

    this.productService.deleteProducts(deleteData).subscribe({
      next: () => {
        this.products = this.products.filter(p => !this.selectedProductIds.includes(p._id));
        this.filteredProducts = this.filteredProducts.filter(p => !this.selectedProductIds.includes(p._id));
        this.selectedProductIds = [];
        this.isDeleteModalOpen = false;
        this.toastr.success('Product(s) deleted successfully', 'Success');
        console.log('Products deleted successfully');
        window.location.reload();
      },
      error: (error) => {
        this.isDeleteModalOpen = false;
        console.error('Failed to delete products', error);
        this.toastr.error(error.message || 'Failed to delete product(s). Please try again.', 'Error');
      }
    });
  }

  downloadProductAsPDF(product: Product) {
    console.log('Generating PDF for product:', product);
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
      product.approvalDocuments.forEach((document: any, index: number) => {
        const docName = document.name || 'Unnamed Document';
        const docUrl = document.fileUrl || 'No URL Available';
        doc.text(`${index + 1}. ${docName}`, 10, yPosition);
        const maxWidth = 180;
        const urlLines = doc.splitTextToSize(`URL: ${docUrl}`, maxWidth);
        doc.text(urlLines, 10, yPosition + 5);
        yPosition += 10 + (urlLines.length * 5);
      });
    }

    doc.save(`${product.name}_details.pdf`);
    console.log(`Downloaded PDF for product: ${product.name}`);
    this.toastr.success(`Downloaded PDF for product: ${product.name}`, 'Success');
  }
}