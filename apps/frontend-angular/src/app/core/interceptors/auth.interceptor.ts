import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Cookies are automatically sent with credentials: 'include'
  const clonedReq = req.clone({
    withCredentials: true,
  });
  return next(clonedReq);
};
