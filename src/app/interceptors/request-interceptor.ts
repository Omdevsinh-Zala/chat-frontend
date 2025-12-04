import { HttpInterceptorFn } from '@angular/common/http';

export const requestInterceptor: HttpInterceptorFn = (req, next) => {
  const request = req.clone({
    withCredentials: true,
  });
  return next(request);
};
