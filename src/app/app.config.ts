import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { register } from 'swiper/element/bundle';

import { routes } from './app.routes';
import { errorInterceptor } from './interceptors/error-interceptor';
import { responseInterceptor } from './interceptors/response-interceptor';
import { requestInterceptor } from './interceptors/request-interceptor';

register();

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([requestInterceptor, errorInterceptor, responseInterceptor])
    ),
  ]
};
