import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Product } from '../models/product';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private baseUrl = 'https://vps.allpassiveservices.com.au/api/product';

  constructor(private http: HttpClient) {}

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.baseUrl}/list`).pipe(
      catchError(this.handleError)
    );
  }

  createProduct(product: { name: string; approvalDocumentIds: string[] }): Observable<Product> {
    return this.http.post<Product>(`${this.baseUrl}/create`, product).pipe(
      catchError(this.handleError)
    );
  }

  deleteProducts(ids: { ids: string[] }): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/delete`, { body: ids }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    console.error('ProductService: HTTP error', {
      status: error.status,
      statusText: error.statusText,
      message: error.message,
      error: error.error
    });
    return throwError(() => new Error(error.error?.message || 'Failed to process request; please try again later.'));
  }
}