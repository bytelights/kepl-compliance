import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map } from 'rxjs';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const requiredRoles = route.data['roles'] as string[];

  return authService.getCurrentUser().pipe(
    map((user) => {
      if (user && requiredRoles.includes(user.role)) {
        return true;
      }
      router.navigate(['/dashboard']);
      return false;
    })
  );
};
