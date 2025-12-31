import { Component, computed, inject, OnInit, WritableSignal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatListModule } from '@angular/material/list';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { UserService } from '../../services/user-service';
import { environment } from '../../../environments/environment';
import { RecentlyMessagedUsers } from '../../models/recently-messaged-users';
import { SocketConnection } from '../../services/socket-connection';
import { NotificationService } from '../../services/notification-service';
import { GroupedChat } from '../../models/chat';

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
    RouterLinkActive,
  ],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  private userService = inject(UserService);
  private socketService = inject(SocketConnection);
  private notificationService = inject(NotificationService);
  user = computed(() => {
    return this.userService.user();
  });
  imagePath = environment.imageUrl;
  userChannels: WritableSignal<any[]> = this.userService.userChannels;
  recentlyMessagesUsers: WritableSignal<RecentlyMessagedUsers[]> =
    this.userService.recentlyMessagesUsers;
  personalChat: WritableSignal<RecentlyMessagedUsers | null> = this.userService.personalChat;
  combinedChats = computed(() => [...this.recentlyMessagesUsers(), this.personalChat()!]);

  ngOnInit(): void {
    this.notificationService.requestPermission();

    this.socketService.socket.on('receiveChatMessage', (data: { chat: GroupedChat }) => {
      const message = data.chat.messages[0];
      const isMyMessage = message.sender_id === this.user()?.id;

      if (!isMyMessage && message.status !== 'read') {
        // Play sound for all incoming messages
        this.notificationService.playSound();

        // Show notification only if tab is hidden OR user is not in the specific chat
        // We can check if the current URL contains the sender's ID
        const currentUrl = window.location.href;
        if (document.visibilityState === 'hidden' || !currentUrl.includes(message.sender_id)) {
          const sender = this.combinedChats().find((u) => u?.id === message.sender_id);
          const senderName = sender ? `${sender.first_name} ${sender.last_name}` : 'New message';

          this.notificationService.showNotification(
            senderName,
            message.content,
            sender?.avatar_url
          );
        }
      }
    });

    this.socketService.socket.on('typing', (data: { senderId: string; isTyping: boolean }) => {
      this.recentlyMessagesUsers.update((users) => {
        const index = users.findIndex((user) => user.id === data.senderId);
        if (index !== -1) {
          users[index].is_typing = data.isTyping;
          return [...users];
        }
        return users;
      });
    });
  }
}
