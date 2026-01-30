import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, TaskOwnerDashboard, ReviewerDashboard, AdminDashboard } from '../models';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private apiUrl = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  getTaskOwnerDashboard(): Observable<ApiResponse<TaskOwnerDashboard>> {
    return this.http.get<ApiResponse<TaskOwnerDashboard>>(`${this.apiUrl}/task-owner`);
  }

  getReviewerDashboard(): Observable<ApiResponse<ReviewerDashboard>> {
    return this.http.get<ApiResponse<ReviewerDashboard>>(`${this.apiUrl}/reviewer`);
  }

  getAdminDashboard(): Observable<ApiResponse<AdminDashboard>> {
    return this.http.get<ApiResponse<AdminDashboard>>(`${this.apiUrl}/admin`);
  }
}
