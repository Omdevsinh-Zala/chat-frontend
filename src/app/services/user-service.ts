import { HttpClient } from '@angular/common/http';
import { DestroyRef, inject, Injectable, signal, WritableSignal } from '@angular/core';
import { environment } from '../../environments/environment';
import { User } from '../models/user';
import { GlobalResponse } from '../models/auth';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RecentlyMessagedUsers } from '../models/recently-messaged-users';
import { Router } from '@angular/router';
import { PaginatedResponse, SearchUserResponse } from '../models/search';
import { AttachmentsType, ChannelList } from '../models/chat';
import { Channel, CreateChannel } from '../models/channel';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  user: WritableSignal<User | null> = signal(null);
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);

  userChannels: WritableSignal<Channel[]> = signal([]);
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

  getProfileData(id: string) {
    return this.http.get<GlobalResponse<User>>(`${this.apiUrl}/users/profile/${id}`);
  }

  updateUserData(data: {
    old_password?: string;
    new_password?: string;
    avatar_url?: string;
    first_name?: string;
    last_name?: string;
    username?: string;
  }) {
    return this.http.put<GlobalResponse<User>>(`${this.apiUrl}/users/profile`, data);
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
    const url = queryString
      ? `${this.apiUrl}/users/files?${queryString}`
      : `${this.apiUrl}/users/files`;

    return this.http.get<GlobalResponse<PaginatedResponse<AttachmentsType>>>(url);
  }

  createChannel(data: CreateChannel) {
    return this.http.post<GlobalResponse<boolean>>(`${this.apiUrl}/users/channels`, data);
  }

  getChannelData(id: string) {
    return this.http.get<GlobalResponse<Channel>>(`${this.apiUrl}/users/channels/${id}`);
  }

  getAllChannels(search?: string, order?: string, limit?: number, page?: number) {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (order) params.append('order', order);
    if (limit !== undefined) params.append('limit', limit.toString());
    if (page !== undefined) params.append('page', page.toString());

    const queryString = params.toString();
    const url = queryString
      ? `${this.apiUrl}/users/channels?${queryString}`
      : `${this.apiUrl}/users/channels`;

    return this.http.get<GlobalResponse<PaginatedResponse<ChannelList>>>(url);
  }

  updateUserStatus(userId: string, isOnline: boolean) {
    this.recentlyMessagesUsers.update((users) => {
      return users.map((u) => {
        if (u.id === userId) {
          return { ...u, is_active: isOnline };
        }
        return u;
      });
    });

    this.personalChat.update((chat) => {
      if (chat && chat.id === userId) {
        return { ...chat, is_active: isOnline };
      }
      return chat;
    });
  }

  getUserSettings() {
    return this.http.get<GlobalResponse<any>>(`${this.apiUrl}/users/settings`);
  }

  updateUserSettings(settings: any) {
    return this.http.put<GlobalResponse<any>>(`${this.apiUrl}/users/settings`, settings);
  }
}
