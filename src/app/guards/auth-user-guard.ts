import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authUserGuard: CanActivateFn = (route, state) => {
  const isLoggedIn = localStorage.getItem('loggedIn') === 'true';
  const router = inject(Router);
  if (isLoggedIn) {
    return true;
  } else {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }
};
