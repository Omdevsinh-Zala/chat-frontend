import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { User } from '../models/user.model';
import { GlobalResponse } from '../models/auth.model';
import { map } from 'rxjs';
import { SocketConnection } from './socket-connection';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private user = signal<any>(null);
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  private socketConnection = inject(SocketConnection);

  setUser(userData: any) {
    this.user.set(userData);
  }

  loggedInUser = computed(() => this.user());

  getUserData() {
    return this.http.get<GlobalResponse<User>>(`${this.apiUrl}/user/profile`).pipe(
      map((res) => {
        if (res.success) {
          this.setUser(res.data);
          this.socketConnection.connectSocket();
        }
        return res;
      })
    ).subscribe();
  }
}
