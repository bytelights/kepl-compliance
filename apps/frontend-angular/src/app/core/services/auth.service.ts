import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, of, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<CurrentUser | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {
    this.checkAuth();
  }

  private checkAuth(): void {
    this.getCurrentUser().subscribe();
  }

  login(): void {
    window.location.href = `${this.apiUrl}/auth/microsoft/login`;
  }

  getCurrentUser(): Observable<CurrentUser | null> {
    return this.http
      .get<{ success: boolean; data: CurrentUser }>(`${this.apiUrl}/auth/me`)
      .pipe(
        tap((response) => {
          if (response.success && response.data) {
            this.currentUserSubject.next(response.data);
          }
        }),
        catchError(() => {
          this.currentUserSubject.next(null);
          return of(null);
        }),
        map((response) => {
          if (response && 'data' in response) {
            return response.data;
          }
          return null;
        })
      );
  }

  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/logout`, {}).pipe(
      tap(() => {
        this.currentUserSubject.next(null);
        window.location.href = '/login';
      })
    );
  }

  get currentUserValue(): CurrentUser | null {
    return this.currentUserSubject.value;
  }

  isAdmin(): boolean {
    return this.currentUserValue?.role === 'admin';
  }

  isReviewer(): boolean {
    return this.currentUserValue?.role === 'reviewer';
  }

  isTaskOwner(): boolean {
    return this.currentUserValue?.role === 'task_owner';
  }
}
