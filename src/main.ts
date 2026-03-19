import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { environment } from './environments/environment';
import { tryLoadAndStartRecorder } from '@alwaysmeticulous/recorder-loader';

async function startApp() {
  if (!environment.isProduction) {
    await tryLoadAndStartRecorder({
      recordingToken: 'l3nDmRGoDgCqPwmcVRTWkPFFNX6ypU3ZHaznotke',
      isProduction: false,
    });
  }
  bootstrapApplication(App, appConfig)
    .catch((err) => console.error(err));
}

startApp();
