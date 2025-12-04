import { Injectable, signal } from '@angular/core';
import { io } from 'socket.io-client';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SocketConnection {
  private socket = signal(io());
  connectSocket() {
    this.socket.update(() => io(environment.socketUrl, { withCredentials: true }));
  }
  getSocket() {
    return this.socket();
  }
}
