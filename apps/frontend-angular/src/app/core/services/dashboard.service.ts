import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, TaskOwnerDashboard, ReviewerDashboard, AdminDashboard, SystemHealth } from '../models';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private apiUrl = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  getTaskOwnerDashboard(startDate?: string, endDate?: string): Observable<ApiResponse<TaskOwnerDashboard>> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    return this.http.get<ApiResponse<TaskOwnerDashboard>>(`${this.apiUrl}/task-owner`, { params });
  }

  getReviewerDashboard(startDate?: string, endDate?: string): Observable<ApiResponse<ReviewerDashboard>> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    return this.http.get<ApiResponse<ReviewerDashboard>>(`${this.apiUrl}/reviewer`, { params });
  }

  getAdminDashboard(startDate?: string, endDate?: string): Observable<ApiResponse<AdminDashboard>> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    return this.http.get<ApiResponse<AdminDashboard>>(`${this.apiUrl}/admin`, { params });
  }

  getSystemHealth(): Observable<ApiResponse<SystemHealth>> {
    return this.http.get<ApiResponse<SystemHealth>>(`${this.apiUrl}/system-health`);
  }
}
