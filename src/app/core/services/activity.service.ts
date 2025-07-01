import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Activity } from '../models/activity';

@Injectable({
  providedIn: 'root'
})
export class ActivityService {
  private apiUrl = 'https://vps.allpassiveservices.com.au/api/admin/activity';

  constructor(private http: HttpClient) {}

  getActivities(): Observable<{ activities: Activity[] }> {
    return this.http.get<{ activities: Activity[] }>(this.apiUrl);
  }
}