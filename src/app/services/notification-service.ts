import { Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private audio = new Audio();
  private soundPath = '/assets/sounds/mixkit-bubble-pop-up-alert-notification-2357.wav'; // Should be in public folder
  permissionStatus = signal<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  constructor() {
    this.audio.src = this.soundPath;
    this.audio.load();
  }

  async requestPermission() {
    if (typeof Notification === 'undefined') return;

    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      this.permissionStatus.set(permission);
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
