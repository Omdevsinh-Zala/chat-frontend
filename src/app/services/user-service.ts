import { HttpClient } from '@angular/common/http';
import { DestroyRef, inject, Injectable, signal, WritableSignal } from '@angular/core';
import { environment } from '../../environments/environment';
import { User } from '../models/user';
import { GlobalResponse } from '../models/auth';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RecentlyMessagedUsers } from '../models/recently-messaged-users';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  user: WritableSignal<User | null> = signal(null);
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);

  userChannels: WritableSignal<any> = signal([]);
  recentlyMessagesUsers: WritableSignal<RecentlyMessagedUsers[]> = signal([]);
  personalChat: WritableSignal<RecentlyMessagedUsers | null> = signal(null);

  setUser(userData: any) {
    this.user.update(() => userData);
  }

  getUserData() {
    return this.http
      .get<GlobalResponse<User>>(`${this.apiUrl}/users/profile`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: async (res) => {
          if (res.success) {
            this.setUser(res.data);
            this.router.navigate(['/home', res.data?.active_chat_id]);
          }
        },
      });
  }
}
