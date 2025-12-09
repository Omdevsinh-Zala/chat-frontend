import { Routes } from '@angular/router';
import { noAuthUserGuard } from './guards/no-auth-user-guard';
import { authUserGuard } from './guards/auth-user-guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./base/base').then(m => m.Base),
    canActivate: [authUserGuard],
    children: [
      {
        path: 'home',
        loadComponent: () => import('./base/home/home').then(m => m.Home),
      },
      {
        path: 'profile',
        children: [
          {
            path: 'me',
            loadComponent: () => import('./base/profile/profile').then(m => m.Profile),
          },
          {
            path: 'settings',
            loadComponent: () => import('./base/profile/settings/settings').then(m => m.Settings),
          },
          {
            path: '',
            pathMatch: 'full',
            redirectTo: 'me'
          },
          {
            path: '**',
            redirectTo: 'me'
          }
        ]
      },
    ]
  },
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login').then(m => m.Login),
    canActivate: [noAuthUserGuard],
  },
  {
    path: 'register',
    loadComponent: () => import('./auth/register/register').then(m => m.Register),
    canActivate: [noAuthUserGuard],
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: "home"
  }
];
