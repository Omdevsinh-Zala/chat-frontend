import {
  AfterViewInit,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Injector,
  model,
  OnInit,
  signal,
  viewChildren,
  viewChild,
  WritableSignal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { OverlayModule } from '@angular/cdk/overlay';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDivider } from '@angular/material/divider';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { SocketConnection } from '../../../services/socket-connection';
import { AttachmentsType, GroupedChat } from '../../../models/chat';
import { UserService } from '../../../services/user-service';
import { ReceiverUser } from '../../../models/user';
import { ModifyPipe } from '../../../helpers/pipes/modify.pipe';
import { AssetContainer } from './asset-container/asset-container';
import { AssetView } from '../../../dialogs/asset-view/asset-view';
import { Responsive } from '../../../services/responsive';
import { ProfileInfo } from '../../../dialogs/profile-info/profile-info';
import { ImageUrlPipe } from '../../../image-url-pipe';
import { compressImage } from '../../../helpers/compression-helper';
import { EmojiPicker } from '../../../components/emoji-picker/emoji-picker';

@Component({
  selector: 'app-chat',
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
    MatToolbarModule,
    MatCardModule,
    ImageUrlPipe,
    EmojiPicker,
    OverlayModule,
  ],
  templateUrl: './chat.html',
  styleUrl: './chat.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Chat implements OnInit, AfterViewInit {
  private socketService = inject(SocketConnection);
  private router = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  private chatId = signal('');
  userData = inject(UserService);
  private injector = inject(Injector);
  private dialog = inject(MatDialog);
  private responsiveService = inject(Responsive);
  loadingChat = signal(true);
  isMessageSending = signal(false);
  showEmojiPicker = signal(false);

  isTyping = computed(() => {
    return (
      (this.receiverUser()?.is_typing ||
        this.userData.recentlyMessagesUsers()?.find((user) => user.id === this.chatId())
          ?.is_typing) &&
      this.chatId() !== this.userData.user()?.id
    );
  });

  isTablet = this.responsiveService.isTabletForBase;
  isOpen = this.responsiveService.basePanelOpen;
  isHomeOpen = this.responsiveService.homePanelOpen;

  openForHome() {
    this.responsiveService.homePanelOpen.update((value) => true);
  }

  isAssetsEntered = signal(false);
  assetsData: WritableSignal<File[]> = signal([]);
  base64AssetsData: WritableSignal<AttachmentsType[]> = signal([]);

  messageItems = viewChildren<ElementRef>('messageItem');

  private observer: IntersectionObserver | null = null;
  private isTypingStatusSend = signal(false);
  private pendingReadMessageIds = new Set<string>();
  receiverUser: WritableSignal<ReceiverUser | null> = signal(null);
  currentChatMessages: WritableSignal<GroupedChat[]> = signal<GroupedChat[]>([]);
  unreadCount = computed(() => this.unreadMessages().length);
  unreadMessages = computed(() => {
    const userId = this.userData.user()?.id;
    const chatId = this.chatId();
    return this.currentChatMessages()
      .flatMap((group) => group.messages)
      .filter((m) => m.status !== 'read' && m.sender_id === chatId && m.receiver_id === userId);
  });
  canAppendMessages = signal(true);

  message = model('');

  ngOnInit(): void {
    this.router.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params: any) => {
      const previousChatId = this.chatId();
      if (previousChatId) {
        this.socketService.socket.off('receiveChatMessage');
        this.socketService.socket.off('chatMessages');
        this.socketService.socket.off('appendedMessages');
        this.socketService.socket.off('typing');
        this.socketService.socket.off('userTyping');
      }

      this.chatId.set(params['id']);
      this.currentChatMessages.set([]);
      this.receiverUser.set(null);

      this.socketService.socket.emit('chatChange', { receiverId: this.chatId() });

      this.socketService.socket.on('userTyping', (data: { isTyping: boolean }) => {
        this.receiverUser.update((user) => {
          if (user) {
            return { ...user, is_typing: data.isTyping! };
          }
          return user;
        });
      });

      this.socketService.socket.on(
        'chatMessages',
        (data: { chat: GroupedChat[]; receiverData: ReceiverUser; b2AuthToken: string }) => {
          this.userData.user.update((user) => ({ ...user!, token: data.b2AuthToken }));
          this.currentChatMessages.set(data.chat);
          this.receiverUser.set(data.receiverData);
          this.loadingChat.set(false);
        },
      );

      this.socketService.socket.on('appendedMessages', (data: { chat: GroupedChat[] }) => {
        this.currentChatMessages.update((chat) => {
          const updatedChat = [...chat];
          data.chat.forEach((newGroup) => {
            const existingGroupIndex = updatedChat.findIndex(
              (g) => g.monthYear === newGroup.monthYear,
            );
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
      });

      this.socketService.socket.on('receiveChatMessage', (data: { chat: GroupedChat }) => {
        const message = data.chat.messages?.[0];
        const dateKey = data.chat.monthYear;

        const isMyMessage =
          message.sender_id === this.userData.user()?.id && message.receiver_id === this.chatId();
        const isTheirMessage =
          message.sender_id === this.chatId() && message.receiver_id === this.userData.user()?.id;

        if (!isMyMessage && !isTheirMessage) return;

        this.currentChatMessages.update((chat) => {
          const updatedChat = [...chat];
          // Check if message already exists in any group
          let messageIndex = -1;
          let groupIndex = -1;
          for (let i = 0; i < updatedChat.length; i++) {
            messageIndex = updatedChat[i].messages.findIndex((m) => m.id === message.id);
            if (messageIndex !== -1) {
              groupIndex = i;
              break;
            }
          }

          if (messageIndex === -1) {
            // New message
            const gIndex = updatedChat.findIndex((g) => g.monthYear === dateKey);
            if (gIndex !== -1) {
              updatedChat[gIndex] = {
                ...updatedChat[gIndex],
                messages: [message, ...updatedChat[gIndex].messages],
              };
            } else {
              updatedChat.unshift({ monthYear: dateKey, messages: [message] });
            }
          } else {
            // Update existing message
            const updatedMessages = [...updatedChat[groupIndex].messages];
            updatedMessages[messageIndex] = message;
            updatedChat[groupIndex] = { ...updatedChat[groupIndex], messages: updatedMessages };

            if (message.status === 'read') {
              this.pendingReadMessageIds.delete(message.id);
            }
          }
          return updatedChat;
        });
      });
    });

    this.destroyRef.onDestroy(() => {
      this.cleanupSockets();
      this.cleanupPreviewUrls();
      this.observer?.disconnect();
    });

    this.setupObserver();
  }

  private cleanupSockets() {
    const socket = this.socketService.socket;
    socket.off('receiveChatMessage');
    socket.off('chatMessages');
    socket.off('appendedMessages');
    socket.off('typing');
    socket.off('userTyping');
  }

  private cleanupPreviewUrls() {
    this.base64AssetsData().forEach((asset) => {
      if (asset.file_url?.startsWith('blob:')) {
        URL.revokeObjectURL(asset.file_url);
      }
    });
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
      { injector: this.injector },
    );
  }

  private setupObserver() {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const messageId = entry.target.getAttribute('data-id');
            const flatMessages = this.currentChatMessages().flatMap((g) => g.messages);

            if (messageId) {
              const message = flatMessages.find((m) => m.id === messageId);
              if (
                message &&
                message.sender_id === this.chatId() &&
                message.receiver_id === this.userData.user()?.id &&
                message.status !== 'read' &&
                !this.pendingReadMessageIds.has(messageId)
              ) {
                this.pendingReadMessageIds.add(messageId);
                this.socketService.socket.emit('readMessage', {
                  messageId,
                  receiverId: this.userData.user()?.id,
                });
              }
              const isLastMessage = messageId === flatMessages[flatMessages.length - 1]?.id;
              if (!isLastMessage) {
                this.observer?.unobserve(entry.target);
              }
            }

            if (
              entry.target.getAttribute('data-id') === flatMessages[flatMessages.length - 1]?.id &&
              this.canAppendMessages()
            ) {
              this.canAppendMessages.set(false);
              setTimeout(() => {
                this.socketService.socket.emit('appendMessages', {
                  receiverId: this.chatId(),
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
      },
    );
  }

  messageInput = viewChild<ElementRef<HTMLTextAreaElement>>('messageInput');

  adjustTextareaHeight(textarea: HTMLTextAreaElement) {
    const val = textarea.value;
    if (val && !this.isTypingStatusSend()) {
      this.socketService.socket.emit('typing', {
        receiverId: this.chatId(),
        isTyping: true,
      });
      this.isTypingStatusSend.set(true);
    } else if (!val && this.isTypingStatusSend()) {
      this.socketService.socket.emit('typing', {
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
      this.socketService.socket.emit('typing', {
        receiverId: this.chatId(),
        isTyping: false,
      });
      this.isTypingStatusSend.set(false);
    }
  }

  sendMessage(event?: Event) {
    this.isMessageSending.set(true);
    if (event) {
      event.preventDefault();
    }

    const messageContent = this.message().trim();
    const assets = this.assetsData();

    if (!messageContent && assets.length === 0) {
      this.isMessageSending.set(false);
      return;
    }

    if (assets.length > 0) {
      const formData = new FormData();

      (async () => {
        try {
          const processedFiles = await Promise.all(
            assets.map(async (file) => {
              if (file.type.startsWith('image/')) {
                return await compressImage(file);
              }
              return file;
            }),
          );

          processedFiles.forEach((file) => formData.append('files', file));

          const sortUser = [this.userData.user()?.id, this.chatId()].sort().join('-');
          const basePath = `users/${sortUser}`;

          formData.append('chatPath', basePath);

          this.userData.uploadFile(formData).subscribe({
            next: (res) => {
              if (res.data?.files && res.data.files.length > 0) {
                this.socketService.socket.emit('chatMessagesSend', {
                  message: messageContent,
                  receiverId: this.chatId(),
                  messageType: 'mixed',
                  attachments: res.data.files,
                });
                this.resetUI();
                this.isMessageSending.set(false);
              }
            },
            error: (err) => {
              console.error('File upload failed', err);
              this.isMessageSending.set(false);
            },
          });
        } catch (error) {
          console.error('Error processing files', error);
          this.isMessageSending.set(false);
        }
      })();
      return;
    }

    // Text-only message
    if (messageContent) {
      this.socketService.socket.emit('chatMessagesSend', {
        message: messageContent,
        receiverId: this.chatId(),
        messageType: 'text',
      });
      this.resetUI();
      this.isMessageSending.set(false);
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
        this.socketService.socket.emit('typing', {
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
      (item) => item.nativeElement.getAttribute('data-id') === targetId,
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
    const assetToRemove = this.base64AssetsData()[index];
    if (assetToRemove?.file_url?.startsWith('blob:')) {
      URL.revokeObjectURL(assetToRemove.file_url);
    }

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

  openProfileInfo() {
    this.dialog.open(ProfileInfo, {
      maxWidth: '100%',
      maxHeight: '100%',
      width: '70%',
      height: '70%',
      panelClass: 'small-corners-dialog',
      data: {
        id: this.receiverUser()?.id,
      },
    });
  }

  onEmojiSelect(emoji: string) {
    const textarea = this.messageInput()?.nativeElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = this.message();
    const before = text.substring(0, start);
    const after = text.substring(end);

    this.message.set(before + emoji + after);

    // Reset cursor position after change detection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + emoji.length, start + emoji.length);
      this.adjustTextareaHeight(textarea);
    }, 0);
  }
}
