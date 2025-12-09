import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const noAuthUserGuard: CanActivateFn = (route, state) => {
  const isLoggedIn = localStorage.getItem('loggedIn') === 'true';
  const router = inject(Router)
  if (isLoggedIn) {
    return router.createUrlTree(['/home']);
  } else {
    return true;
  }
};
