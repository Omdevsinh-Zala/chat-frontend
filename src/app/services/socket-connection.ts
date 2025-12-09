import { inject, Injectable, signal } from '@angular/core';
import { io } from 'socket.io-client';
import { environment } from '../../environments/environment';
import { AuthService } from './auth-service';
import { UserService } from './user-service';

@Injectable({
  providedIn: 'root'
})
export class SocketConnection {
  socket = io(environment.socketUrl, { withCredentials: true, autoConnect: false });
  isConnected = signal(false);
  private authService = inject(AuthService);
  private userService = inject(UserService);

  connectSocket() {
    this.socket.connect();

    this.socket.on('connect', () => {
      this.isConnected.set(true);
      this.userService.getUserData();
      console.log('Socket connected:', this.socket.id);
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected.set(false);
      console.log('Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      this.isConnected.set(false);
      // @ts-ignore
      const statusCode = error.data?.statusCode ;
      if(statusCode === 401) {
        this.authService.logoutUser().subscribe();
      }
    });
  }

  disconnectSocket() {
    this.socket.disconnect();
    this.isConnected.set(false);
  }
}
