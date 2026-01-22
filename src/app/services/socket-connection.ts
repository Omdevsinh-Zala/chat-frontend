import { inject, Injectable, signal } from '@angular/core';
import { io } from 'socket.io-client';
import { environment } from '../../environments/environment';
import { UserService } from './user-service';
import { AuthService } from './auth-service';

declare global {
  interface Error {
    data: {
      statusCode: number;
    };
  }
}

@Injectable({
  providedIn: 'root',
})
export class SocketConnection {
  socket = io(environment.socketUrl, { withCredentials: true, autoConnect: false });
  isConnected = signal(false);
  private userService = inject(UserService);
  private authService = inject(AuthService);

  connectSocket() {
    this.socket.connect();

    this.socket.on('connect', () => {
      this.isConnected.set(true);
      this.userService.getUserData();
    });

    this.socket.on('channels', ({ channels }) => {
      this.userService.userChannels.set(channels);
    });

    this.socket.on('recentlyMessagesUsers', ({ users }) => {
      this.userService.recentlyMessagesUsers.set(users);
    });

    this.socket.on('personalChat', ({ chat }) => {
      if (chat) {
        this.userService.personalChat.set(chat);
      }
    });

    this.socket.on('userStatusChanged', ({ userId, isOnline }) => {
      this.userService.updateUserStatus(userId, isOnline);
    });

    this.socket.on('userImageChanged', ({ userId, avatar_url }) => {
      this.userService.recentlyMessagesUsers.update((users) => {
        return users.map((u) => {
          if (u.id === userId) {
            return { ...u, avatar_url };
          }
          return u;
        });
      });
    });

    this.socket.on('userProfileInfoChanged', ({ userId, data }) => {
      this.userService.recentlyMessagesUsers.update((users) => {
        return users.map((u) => {
          if (u.id === userId) {
            return { ...u, ...data };
          }
          return u;
        });
      });
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected.set(false);
    });

    this.socket.on('connect_error', (error) => {
      this.isConnected.set(false);
      const statusCode = error.data?.statusCode;
      if (statusCode === 401) {
        this.authService.logoutUser().subscribe();
      }
    });
  }

  disconnectSocket() {
    this.socket.disconnect();
    this.isConnected.set(false);
  }
}
