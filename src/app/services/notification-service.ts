import { inject, Injectable, signal } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';
import { GlobalResponse } from '../models/auth';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private swPush = inject(SwPush);
  private http = inject(HttpClient);

  private audio = new Audio();
  private soundPath = '/assets/sounds/mixkit-bubble-pop-up-alert-notification-2357.wav';

  // Sound file mappings
  private soundMap: { [key: string]: string } = {
    default: '/assets/sounds/mixkit-bubble-pop-up-alert-notification-2357.wav',
    chime: '/assets/sounds/mixkit-correct-answer-tone-2870.wav',
    ding: '/assets/sounds/mixkit-dry-pop-up-notification-alert-2356.wav',
    sciClick: '/assets/sounds/mixkit-sci-fi-click-900.wav',
    beep: '/assets/sounds/mixkit-interface-option-select-2573.wav',
    none: '',
  };

  userSettings = signal<any>(null);

  permissionStatus = signal<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default',
  );

  readonly VAPID_PUBLIC_KEY = environment.VAPID_PUBLIC_KEY;

  constructor() {
    this.loadUserSettings();

    if (this.permissionStatus() === 'granted') {
      this.subscribeToPush();
    }
  }

  async requestPermission() {
    if (typeof Notification === 'undefined') return;

    if (Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission();
      this.permissionStatus.set(permission);

      if (permission === 'granted') {
        await this.subscribeToPush();
      }
    } else {
      await this.subscribeToPush();
    }
  }

  private async subscribeToPush() {
    if (!this.swPush.isEnabled) {
      console.warn('Service Worker Push is not enabled');
      return;
    }

    try {
      const sub = await this.swPush.requestSubscription({
        serverPublicKey: this.VAPID_PUBLIC_KEY,
      });

      // Send to backend
      await firstValueFrom(
        this.http.post(`${environment.apiUrl}/users/push/subscribe`, {
          subscription: sub,
          device_id: this.getDeviceId(),
        }),
      );
    } catch (err) {
      console.error('Could not subscribe to push', err);
    }
  }

  playSound() {
    const settings = this.userSettings();
    const soundKey = settings?.notification_sound || 'default';
    const soundPath = this.soundMap[soundKey];

    if (!soundPath || soundKey === 'none') return;

    this.audio.src = soundPath;
    this.audio.currentTime = 0;
    this.audio.play().catch((err) => console.warn('Audio playback failed:', err));
  }

  previewSound(soundKey: string) {
    const soundPath = this.soundMap[soundKey];
    if (!soundPath || soundKey === 'none') return;

    const previewAudio = new Audio(soundPath);
    previewAudio.play().catch((err) => console.warn('Audio preview failed:', err));
  }

  async loadUserSettings() {
    try {
      const response = await firstValueFrom(
        this.http.get<GlobalResponse<any>>(`${environment.apiUrl}/users/settings`),
      );
      if (response.success) {
        this.userSettings.set(response.data);
        this.audio.src = this.soundMap[this.userSettings()?.notification_sound || 'default'];
        this.audio.load();
      }
    } catch (err) {
      console.error('Failed to load user settings:', err);
    }
  }

  async saveUserSettings(settings: any) {
    try {
      const response = await firstValueFrom(
        this.http.put<GlobalResponse<any>>(`${environment.apiUrl}/users/settings`, settings),
      );
      if (response.success) {
        this.userSettings.set(response.data);
      }
      return response;
    } catch (err) {
      console.error('Failed to save user settings:', err);
      throw err;
    }
  }

  async showNotification(title: string, body: string, iconUrl?: string, tag?: string) {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      const icon = iconUrl ? `${environment.imageBaseUrl}profileImages/${iconUrl}` : undefined;
      if (this.swPush.isEnabled && 'serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, {
          body,
          icon,
          tag,
          renotify: !!tag,
          data: { url: window.location.href },
        } as any);
      } else {
        const notification = new Notification(title, {
          body,
          icon,
          tag,
          renotify: !!tag,
        } as any);

        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      }
    }
  }
  private getDeviceId(): string {
    let deviceId = localStorage.getItem('push_device_id');
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem('push_device_id', deviceId);
    }
    return deviceId;
  }
}
