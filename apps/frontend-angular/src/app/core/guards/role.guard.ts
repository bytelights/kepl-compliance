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
      if (!user || !user.role) {
        console.error('Role guard blocked: No user or role');
        router.navigate(['/dashboard']);
        return false;
      }
      
      const hasPermission = requiredRoles.some(
        role => role.toLowerCase() === user.role.toLowerCase()
      );
      
      if (hasPermission) {
        console.log('Role guard passed:', user.role, 'has access to', requiredRoles);
        return true;
      }
      
      console.error('Role guard blocked. User role:', user.role, 'Required roles:', requiredRoles);
      router.navigate(['/dashboard']);
      return false;
    })
  );
};
