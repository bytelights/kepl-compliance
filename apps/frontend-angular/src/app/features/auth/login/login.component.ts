import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule, MatIconModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  isProduction = environment.production;
  errorMessage = '';

  constructor(private authService: AuthService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['error']) {
        const error = params['error'];
        this.errorMessage = error === 'auth_failed'
          ? 'Authentication failed. Please try again.'
          : decodeURIComponent(error);
      }
    });
  }

  login(): void {
    this.authService.login();
  }

  devLogin(role: 'ADMIN' | 'REVIEWER' | 'TASK_OWNER' = 'ADMIN'): void {
    window.location.href = `${environment.apiUrl}/auth/dev/login?role=${role}`;
  }
}

