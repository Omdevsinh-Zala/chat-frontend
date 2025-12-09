import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { UserService } from './services/user-service';
import { environment } from '../environments/environment';
import { AuthService } from './services/auth-service';
import { SocketConnection } from './services/socket-connection';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('chat-frontend');
  private userService = inject(UserService);
  user = computed(() => this.userService.user());
  imagePath = environment.imageUrl;
  private authService = inject(AuthService);
  private socketService = inject(SocketConnection);

  logout() {
    this.authService.logoutUser().subscribe();
  }

  ngOnInit() {
    const isLoggedIn = localStorage.getItem('loggedIn') === "true";
    if (isLoggedIn) {
      this.socketService.connectSocket();

      // You can now check connection status
      console.log('Socket connection status:', this.socketService.isConnected());
    }
  }
}
