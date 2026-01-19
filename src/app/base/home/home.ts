import { Component, computed, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
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
import { Responsive } from '../../services/responsive';
import { MatDialog } from '@angular/material/dialog';
import { ChannelForm } from '../../dialogs/channel-form/channel-form';
import { MatCardModule } from '@angular/material/card';

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
    MatCardModule,
  ],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  private userService = inject(UserService);
  private socketService = inject(SocketConnection);
  private notificationService = inject(NotificationService);
  private responsiveService = inject(Responsive);
  private dialog = inject(MatDialog);

  isTablet = this.responsiveService.isTabletForHome;
  isOpen = this.responsiveService.homePanelOpen;
  isBaseOpen = this.responsiveService.basePanelOpen;

  openForBase() {
    this.responsiveService.basePanelOpen.update((value) => !value);
  }

  closeAll() {
    this.responsiveService.homePanelOpen.set(false);
    this.responsiveService.basePanelOpen.set(false);
  }

  showChannel(id: string) {
    return window.location.pathname.includes(`/channels/${id}`);
  }

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
      const currentUrl = window.location.href;

      if (!isMyMessage && message.status !== 'read') {
        this.notificationService.playSound();

        if (document.visibilityState === 'visible' && !currentUrl.includes(message.sender_id)) {
          const sender = this.combinedChats().find((u) => u?.id === message.sender_id);
          const senderName = sender ? `${sender.first_name} ${sender.last_name}` : 'New message';

          this.notificationService.showNotification(
            senderName,
            message.message_type === "text" ? message.content : "Sent a file",
            sender?.avatar_url,
            message.id,
          );
        }
      }
    });

    this.socketService.socket.on('receiveChannelChatMessage', (data: { chat: GroupedChat }) => {
      const message = data.chat.messages[0];
      const isMyMessage = message.sender_id === this.user()?.id;
      const currentUrl = this.showChannel(message.channel_id!);

      if (!isMyMessage) {
        if (!currentUrl) {
          this.userChannels.update((channels) => {
            const index = channels.findIndex((c) => c.id === message.channel_id);
            if (index !== -1) {
              channels[index].unread_count = (channels[index].unread_count || 0) + 1;
              return [...channels];
            }
            return channels;
          });
        }

        if (document.visibilityState === 'visible' && !currentUrl) {
          this.notificationService.playSound();
          const channel = this.userChannels().find((c) => c.id === message.channel_id);
          this.notificationService.showNotification(
            channel?.title || 'New message',
            message.message_type === "text" ? message.content : "Sent a file",
            channel?.avatar_url,
            message.id,
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

  openDialog() {
    const dialog = this.dialog.open(ChannelForm, {
      maxHeight: '100dvh',
      maxWidth: '100dvw',
      height: '70%',
      width: '70%',
    });

    dialog.afterClosed().subscribe({
      next: (result) => {
        if (result) {
          this.socketService.socket.emit('channelCreated');
        }
      },
      error: (err) => {
        console.log(err);
      },
    });
  }
}
