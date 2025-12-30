import { Component, computed, inject, WritableSignal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatListModule } from '@angular/material/list';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
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
    RouterLinkActive
  ],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  private userService = inject(UserService);
  user = computed(() => {
    return this.userService.user();
  });
  imagePath = environment.imageUrl;
  userChannels: WritableSignal<any[]> = this.userService.userChannels;
  recentlyMessagesUsers: WritableSignal<RecentlyMessagedUsers[]> =
    this.userService.recentlyMessagesUsers;
  personalChat: WritableSignal<RecentlyMessagedUsers | null> = this.userService.personalChat;
  combinedChats = computed(() => [...this.recentlyMessagesUsers(), this.personalChat()!]);
}
