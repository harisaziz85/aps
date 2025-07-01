import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Document } from '../models/document';
import { environment } from '../enviornment/environment';

@Injectable({
  providedIn: 'root'
})
export class ApprovalDocumentsService {
  private apiUrl = `${environment.apiUrl}/approval-docs`;

  constructor(private http: HttpClient) {}

  getDocuments(): Observable<Document[]> {
    return this.http.get<Document[]>(`${this.apiUrl}/list`).pipe(
      catchError(this.handleError)
    );
  }

  uploadDocument(file: File, name?: string): Observable<any> {
    const formData = new FormData();
    formData.append('document', file);
    if (name) {
      formData.append('name', name);
    }
    return this.http.post(`${this.apiUrl}/upload-single`, formData).pipe(
      catchError(this.handleError)
    );
  }

  deleteDocuments(ids: { ids: string[] }): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/delete`, { body: ids }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    console.error('ApprovalDocumentsService: HTTP error', {
      status: error.status,
      statusText: error.statusText,
      message: error.message,
      error: error.error
    });
    return throwError(() => new Error(error.error?.message || 'Failed to process request; please try again later.'));
  }
}