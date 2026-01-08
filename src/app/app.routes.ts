import { Routes } from '@angular/router';
import { noAuthUserGuard } from './guards/no-auth-user-guard';
import { authUserGuard } from './guards/auth-user-guard';

export const routes: Routes = [
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
    loadComponent: () => import('./base/base').then(m => m.Base),
    canActivate: [authUserGuard],
    children: [
      {
        path: 'home',
        loadComponent: () => import('./base/home/home').then(m => m.Home),
        children: [
          {
            path: ':id',
            loadComponent: () => import('./base/home/chat/chat').then(m => m.Chat),
          },
          {
            path: 'channel/:id',
            loadComponent: () => import('./base/home/channel-chat/channel-chat').then(m => m.ChannelChat),
          },
        ]
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
      {
        path: 'contacts',
        loadComponent: () => import('./base/contacts/contacts').then(m => m.Contacts),
      },
      {
        path: 'files',
        loadComponent: () => import('./base/files/files').then(m => m.Files),
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: "home"
      },
      {
        path: '**',
        redirectTo: "home"
      }
    ]
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: "home"
  }
];
