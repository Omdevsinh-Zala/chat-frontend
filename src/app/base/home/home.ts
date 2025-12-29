import { AfterViewInit, Component, computed, inject, signal, WritableSignal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatListModule } from '@angular/material/list';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { UserService } from '../../services/user-service';
import { environment } from '../../../environments/environment';
import { RecentlyMessagedUsers } from '../../models/recently-messaged-users';

@Component({
  selector: 'app-home',
  imports: [
    MatSidenavModule,
    MatIcon,
    MatButtonModule,
    MatMenuModule,
    MatListModule,
    RouterOutlet,
    RouterLink,
  ],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements AfterViewInit {
  private userService = inject(UserService);
  user = computed(() => {
    return this.userService.user();
  });
  imagePath = environment.imageUrl;
  userChannels: WritableSignal<any[]> = signal([]);
  recentlyMessagesUsers: WritableSignal<RecentlyMessagedUsers[]> = signal([]);

  ngAfterViewInit(): void {
    this.userChannels.update(() => this.userService.userChannels());
    this.recentlyMessagesUsers.update(() => this.userService.recentlyMessagesUsers());
  }
}
