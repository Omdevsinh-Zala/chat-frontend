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
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { SocketConnection } from '../../../services/socket-connection';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Chat as ChatMessage } from '../../../models/chat';
import { UserService } from '../../../services/user-service';
import { DatePipe } from '@angular/common';
import { environment } from '../../../../environments/environment';
import { MatDivider } from '@angular/material/divider';
import { ReceiverUser } from '../../../models/user';
import { ModifyPipe } from '../../../helpers/pipes/modify.pipe';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

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

  imagePath = environment.imageUrl;

  messageItems = viewChildren<ElementRef>('messageItem');

  private observer: IntersectionObserver | null = null;
  private pendingReadMessageIds = new Set<string>();
  receiverUser: WritableSignal<ReceiverUser | null> = signal(null);
  currentChatMessages: WritableSignal<ChatMessage[]> = signal<ChatMessage[]>([]);
  unreadCount = computed(() => this.unreadMessages().length);
  unreadMessages = computed(() => {
    const userId = this.userData.user()?.id;
    const chatId = this.chatId();
    return this.currentChatMessages().filter(
      (m) => m.status !== 'read' && m.sender_id === chatId && m.receiver_id === userId
    );
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
      }

      this.chatId.set(params['id']);
      this.currentChatMessages.set([]);
      this.receiverUser.set(null);

      this.socketService.socket.emit('chatChange', { receiverId: this.chatId() });

      this.socketService.socket.on(
        'chatMessages',
        (data: { chat: ChatMessage[]; receiverData: ReceiverUser }) => {
          this.currentChatMessages.set(data.chat);
          this.receiverUser.set(data.receiverData);
        }
      );

      this.socketService.socket.on('appendedMessages', (data: { chat: ChatMessage[] }) => {
        this.currentChatMessages.update((chat) => [...chat, ...data.chat]);
        this.canAppendMessages.set(true);
      });

      this.socketService.socket.on('receiveChatMessage', (data: { chat: ChatMessage }) => {
        // Only process messages that belong to this chat:
        // 1. Messages I sent to this person (sender: me, receiver: chatId)
        // 2. Messages this person sent to me (sender: chatId, receiver: me)
        const isMyMessage =
          data.chat.sender_id === this.userData.user()?.id &&
          data.chat.receiver_id === this.chatId();
        const isTheirMessage =
          data.chat.sender_id === this.chatId() &&
          data.chat.receiver_id === this.userData.user()?.id;

        if (!isMyMessage && !isTheirMessage) return;

        this.currentChatMessages.update((chat) => {
          const index = chat.findIndex((e) => e.id === data.chat.id);
          if (index === -1) {
            // New message - add it to the top
            return [data.chat, ...chat];
          } else {
            // Existing message - update it (e.g., status change)
            const updatedChat = [...chat];
            updatedChat[index] = data.chat;

            // Remove from pending if it was there
            if (data.chat.status === 'read') {
              this.pendingReadMessageIds.delete(data.chat.id);
            }

            return updatedChat;
          }
        });
      });
    });

    this.destroyRef.onDestroy(() => {
      const currentId = this.chatId();
      if (currentId) {
        this.socketService.socket.off('receiveChatMessage');
        this.socketService.socket.off('chatMessages');
        this.socketService.socket.off('appendedMessages');
      }
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
            const messageId = entry.target.getAttribute('data-id');
            if (messageId) {
              // Find the message in our array to check who sent it
              const message = this.currentChatMessages().find((m) => m.id === messageId);

              // Only mark as read if:
              // 1. Message was sent by the OTHER user (sender is chatId)
              // 2. Message was received by ME (receiver is current user)
              // 3. Message is not already marked as 'read'
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
              // Only unobserve if NOT the last message, to keep the append trigger active
              const isLastMessage =
                entry.target.getAttribute('data-id') ===
                this.currentChatMessages()[this.currentChatMessages().length - 1]?.id;

              if (!isLastMessage) {
                this.observer?.unobserve(entry.target);
              }
            }
            if (
              entry.target.getAttribute('data-id') ===
                this.currentChatMessages()[this.currentChatMessages().length - 1]?.id &&
              this.canAppendMessages()
            ) {
              this.canAppendMessages.set(false);
              setTimeout(() => {
                this.socketService.socket.emit('appendMessages', {
                  receiverId: this.chatId(),
                  offset: this.currentChatMessages().length,
                });
              }, 300);
            }
          }
        });
      },
      {
        root: null, // viewport
        threshold: 0.1, // Relaxed threshold for tall messages
        rootMargin: '0px 0px 50px 0px', // Trigger slightly before reaching the bottom
      }
    );
  }

  messageInput = viewChild<ElementRef<HTMLTextAreaElement>>('messageInput');

  adjustTextareaHeight(textarea: HTMLTextAreaElement) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }

  sendMessage(event: any) {
    if (event) {
      event.preventDefault();
    }
    if (!this.message()) return;
    this.socketService.socket.emit('chatMessagesSend', {
      message: this.message(),
      receiverId: this.chatId(),
    });
    this.message.set('');

    // Reset textarea height
    const textarea = this.messageInput()?.nativeElement;
    if (textarea) {
      textarea.style.height = 'auto';
    }
  }

  scrollToFirstUnread() {
    if (this.unreadCount() === 0) return;

    // Use the oldest unread message (last in the array if sorted newest-first)
    const targetId = this.unreadMessages()[this.unreadMessages().length - 1].id;

    const element = this.messageItems().find(
      (item) => item.nativeElement.getAttribute('data-id') === targetId
    );

    element?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}
