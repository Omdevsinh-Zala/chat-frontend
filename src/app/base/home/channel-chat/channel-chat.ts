import {
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Injector,
  model,
  signal,
  viewChild,
  viewChildren,
  WritableSignal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { AssetView } from '../../../dialogs/asset-view/asset-view';
import { AttachmentsType, GroupedChat } from '../../../models/chat';
import { ReceiverUser } from '../../../models/user';
import { Responsive } from '../../../services/responsive';
import { SocketConnection } from '../../../services/socket-connection';
import { UserService } from '../../../services/user-service';
import { MatInputModule } from '@angular/material/input';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDivider } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { ModifyPipe } from '../../../helpers/pipes/modify.pipe';
import { AssetContainer } from '../chat/asset-container/asset-container';
import { ChannelData } from '../../../models/channel';
import { MatCardModule } from '@angular/material/card';
import { ChannelInfo } from '../../../dialogs/channel-info/channel-info';

@Component({
  selector: 'app-channel-chat',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIcon,
    FormsModule,
    DatePipe,
    MatDivider,
    ModifyPipe,
    MatProgressSpinner,
    AssetContainer,
    MatCardModule,
  ],
  templateUrl: './channel-chat.html',
  styleUrl: './channel-chat.css',
})
export class ChannelChat {
  private socketService = inject(SocketConnection);
  private router = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  private chatId = signal('');
  userData = inject(UserService);
  private injector = inject(Injector);
  private dialog = inject(MatDialog);
  private responsiveService = inject(Responsive);
  // isTyping = computed(() => {
  //   return (
  //     (this.channelData()?.is_typing ||
  //       this.userData.recentlyMessagesUsers()?.find((user) => user.id === this.chatId())
  //         ?.is_typing) &&
  //     this.chatId() !== this.userData.user()?.id
  //   );
  // });

  isTablet = this.responsiveService.isTabletForBase;
  isOpen = this.responsiveService.basePanelOpen;
  isHomeOpen = this.responsiveService.homePanelOpen;

  openForHome() {
    this.responsiveService.homePanelOpen.update((value) => !value);
  }

  isAssetsEntered = signal(false);
  assetsData: WritableSignal<File[]> = signal([]);
  base64AssetsData: WritableSignal<AttachmentsType[]> = signal([]);

  imagePath = environment.imageUrl;

  messageItems = viewChildren<ElementRef>('messageItem');

  private observer: IntersectionObserver | null = null;
  private isTypingStatusSend = signal(false);
  private pendingReadMessageIds = new Set<string>();
  channelData: WritableSignal<ChannelData | null> = signal(null);
  currentChatMessages: WritableSignal<GroupedChat[]> = signal<GroupedChat[]>([]);
  unreadCount = computed(() => this.unreadMessages().length);
  unreadMessages = computed(() => {
    const userId = this.userData.user()?.id;
    const myMember = this.channelData()?.ChannelMembers.find((m) => m.user_id === userId);
    if (!myMember) return [];

    return this.currentChatMessages()
      .flatMap((group) => group.messages)
      .filter((m) => {
        if (m.sender_id === userId) return false;
        if (!myMember.last_read_at) return true;
        return new Date(m.created_at) > new Date(myMember.last_read_at);
      });
  });
  canAppendMessages = signal(true);

  message = model('');

  private onChannelMessages = (data: { chat: GroupedChat[]; channelData: any }) => {
    this.currentChatMessages.set(data.chat);
    this.channelData.set(data.channelData);
  };

  private onAppendedChannelMessages = (data: { chat: GroupedChat[] }) => {
    this.currentChatMessages.update((chat) => {
      const updatedChat = [...chat];
      data.chat.forEach((newGroup) => {
        const existingGroupIndex = updatedChat.findIndex((g) => g.monthYear === newGroup.monthYear);
        if (existingGroupIndex !== -1) {
          updatedChat[existingGroupIndex] = {
            ...updatedChat[existingGroupIndex],
            messages: [...updatedChat[existingGroupIndex].messages, ...newGroup.messages],
          };
        } else {
          updatedChat.push(newGroup);
        }
      });
      return updatedChat;
    });
    this.canAppendMessages.set(true);
  };

