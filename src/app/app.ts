import { AfterViewInit, Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UserService } from './services/user-service';
import { environment } from '../environments/environment';
import { AuthService } from './services/auth-service';
import { SocketConnection } from './services/socket-connection';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit, AfterViewInit {
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
    const isLoggedIn = localStorage.getItem('loggedIn') === 'true';
    if (isLoggedIn) {
      this.socketService.connectSocket();
    }
  }

  ngAfterViewInit(): void {
    const selectedMatTheme = localStorage.getItem('matTheme');
    const selectedSystemTheme = localStorage.getItem('systemTheme');
    if (selectedMatTheme) {
      const bodyElement = window.document.getElementsByTagName('html')[0];
      if (selectedMatTheme === 'azure-theme') {
        localStorage.removeItem('matTheme');
      } else {
        bodyElement.classList.add(selectedMatTheme);
        localStorage.setItem('matTheme', selectedMatTheme);
      }
    }
    if (selectedSystemTheme) {
      const bodyElement = window.document.getElementsByTagName('html')[0];
      if (selectedSystemTheme === 'System') {
      } else {
        bodyElement.classList.add(selectedSystemTheme);
      }
    }
  }
}
