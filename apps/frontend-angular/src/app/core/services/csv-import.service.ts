import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, CsvImportJob } from '../models';

@Injectable({
  providedIn: 'root',
})
export class CsvImportService {
  private apiUrl = `${environment.apiUrl}/admin/import`;

  constructor(private http: HttpClient) {}

  importCsv(file: File, mode: 'preview' | 'commit'): Observable<ApiResponse<CsvImportJob>> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<ApiResponse<CsvImportJob>>(
      `${this.apiUrl}/csv?mode=${mode}`,
      formData
    );
  }

  getImportJobs(): Observable<ApiResponse<CsvImportJob[]>> {
    return this.http.get<ApiResponse<CsvImportJob[]>>(`${this.apiUrl}/jobs`);
  }

  getImportJob(id: string): Observable<ApiResponse<CsvImportJob>> {
    return this.http.get<ApiResponse<CsvImportJob>>(`${this.apiUrl}/jobs/${id}`);
  }
}
