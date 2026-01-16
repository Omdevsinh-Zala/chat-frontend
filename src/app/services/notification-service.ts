import { inject, Injectable, signal } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private swPush = inject(SwPush);
  private http = inject(HttpClient);

  private audio = new Audio();
  private soundPath = '/assets/sounds/mixkit-bubble-pop-up-alert-notification-2357.wav';

  permissionStatus = signal<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  readonly VAPID_PUBLIC_KEY = environment.VAPID_PUBLIC_KEY;

  constructor() {
    this.audio.src = this.soundPath;
    this.audio.load();

    // Re-subscribe if already granted to ensure backend has latest
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
          device_id: navigator.userAgent, // Simple device ID
        })
      );

      console.log('Push subscription successful');
    } catch (err) {
      console.error('Could not subscribe to push', err);
    }
  }

  playSound() {
    this.audio.currentTime = 0;
    this.audio.play().catch((err) => console.warn('Audio playback failed:', err));
  }

  showNotification(title: string, body: string, iconUrl?: string) {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      const icon = iconUrl ? `${environment.imageUrl}${iconUrl}` : undefined;
      const notification = new Notification(title, {
        body,
        icon,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  }
}
