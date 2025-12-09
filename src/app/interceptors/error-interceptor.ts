import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, switchMap, throwError, of } from 'rxjs';
import { MessageSnackBar } from '../helpers/message-snack-bar/message-snack-bar';
import { AuthService } from '../services/auth-service';
import { Router } from '@angular/router';

function openSnackBar(snackBar: MatSnackBar, message: string, type: 'error' | 'success' = 'error') {
  snackBar.openFromComponent(MessageSnackBar, {
    panelClass: `${type}-panel`,
    data: message,
  });
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const snackBar = inject(MatSnackBar);
  const authService = inject(AuthService);
  const router = inject(Router);
  const isRefreshRequest = req.url.includes('/refresh');
  return next(req).pipe(
    catchError((error: any) => {
      let message = 'An unknown error occurred.';
      if (error instanceof HttpErrorResponse) {
        if (error.status === 401) {
          if (isRefreshRequest) {
            // If refresh itself fails, logout and redirect
            authService.logoutUser().subscribe();
            openSnackBar(snackBar, 'Session expired. Please log in again.', 'error');
            return throwError(() => error);
          } else {
            return authService.refreshToken().pipe(
              switchMap(() => next(req)),
              catchError(() => {
                authService.logoutUser().subscribe();
                openSnackBar(snackBar, 'Session expired. Please log in again.', 'error');
                return throwError(() => error);
              })
            );
          }
        }
        if (error.error?.message) {
          message = error.error.message;
        } else if (typeof error.error === 'string') {
          message = error.error;
        } else if (error.message) {
          message = error.message;
        }
      }
      openSnackBar(snackBar, message, 'error');
      return throwError(() => error);
    })
  );
};
