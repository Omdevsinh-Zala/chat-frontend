import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { tap } from 'rxjs';
import { MessageSnackBar } from '../helpers/message-snack-bar/message-snack-bar';

function openSnackBar(snackBar: MatSnackBar, message: string, type: 'success' | 'error' = 'success') {
  snackBar.openFromComponent(MessageSnackBar, {
    panelClass: `${type}-panel`,
    duration: 3000,
    data: message,
  });
}

export const responseInterceptor: HttpInterceptorFn = (req, next) => {
  const snackBar = inject(MatSnackBar);
  const ignoreUrls = ['/auth/verify/username'];
  return next(req).pipe(
    tap((event) => {
      if (event instanceof HttpResponse) {
        const body = event.body as any;
        if (body?.success && body?.message && !ignoreUrls.some(url => req.url.includes(url))) {
          openSnackBar(snackBar, body.message, 'success');
        }
      }
    })
  );
};