  private onReceiveChannelChatMessage = (data: { chat: GroupedChat }) => {
    const message = data.chat.messages?.[0];
    if (!message || message.channel_id !== this.chatId()) return;

    const dateKey = data.chat.monthYear;

    this.currentChatMessages.update((chat) => {
      const updatedChat = [...chat];
      const gIndex = updatedChat.findIndex((g) => g.monthYear === dateKey);
      if (gIndex !== -1) {
        updatedChat[gIndex] = {
          ...updatedChat[gIndex],
          messages: [message, ...updatedChat[gIndex].messages],
        };
      } else {
        updatedChat.unshift({ monthYear: dateKey, messages: [message] });
      }
      return updatedChat;
    });
    this.markRead();
  };

  private onChannelReadUpdated = (data: {
    channelId: string;
    userId: string;
    lastReadAt: string;
  }) => {
    if (data.channelId === this.chatId()) {
      this.channelData.update((currentData) => {
        if (!currentData) return currentData;
        const updatedMembers = currentData.ChannelMembers.map((m) => {
          if (m.user_id === data.userId) {
            return { ...m, last_read_at: new Date(data.lastReadAt) };
          }
          return m;
        });
        return { ...currentData, ChannelMembers: updatedMembers };
      });
    }
  };

  private setupListeners() {
    this.socketService.socket.on('channelChatMessages', this.onChannelMessages);
    this.socketService.socket.on('appendedChannelMessages', this.onAppendedChannelMessages);
    this.socketService.socket.on('receiveChannelChatMessage', this.onReceiveChannelChatMessage);
    this.socketService.socket.on('channelReadUpdated', this.onChannelReadUpdated);
  }

  private removeListeners() {
    this.socketService.socket.off('channelChatMessages', this.onChannelMessages);
    this.socketService.socket.off('appendedChannelMessages', this.onAppendedChannelMessages);
    this.socketService.socket.off('receiveChannelChatMessage', this.onReceiveChannelChatMessage);
    this.socketService.socket.off('channelReadUpdated', this.onChannelReadUpdated);
  }

