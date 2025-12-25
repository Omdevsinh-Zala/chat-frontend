import { inject, Injectable, signal } from '@angular/core';
import { io } from 'socket.io-client';
import { environment } from '../../environments/environment';
import { UserService } from './user-service';
import { AuthService } from './auth-service';

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
      console.log('here');
      this.userService.userChannels.set(channels);
    });

    this.socket.on('recentlyMessagesUsers', ({ users }) => {
      console.log(users);
      this.userService.recentlyMessagesUsers.set(users);
    });

    this.socket.on('personalChat', ({ chat }) => {
      console.log(chat);
      this.userService.recentlyMessagesUsers.update((users) => {
        return [...users, chat];
      });
      this.userService.personalChat.set(chat);
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected.set(false);
    });

    this.socket.on('connect_error', (error) => {
      this.isConnected.set(false);
      // @ts-ignore
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
