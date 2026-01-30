import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedResponse, ComplianceTask } from '../models';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private apiUrl = `${environment.apiUrl}/tasks`;

  constructor(private http: HttpClient) {}

  getTasks(filters?: {
    page?: number;
    limit?: number;
    status?: string;
    entityId?: string;
    departmentId?: string;
    lawId?: string;
    ownerId?: string;
    reviewerId?: string;
    dueDateFrom?: string;
    dueDateTo?: string;
    search?: string;
  }): Observable<ApiResponse<PaginatedResponse<ComplianceTask>>> {
    let params = new HttpParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<ApiResponse<PaginatedResponse<ComplianceTask>>>(
      this.apiUrl,
      { params }
    );
  }

  getTask(id: string): Observable<ApiResponse<ComplianceTask>> {
    return this.http.get<ApiResponse<ComplianceTask>>(`${this.apiUrl}/${id}`);
  }

  createTask(task: Partial<ComplianceTask>): Observable<ApiResponse<ComplianceTask>> {
    return this.http.post<ApiResponse<ComplianceTask>>(this.apiUrl, task);
  }

  updateTask(id: string, task: Partial<ComplianceTask>): Observable<ApiResponse<ComplianceTask>> {
    return this.http.patch<ApiResponse<ComplianceTask>>(`${this.apiUrl}/${id}`, task);
  }

  deleteTask(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  completeTask(id: string, data: { comment: string }): Observable<ApiResponse<ComplianceTask>> {
    return this.http.post<ApiResponse<ComplianceTask>>(
      `${this.apiUrl}/${id}/execute/complete`,
      data
    );
  }

  skipTask(id: string, data: { remarks: string }): Observable<ApiResponse<ComplianceTask>> {
    return this.http.post<ApiResponse<ComplianceTask>>(
      `${this.apiUrl}/${id}/execute/skip`,
      data
    );
  }
}
