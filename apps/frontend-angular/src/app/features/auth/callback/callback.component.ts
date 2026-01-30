import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="display: flex; justify-content: center; align-items: center; height: 100vh;">
      <p>Processing login...</p>
    </div>
  `,
})
export class CallbackComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit(): void {
    // Backend handles the callback and sets cookie, then redirects to /dashboard
    // This component is just a fallback
    setTimeout(() => {
      this.router.navigate(['/dashboard']);
    }, 1000);
  }
}