  ngOnInit(): void {
    this.setupListeners();

    this.router.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params: any) => {
      const previousChatId = this.chatId();
      this.chatId.set(params['id']);
      this.currentChatMessages.set([]);
      this.channelData.set(null);
      this.markRead();

      this.socketService.socket.emit('channelChatChange', { channelId: this.chatId() });
    });

    this.destroyRef.onDestroy(() => {
      this.removeListeners();
      this.observer?.disconnect();
    });

    this.setupObserver();
  }

  ngAfterViewInit(): void {
    effect(
      () => {
        const items = this.messageItems();
        // Clear previous observations to avoid duplicate handling
        this.observer?.disconnect();
        items.forEach((item) => {
          this.observer?.observe(item.nativeElement);
        });
      },
      { injector: this.injector }
    );
  }

  private setupObserver() {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const flatMessages = this.currentChatMessages().flatMap((g) => g.messages);

            if (
              entry.target.getAttribute('data-id') === flatMessages[flatMessages.length - 1]?.id &&
              this.canAppendMessages()
            ) {
              this.canAppendMessages.set(false);
              setTimeout(() => {
                this.socketService.socket.emit('appendChannelMessages', {
                  channelId: this.chatId(),
                  offset: flatMessages.length,
                });
              }, 300);
            }
          }
        });
      },
      {
        root: null,
        threshold: 0.1,
        rootMargin: '0px 0px 50px 0px',
      }
    );
  }

  messageInput = viewChild<ElementRef<HTMLTextAreaElement>>('messageInput');

  adjustTextareaHeight(textarea: HTMLTextAreaElement) {
    const val = textarea.value;
    if (val && !this.isTypingStatusSend()) {
      this.socketService.socket.emit('channelTyping', {
        receiverId: this.chatId(),
        isTyping: true,
      });
      this.isTypingStatusSend.set(true);
    } else if (!val && this.isTypingStatusSend()) {
      this.socketService.socket.emit('channelTyping', {
        receiverId: this.chatId(),
        isTyping: false,
      });
      this.isTypingStatusSend.set(false);
    }
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }

  private resetUI() {
    this.message.set('');
    this.isAssetsEntered.set(false);
    this.assetsData.set([]);
    this.base64AssetsData.set([]);

    const textarea = this.messageInput()?.nativeElement;
    if (textarea) {
      textarea.style.height = 'auto';
    }

    if (this.isTypingStatusSend()) {
      this.socketService.socket.emit('channelTyping', {
        receiverId: this.chatId(),
        isTyping: false,
      });
      this.isTypingStatusSend.set(false);
    }
  }

  sendMessage(event?: Event) {
    if (event) {
      event.preventDefault();
    }

    const messageContent = this.message().trim();
    const assets = this.assetsData();

    if (!messageContent && assets.length === 0) {
      return;
    }

    if (assets.length > 0) {
      const formData = new FormData();
      assets.forEach((file) => formData.append('files', file));

      this.userData.uploadFile(formData).subscribe({
        next: (res) => {
          if (res.data?.files && res.data.files.length > 0) {
            this.socketService.socket.emit('channelChatMessagesSend', {
              message: messageContent,
              channelId: this.chatId(),
              messageType: 'mixed',
              attachments: res.data.files,
            });
            this.resetUI();
          }
        },
        error: (err) => {
          console.error('File upload failed', err);
        },
      });
      return;
    }

    // Text-only message
    if (messageContent) {
      this.socketService.socket.emit('channelChatMessagesSend', {
        message: messageContent,
        channelId: this.chatId(),
        messageType: 'text',
      });
      this.resetUI();
    }
  }

  onFileSelected(event: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files) as File[];
      this.isAssetsEntered.set(true);
      this.assetsData.update((data) => [...data, ...fileArray]);
      this.prepareFilesPreview(fileArray);

      if (this.isTypingStatusSend()) {
        this.socketService.socket.emit('channelTyping', {
          receiverId: this.chatId(),
          isTyping: false,
        });
        this.isTypingStatusSend.set(false);
      }
    }
    // Reset input
    event.target.value = '';
  }

  scrollToFirstUnread() {
    if (this.unreadCount() === 0) return;

    // Use the oldest unread message (last in the array if sorted newest-first)
    const flatMessages = this.unreadMessages();
    const targetId = flatMessages[flatMessages.length - 1].id;

    const element = this.messageItems().find(
      (item) => item.nativeElement.getAttribute('data-id') === targetId
    );

    element?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  prepareFilesPreview(files: File[]) {
    this.base64AssetsData.update((data) => [
      ...new Array(files.length).fill({ file_type: '', file_url: '' }),
      ...data,
    ]);

    files.forEach((file, index) => {
      const fileType = file.type.includes('image')
        ? 'image'
        : file.type.includes('video')
        ? 'video'
        : 'pdf';
      this.base64AssetsData.update((data) => {
        const newData = [...data];
        newData[index] = {
          file_type: fileType,
          file_url: URL.createObjectURL(file),
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
        };
        return newData;
      });
    });
  }

  removeImage(index: number) {
    this.assetsData.update((data) => {
      const newData = [...data];
      newData.splice(index, 1);
      return newData;
    });
    this.base64AssetsData.update((data) => {
      const newData = [...data];
      newData.splice(index, 1);
      return newData;
    });
    if (this.assetsData().length === 0) {
      this.isAssetsEntered.set(false);
    }
  }

  viewAssets(attachment: AttachmentsType[], index: number) {
    this.dialog.open(AssetView, {
      maxWidth: '100%',
      maxHeight: '100%',
      width: '70%',
      height: '70%',
      panelClass: 'small-corners-dialog',
      data: {
        user: this.userData.user(),
        attachments: attachment,
        index: index,
        isObjectUrl: true,
      },
    });
  }

  private markRead() {
    this.socketService.socket.emit('markChannelRead', { channelId: this.chatId() });

    // Clear unread count locally
    this.userData.userChannels.update((channels) => {
      const index = channels.findIndex((c) => c.id === this.chatId());
      if (index !== -1) {
        channels[index].unread_count = 0;
        return [...channels];
      }
      return channels;
    });
  }

  membersUnseen(message: any) {
    const channelData = this.channelData();
    if (!channelData) return [];

    const userId = this.userData.user()?.id;
    return channelData.ChannelMembers.filter((m) => {
      if (m.user_id === message.sender_id) return false;
      if (m.user_id === userId) return false;
      if (!m.last_read_at) return true;
      return new Date(message.created_at) > new Date(m.last_read_at);
    });
  }

  openChannelInfo() {
    this.dialog.open(ChannelInfo, {
      maxWidth: '100%',
      maxHeight: '100%',
      width: '70%',
      height: '70%',
      panelClass: 'small-corners-dialog',
      data: {
        id: this.channelData()?.id,
        fromGroup: true,
      },
    });
  }
}
