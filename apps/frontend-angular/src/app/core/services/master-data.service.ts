import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, Entity, Department, Law, ComplianceMaster } from '../models';

@Injectable({
  providedIn: 'root',
})
export class MasterDataService {
  private apiUrl = `${environment.apiUrl}/master-data`;

  constructor(private http: HttpClient) {}

  // Entities
  getEntities(): Observable<ApiResponse<Entity[]>> {
    return this.http.get<ApiResponse<Entity[]>>(`${this.apiUrl}/entities`);
  }

  createEntity(data: { name: string; country?: string; city?: string; address?: string; isActive?: boolean }): Observable<ApiResponse<Entity>> {
    return this.http.post<ApiResponse<Entity>>(`${this.apiUrl}/entities`, data);
  }

  updateEntity(id: string, data: { name?: string; country?: string; city?: string; address?: string; isActive?: boolean }): Observable<ApiResponse<Entity>> {
    return this.http.patch<ApiResponse<Entity>>(`${this.apiUrl}/entities/${id}`, data);
  }

  deleteEntity(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/entities/${id}`);
  }

  // Departments
  getDepartments(): Observable<ApiResponse<Department[]>> {
    return this.http.get<ApiResponse<Department[]>>(`${this.apiUrl}/departments`);
  }

  createDepartment(data: { name: string }): Observable<ApiResponse<Department>> {
    return this.http.post<ApiResponse<Department>>(`${this.apiUrl}/departments`, data);
  }

  updateDepartment(id: string, data: { name: string }): Observable<ApiResponse<Department>> {
    return this.http.patch<ApiResponse<Department>>(`${this.apiUrl}/departments/${id}`, data);
  }

  deleteDepartment(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/departments/${id}`);
  }

  // Laws
  getLaws(): Observable<ApiResponse<Law[]>> {
    return this.http.get<ApiResponse<Law[]>>(`${this.apiUrl}/laws`);
  }

  createLaw(data: { name: string; description?: string }): Observable<ApiResponse<Law>> {
    return this.http.post<ApiResponse<Law>>(`${this.apiUrl}/laws`, data);
  }

  updateLaw(id: string, data: { name?: string; description?: string }): Observable<ApiResponse<Law>> {
    return this.http.patch<ApiResponse<Law>>(`${this.apiUrl}/laws/${id}`, data);
  }

  deleteLaw(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/laws/${id}`);
  }

  // Compliances
  getCompliances(): Observable<ApiResponse<ComplianceMaster[]>> {
    return this.http.get<ApiResponse<ComplianceMaster[]>>(`${this.apiUrl}/compliances`);
  }

  createCompliance(data: Partial<ComplianceMaster>): Observable<ApiResponse<ComplianceMaster>> {
    return this.http.post<ApiResponse<ComplianceMaster>>(`${this.apiUrl}/compliances`, data);
  }

  updateCompliance(id: string, data: Partial<ComplianceMaster>): Observable<ApiResponse<ComplianceMaster>> {
    return this.http.patch<ApiResponse<ComplianceMaster>>(`${this.apiUrl}/compliances/${id}`, data);
  }

  deleteCompliance(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/compliances/${id}`);
  }
}
