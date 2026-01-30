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
import { DatePipe } from '@angular/common';
import { OverlayModule } from '@angular/cdk/overlay';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDivider } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { AssetView } from '../../../dialogs/asset-view/asset-view';
import { AttachmentsType, GroupedChat } from '../../../models/chat';
import { Responsive } from '../../../services/responsive';
import { SocketConnection } from '../../../services/socket-connection';
import { UserService } from '../../../services/user-service';
import { ModifyPipe } from '../../../helpers/pipes/modify.pipe';
import { AssetContainer } from '../chat/asset-container/asset-container';
import { ChannelData } from '../../../models/channel';
import { ChannelInfo } from '../../../dialogs/channel-info/channel-info';
import { ImageUrlPipe } from '../../../image-url-pipe';
import { compressImage } from '../../../helpers/compression-helper';
import { EmojiPicker } from '../../../components/emoji-picker/emoji-picker';
import { MessageSnackBar } from '../../../helpers/message-snack-bar/message-snack-bar';
import { Confirmation } from '../../../dialogs/confirmation/confirmation';
import { EmojiService } from '../../../services/emoji-service';

@Component({
  selector: 'app-channel-chat',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIcon,
    MatIconModule,
    FormsModule,
    DatePipe,
    MatDivider,
    ModifyPipe,
    MatProgressSpinner,
    AssetContainer,
    MatCardModule,
    ImageUrlPipe,
    EmojiPicker,
    OverlayModule,
    MatSnackBarModule,
    MatTooltipModule,
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
  private _snackbar = inject(MatSnackBar);
  private emojiService = inject(EmojiService);
  private responsiveService = inject(Responsive);
  loadingChat = signal(true);
  showEmojiPicker = signal(false);

  isShortEmojiCodeTyped = signal(false);

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

  messageItems = viewChildren<ElementRef>('messageItem');

  emojiSearchResults = signal<any[]>([]);
  private currentShortcodeStartIndex = -1;
  private emojiSearchSubject = new Subject<string>();

  private observer: IntersectionObserver | null = null;
  private isTypingStatusSend = signal(false);
  private pendingReadMessageIds = new Set<string>();
  typingUsers = signal<{ userId: string; fullName: string; timeout?: any }[]>([]);
  typingIndicatorText = computed(() => {
    const users = this.typingUsers();
    if (users.length === 0) return '';
    if (users.length === 1) return `${users[0].fullName} is typing...`;
    if (users.length === 2) return `${users[0].fullName} and ${users[1].fullName} are typing...`;
    return `${users[0].fullName}, ${users[1].fullName} and ${users.length - 2} others are typing...`;
  });
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
  canInvite = computed(() => {
    const userId = this.userData.user()?.id;
    const myMember = this.channelData()?.ChannelMembers.find((m) => m.user_id === userId);
    return myMember?.role === 'owner' || myMember?.role === 'admin';
  });

  message = model('');

  private onChannelMessages = (data: {
    chat: GroupedChat[];
    channelData: any;
    b2AuthToken: string;
  }) => {
    this.userData.user.update((user) => ({ ...user!, token: data.b2AuthToken }));
    this.currentChatMessages.set(data.chat);
    this.channelData.set(data.channelData);
    this.loadingChat.set(false);
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

  private onChannelMemberTyping = (data: { senderId: string; isTyping: boolean }) => {
    const userId = this.userData.user()?.id;
    if (data.senderId === userId) return;

    this.typingUsers.update((users) => {
      const existingUserIndex = users.findIndex((u) => u.userId === data.senderId);

      if (data.isTyping) {
        const member = this.channelData()?.ChannelMembers.find((m) => m.user_id === data.senderId);
        const fullName = member?.User?.full_name || 'Someone';

        const updatedUsers = [...users];
        if (existingUserIndex !== -1) {
          clearTimeout(updatedUsers[existingUserIndex].timeout);
          updatedUsers[existingUserIndex] = {
            ...updatedUsers[existingUserIndex],
            timeout: setTimeout(
              () => this.onChannelMemberTyping({ senderId: data.senderId, isTyping: false }),
              5000,
            ),
          };
        } else {
          updatedUsers.push({
            userId: data.senderId,
            fullName,
            timeout: setTimeout(
              () => this.onChannelMemberTyping({ senderId: data.senderId, isTyping: false }),
              5000,
            ),
          });
        }
        return updatedUsers;
      } else {
        if (existingUserIndex !== -1) {
          clearTimeout(users[existingUserIndex].timeout);
          const updatedUsers = [...users];
          updatedUsers.splice(existingUserIndex, 1);
          return updatedUsers;
        }
        return users;
      }
    });
  };

  private setupListeners() {
    this.socketService.socket.on('channelChatMessages', this.onChannelMessages);
    this.socketService.socket.on('appendedChannelMessages', this.onAppendedChannelMessages);
    this.socketService.socket.on('receiveChannelChatMessage', this.onReceiveChannelChatMessage);
    this.socketService.socket.on('channelReadUpdated', this.onChannelReadUpdated);
    this.socketService.socket.on('channelMemberTyping', this.onChannelMemberTyping);
    this.socketService.socket.on('channelInviteCreated', this.onChannelInviteCreated);
    this.socketService.socket.on('createChannelInviteError', this.onChannelInviteError);
  }

  private removeListeners() {
    this.socketService.socket.off('channelChatMessages', this.onChannelMessages);
    this.socketService.socket.off('appendedChannelMessages', this.onAppendedChannelMessages);
    this.socketService.socket.off('receiveChannelChatMessage', this.onReceiveChannelChatMessage);
    this.socketService.socket.off('channelReadUpdated', this.onChannelReadUpdated);
    this.socketService.socket.off('channelMemberTyping', this.onChannelMemberTyping);
    this.socketService.socket.off('channelInviteCreated', this.onChannelInviteCreated);
    this.socketService.socket.off('createChannelInviteError', this.onChannelInviteError);
  }

  private onChannelInviteCreated = (data: { invite: any }) => {
    const inviteUrl = `${window.location.origin}/invite/${data.invite.token}`;
    this.dialog
      .open(Confirmation, {
        data: {
          title: 'Invite Link Generated',
          message: `Share this link with someone to join the channel: ${inviteUrl}`,
          confirmJson: 'Copy Link',
        },
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          navigator.clipboard.writeText(inviteUrl);
          this._snackbar.openFromComponent(MessageSnackBar, {
            panelClass: 'success-panel',
            duration: 4000,
            data: 'Link copied to clipboard!',
          });
        }
      });
  };

  private onChannelInviteError = (data: { error: string }) => {
    this._snackbar.openFromComponent(MessageSnackBar, {
      panelClass: 'error-panel',
      duration: 4000,
      data: data.error,
    });
  };

  ngOnInit(): void {
    this.setupListeners();

    this.router.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params: any) => {
      const previousChatId = this.chatId();
      this.chatId.set(params['id']);
      this.currentChatMessages.set([]);
      this.channelData.set(null);
      this.typingUsers.set([]);
      this.markRead();

      this.socketService.socket.emit('channelChatChange', { channelId: this.chatId() });
    });

    this.destroyRef.onDestroy(() => {
      this.removeListeners();
      this.observer?.disconnect();
    });

    this.setupObserver();

    this.emojiSearchSubject
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(async (searchValue) => {
        this.isShortEmojiCodeTyped.set(true);
        const result = await this.emojiService.searchedData(searchValue);
        if (result && result.length > 0) {
          this.emojiSearchResults.set(result);
        } else {
          this.emojiSearchResults.set([]);
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
      },
    );
  }

  messageInput = viewChild<ElementRef<HTMLTextAreaElement>>('messageInput');

  adjustTextareaHeight(textarea: HTMLTextAreaElement) {
    const val = textarea.value;
    const cursorPosition = textarea.selectionStart;
    const textBeforeCursor = val.substring(0, cursorPosition);
    const lastColonIndex = textBeforeCursor.lastIndexOf(':');

    let isShortcode = false;

    if (lastColonIndex !== -1) {
      const potentialShortcode = textBeforeCursor.substring(lastColonIndex + 1);
      // Check if there are spaces in the potential shortcode
      // User requirement: :laugh works, : laugh does not.
      if (!/\s/.test(potentialShortcode) && potentialShortcode.length > 0) {
        isShortcode = true;
        this.currentShortcodeStartIndex = lastColonIndex;
        this.emojiSearchSubject.next(potentialShortcode);
      }
    }

    if (!isShortcode) {
      this.isShortEmojiCodeTyped.set(false);
      this.currentShortcodeStartIndex = -1;
    }

    if (val && !this.isTypingStatusSend()) {
      this.socketService.socket.emit('channelMemberTyping', {
        channelId: this.chatId(),
        isTyping: true,
      });
      this.isTypingStatusSend.set(true);
    } else if (!val && this.isTypingStatusSend()) {
      this.socketService.socket.emit('channelMemberTyping', {
        channelId: this.chatId(),
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
      this.socketService.socket.emit('channelMemberTyping', {
        channelId: this.chatId(),
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

          const basePath = `channels/${this.chatId()}`;

          formData.append('chatPath', basePath);

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
        } catch (error) {
          console.error('Error processing files', error);
        }
      })();
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
        this.socketService.socket.emit('channelMemberTyping', {
          channelId: this.chatId(),
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

  generateInvite(event: Event) {
    event.stopPropagation();
    this.socketService.socket.emit('createChannelInvite', { channelId: this.chatId() });
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

  onAutocompleteSelect(emoji: string) {
    const textarea = this.messageInput()?.nativeElement;
    if (!textarea || this.currentShortcodeStartIndex === -1) return;

    const cursor = textarea.selectionStart;
    const start = this.currentShortcodeStartIndex;

    // Replace from start (colon) to cursor (end of typed word) with emoji
    const text = this.message();
    const before = text.substring(0, start);
    const after = text.substring(cursor);

    this.message.set(before + emoji + after);

    this.isShortEmojiCodeTyped.set(false);
    this.emojiSearchResults.set([]);
    this.currentShortcodeStartIndex = -1;

    // Restore focus and cursor
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + emoji.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      this.adjustTextareaHeight(textarea);
    }, 0);
  }
}
