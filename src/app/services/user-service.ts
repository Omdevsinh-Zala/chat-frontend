import { HttpClient } from '@angular/common/http';
import { DestroyRef, inject, Injectable, signal, WritableSignal } from '@angular/core';
import { environment } from '../../environments/environment';
import { User } from '../models/user';
import { GlobalResponse } from '../models/auth';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RecentlyMessagedUsers } from '../models/recently-messaged-users';
import { Router } from '@angular/router';
import { PaginatedResponse, SearchUserResponse } from '../models/search';
import { AttachmentsType } from '../models/chat';

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
          }
        },
      });
  }

  searchUser(query?: string, limit?: number, page?: number) {
    const params = new URLSearchParams();
    if (query) params.append('search', query);
    if (limit !== undefined) params.append('limit', limit.toString());
    if (page !== undefined) params.append('page', page.toString());

    const queryString = params.toString();
    const url = queryString ? `${this.apiUrl}/users?${queryString}` : `${this.apiUrl}/users`;

    return this.http.get<GlobalResponse<PaginatedResponse<SearchUserResponse>>>(url);
  }

  uploadFile(formData: FormData) {
    return this.http.post<GlobalResponse<{ files: any[] }>>(`${this.apiUrl}/upload`, formData);
  }

  getAllFiles(order?: string, limit?: number, page?: number) {
    const params = new URLSearchParams();
    if (order) params.append('order', order);
    if (limit !== undefined) params.append('limit', limit.toString());
    if (page !== undefined) params.append('page', page.toString());

    const queryString = params.toString();
    const url = queryString ? `${this.apiUrl}/users/files?${queryString}` : `${this.apiUrl}/users/files`;

    return this.http.get<GlobalResponse<PaginatedResponse<AttachmentsType>>>(url);
  }
}
